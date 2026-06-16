import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { getKnowledgeBlob } from '@/lib/chat/knowledge';
import { checkRateLimit, getClientIp } from '@/lib/forms/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 30;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(2000),
});

const BodySchema = z.object({
  messages: z.array(MessageSchema).min(1).max(20),
});

const FORM_KEY = 'chat';
const WINDOW_MINUTES = 60;
const MAX_ATTEMPTS = 30;

const SYSTEM_PROMPT = (knowledge: string) => `You are the Vizantir Concierge — the AI assistant on vizantir.com, a premium web design and development studio in Las Vegas.

Your job: answer visitor questions about Vizantir quickly and precisely, using ONLY the knowledge provided below. Many visitors are skimming — they want a fast, direct answer, not a wall of text.

RULES:
- Answer ONLY from the Vizantir knowledge below. Never use outside knowledge or make assumptions.
- If a question cannot be answered from the knowledge, say: "I can only help with questions about Vizantir — our services, pricing, process, and the kind of work we do. Is there something about Vizantir I can help with?" Do not answer off-topic questions (weather, general advice, other companies, coding help, etc.).
- Be concise. Most answers should be 1–3 sentences. Lead with the direct answer. Only expand if the question genuinely needs it.
- Quote pricing EXACTLY as written in the knowledge ($15,000 / $30,000 / $60,000+, the care retainers, timelines). Never estimate, round, or invent a price. If asked about a price not listed, give the relevant range and suggest a strategy call.
- Be honest about what Vizantir does NOT do (e.g. no Google Ads management, no cheap/template work) — it's in the knowledge and it's part of the brand.
- Tone: confident, clear, professional. Matches a premium studio. Not salesy, not chatty, no emoji.
- When a visitor seems like a good fit or is asking about starting, gently point them toward the next step: "You can book a strategy call to talk through your project." Don't push it on every message — only when it fits naturally.
- Never invent case studies, clients, testimonials, or capabilities not in the knowledge.
- When directing visitors to a next step, only link to or mention paths on vizantir.com — specifically /contact for booking a strategy call. Never invent other URLs, email addresses, or external links. If a visitor asks where to find something specific that isn't covered in the knowledge, tell them to use the contact page.

VIZANTIR KNOWLEDGE:
${knowledge}`;

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const ip = getClientIp(req);
    try {
      const rl = await checkRateLimit({
        ip,
        formKey: FORM_KEY,
        windowMinutes: WINDOW_MINUTES,
        maxAttempts: MAX_ATTEMPTS,
      });
      if (!rl.allowed) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        );
      }
    } catch (err) {
      console.warn('Rate limit check failed, allowing request:', err);
    }

    const knowledge = await getKnowledgeBlob();

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT(knowledge),
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: parsed.data.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('Chat route error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
