import { getSession } from 'next-auth/react';
import prisma from '../../../lib/prisma';
import { Coding } from '../../../types';

// POST /api/coding
export default async function handle(req, res) {
  const session = await getSession({ req });

  if (!session) {
    res.status(401).end();
    return;
  }

  const newCoding: Coding = req.body;

  const result = await prisma.coding.create({
    data: {
      sourceId: newCoding.sourceId,
      codeId: newCoding.codeId,
      codedSnippet: newCoding.codedSnippet
    }
  });
  res.json(result);
}
