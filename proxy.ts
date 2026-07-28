import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Config redirects re-append unmatched query params, so page_id must be
// stripped here to avoid a self-referential loop on `/?page_id=*`.
export function proxy(request: NextRequest) {
  if (
    request.nextUrl.pathname === '/' &&
    request.nextUrl.searchParams.has('page_id')
  ) {
    const url = request.nextUrl.clone();
    url.searchParams.delete('page_id');
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/',
};
