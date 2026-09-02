import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook'
import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

type WebhookBody = {
  _type?: unknown
}

function tagsForType(type: unknown): string[] {
  if (type === 'post' || type === 'author') {
    return ['post', 'author']
  }

  if (type === 'siteSettings') {
    return ['siteSettings']
  }

  return ['post']
}

export async function POST(request: Request) {
  const secret = process.env.SANITY_REVALIDATE_SECRET
  if (!secret) {
    return new NextResponse('Missing SANITY_REVALIDATE_SECRET', { status: 500 })
  }

  const rawBody = await request.text()
  const signature = request.headers.get(SIGNATURE_HEADER_NAME) ?? ''

  if (!(await isValidSignature(rawBody, signature, secret))) {
    return new NextResponse('Invalid signature', { status: 401 })
  }

  let body: WebhookBody
  try {
    body = JSON.parse(rawBody) as WebhookBody
  } catch {
    return new NextResponse('Invalid JSON', { status: 400 })
  }

  const tags = tagsForType(body._type)

  for (const tag of tags) {
    revalidateTag(tag, 'max')
  }

  return NextResponse.json({
    revalidated: true,
    tags,
    now: Date.now(),
  })
}
