import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

interface SanityWebhookPayload {
  _type: string
  _id: string
  slug?: { current: string }
}

/**
 * Webhook endpoint for Sanity to trigger cache revalidation
 * 
 * Setup in Sanity:
 * 1. Go to sanity.io/manage → Your Project → API → Webhooks
 * 2. Create webhook pointing to: https://yoursite.com/api/revalidate
 * 3. Add header: x-sanity-webhook-secret = YOUR_SECRET
 * 4. Trigger on: Create, Update, Delete
 */
export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get('x-sanity-webhook-secret')
    
    if (secret !== process.env.SANITY_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
    }

    const body: SanityWebhookPayload = await request.json()
    const { _type, slug } = body
    const slugValue = slug?.current

    const revalidatedTags: string[] = []

    // Map document types to cache tags
    // Customize this for your content types
    const tagMap: Record<string, string[]> = {
      post: ['posts'],
      service: ['services'],
      location: ['locations'],
      category: ['categories'],
      author: ['authors', 'posts'], // Authors affect posts too
      siteSettings: ['settings', 'posts', 'services', 'locations', 'categories'],
    }

    const tagsToRevalidate = tagMap[_type] || []
    
    for (const tag of tagsToRevalidate) {
      revalidateTag(tag, 'max')
      revalidatedTags.push(tag)
    }

    // Also revalidate the specific slug if present
    if (slugValue) {
      const slugTag = `${_type}-${slugValue}`
      revalidateTag(slugTag, 'max')
      revalidatedTags.push(slugTag)
    }

    console.log(`[Revalidate] Type: ${_type}, Tags: ${revalidatedTags.join(', ')}`)

    return NextResponse.json({
      revalidated: true,
      tags: revalidatedTags,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Revalidation error:', error)
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 })
  }
}

