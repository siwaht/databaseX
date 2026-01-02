import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// NOTE: next-auth v4 is NOT compatible with Edge Runtime due to crypto dependencies.
// Using default Node.js runtime. For Edge compatibility, upgrade to Auth.js v5.

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

