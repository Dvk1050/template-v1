import { NextResponse } from "next/server"
import { auth } from "./auth"
import type { NextRequest } from "next/server"

// Supported languages
const supportedLanguages = ["en-US", "fr-FR", "de-DE", "es-ES", "ja-JP"]

// Default language
const defaultLanguage = "en-US"

// Function to get the preferred language from the request
function getPreferredLanguage(request: NextRequest): string {
  // Check for language in the URL path
  const pathname = request.nextUrl.pathname
  const pathnameLanguage = supportedLanguages.find(
    (lang) => pathname.startsWith(`/${lang}/`) || pathname === `/${lang}`,
  )

  if (pathnameLanguage) {
    return pathnameLanguage
  }

  // Check for language in the cookie
  const cookieLanguage = request.cookies.get("NEXT_LOCALE")?.value
  if (cookieLanguage && supportedLanguages.includes(cookieLanguage)) {
    return cookieLanguage
  }

  // Check for language in the Accept-Language header
  const acceptLanguage = request.headers.get("Accept-Language")
  if (acceptLanguage) {
    const preferredLanguages = acceptLanguage.split(",").map((lang) => lang.split(";")[0].trim())

    for (const lang of preferredLanguages) {
      const matchedLanguage = supportedLanguages.find(
        (supported) => lang.startsWith(supported) || supported.startsWith(lang),
      )
      if (matchedLanguage) {
        return matchedLanguage
      }
    }
  }

  // Default to English
  return defaultLanguage
}

export async function middleware(req: NextRequest) {
  const { nextUrl } = req

  // Get the auth session
  const session = await auth()
  const isLoggedIn = !!session?.user

  // Get the preferred language
  const preferredLanguage = getPreferredLanguage(req)

  // Public paths that don't require authentication
  const isPublicPath =
    nextUrl.pathname === "/" ||
    nextUrl.pathname === "/signin" ||
    nextUrl.pathname === "/signup" ||
    nextUrl.pathname.startsWith("/api/") ||
    nextUrl.pathname.includes("#")

  // If the user is not logged in and trying to access a protected route
  if (!isLoggedIn && !isPublicPath) {
    return NextResponse.redirect(new URL("/signin", nextUrl))
  }

  // If the user is logged in and trying to access auth pages
  if (isLoggedIn && (nextUrl.pathname === "/signin" || nextUrl.pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }

  // Set language cookie for future requests
  const response = NextResponse.next()
  response.cookies.set("NEXT_LOCALE", preferredLanguage, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })

  return response
}

// Optionally configure middleware to match specific paths
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

