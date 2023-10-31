import NextAuth from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GitHubProvider from 'next-auth/providers/github';
import prisma from '../../../lib/prisma';

const allowedEmails = ['bogdan.moroz@observis.fi'];

export const authOptions = {
  // Configure one or more authentication providers
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET
    })
  ],

  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn(response) {
      console.log('LOGGED IN');
      console.log(response);
      const isAllowed = allowedEmails.includes(response.user.email);
      return isAllowed;
    }
  }
};

export default NextAuth(authOptions);
