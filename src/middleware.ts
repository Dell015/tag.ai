import { NextResponse, type NextRequest } from 'next/server';

/**
 * Stage A: no server-side auth — the "account" is a local profile, so every
 * request passes straight through. Stage B re-adds the Supabase session refresh
 * (see CLAUDE.md §6) and gates /api routes, not pages.
 */
export function middleware(request: NextRequest) {
  void request;
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
