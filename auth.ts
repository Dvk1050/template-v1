import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"
import type { DefaultSession, NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"

// Import the Auth.js functions with named imports
import { getServerSession } from "next-auth"

// Import the Auth.js initialization function
import { AuthError, SignIn, SignOut, auth as nextAuth } from "next-auth/core"

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string
    } & DefaultSession["user"]
  }
}

export const authConfig = {
  adapter: DrizzleAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // In a real application, you would verify credentials against your database
        if (credentials?.email === "user@example.com" && credentials?.password === "password") {
          return {
            id: "1",
            name: "Demo User",
            email: "user@example.com",
            image: "https://ui-avatars.com/api/?name=Demo+User",
          }
        }
        return null
      },
    }),
  ],
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    session: ({ session, token }) => {
      if (token && session.user) {
        session.user.id = token.sub as string
      }
      return session
    },
    jwt: ({ token, user }) => {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
} satisfies NextAuthConfig

// Helper function to get the session on the server
export const auth = async () => {
  const session = await getServerSession(authConfig)
  return session
}

// Export the Auth.js handlers
export const { GET, POST } = nextAuth(authConfig)

// Export signIn and signOut functions
export const signIn = SignIn
export const signOut = SignOut
export const authError = AuthError

