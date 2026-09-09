import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl
  const hostname = request.headers.get('host') || 'localhost:3000'

  // Define allowed domains (including local)
  const allowedDomains = ['localhost:3000', 'alumniconnect.com']
  const isMainDomain = allowedDomains.some((domain) => hostname === domain)

  // Extract the subdomain if present
  let subdomain = ''
  if (!isMainDomain) {
    // Example: moiuni.localhost:3000 -> moiuni
    subdomain = hostname.split('.')[0]
  }

  // Rewrite logic for subdomains
  if (subdomain) {
    // We rewrite the request to the dynamic route /tenant/[domain]/...
    // e.g. moiuni.localhost:3000/login -> /tenant/moiuni/login
    return NextResponse.rewrite(new URL(`/tenant/${subdomain}${url.pathname}${url.search}`, request.url))
  }

  // Handle main domain routes here (e.g. platform marketing page, super admin login)
  if (isMainDomain && url.pathname === '/') {
     // For now, let it hit the root page
     return supabaseResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
