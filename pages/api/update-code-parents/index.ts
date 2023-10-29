import { getSession } from 'next-auth/react';
import prisma from '../../../lib/prisma';
import { Code } from '../../../types';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

// PUT /api/update-code-parents
export default async function handle(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    res.status(401).end();
    return;
  }

  const updatedCodes: Code[] = req.body;

  const updatedResults = [];

  for (const updatedCode of updatedCodes) {
    try {
      const result = await prisma.code.update({
        where: { id: updatedCode.id },
        data: {
          parentId: updatedCode.parentId
        }
      });
      updatedResults.push(result);
    } catch (error) {
      console.error(`Error updating code with ID ${updatedCode.id}:`, error);
    }
  }

  res.json({ updatedResults });
}
