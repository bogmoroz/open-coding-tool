import { getSession } from 'next-auth/react';
import prisma from '../../../lib/prisma';
import { Code } from '../../../types';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

// PUT /api/update-code-parents
export default async function handle(req, res) {
  const session = await getServerSession(req, res, authOptions);

  console.log(session);

  if (!session) {
    res.status(401).end();
    return;
  }

  const updatedCodes: Code[] = req.body;

  console.log(updatedCodes);

  const updatedResults = [];

  for (const updatedCode of updatedCodes) {
    if (!updatedCode.children) {
      continue;
    }
    try {
      const result = await prisma.code.update({
        where: { id: updatedCode.id },
        data: {
          children: {
            set: updatedCode.children.map((childCode) => ({ id: childCode.id }))
          }
        }
      });
      updatedResults.push(result);
    } catch (error) {
      console.error(`Error updating code with ID ${updatedCode.id}:`, error);
    }
  }

  res.json({ updatedResults });
}
