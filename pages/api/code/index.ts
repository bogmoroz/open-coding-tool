import { getSession } from 'next-auth/react';
import prisma from '../../../lib/prisma';
import { Code } from '../../../types';

// GET /api/code
export default async function handle(req, res) {
  const session = await getSession({ req });

  if (!session) {
    res.status(401).end();
    return;
  }

  if (req.method === 'GET') {
    handleGet(req, res);
  } else if (req.method === 'POST') {
    handlePost(req, res);
  } else {
    res.status(405).end(); // Method not allowed
  }
}

// GET /api/code
async function handleGet(req, res) {
  const result = await prisma.code.findMany();
  res.json(result);
}

// POST /api/code
async function handlePost(req, res) {
  const newCode: Code = req.body;

  const result = await prisma.code.create({
    data: {
      codeName: newCode.codeName
    }
  });
  res.json(result);
}
