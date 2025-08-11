import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { verifyUser } from "@/lib/azure-tables"

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        // verifyUser should return user object if valid, else null
        const user = await verifyUser(credentials.email, credentials.password)
        if (user) {
          return { id: user.id, email: user.email, role: user.role }
        }
        return null
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token?.role) {
        session.user.role = token.role
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
