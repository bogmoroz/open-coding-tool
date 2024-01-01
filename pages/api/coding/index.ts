import { getSession } from 'next-auth/react';
import prisma from '../../../lib/prisma';
import { Coding } from '../../../types';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb' // Set desired value here
    }
  }
};

export default async function handle(req, res) {
  if (req.method === 'PUT') {
    handlePut(req, res);
  } else if (req.method === 'POST') {
    handlePost(req, res);
  } else {
    res.status(405).end(); // Method not allowed
  }
}

// POST /api/coding
export async function handlePost(req, res) {
  const session = await getServerSession(req, res, authOptions);

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

// PUT /api/coding
export async function handlePut(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    res.status(401).end();
    return;
  }

  const updatedCoding: Coding = req.body;

  const result = await prisma.coding.update({
    where: { id: updatedCoding.id },
    data: {
      codedSnippet: updatedCoding.codedSnippet
    }
  });
  res.json(result);
}
