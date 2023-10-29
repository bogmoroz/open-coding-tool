import { getSession } from 'next-auth/react';
import prisma from '../../../lib/prisma';
import { Code } from '../../../types';

// PUT /api/update-code-parents
export default async function handle(req, res) {
  const session = await getSession({ req });

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
