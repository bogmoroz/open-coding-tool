import { getSession } from 'next-auth/react';
import prisma from '../../../lib/prisma';
import { Code } from '../../../types';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '8mb' // Set desired value here
    }
  }
};

export default async function handle(req, res) {
  if (req.method === 'GET') {
    handleGet(req, res);
  } else if (req.method === 'PUT') {
    handlePut(req, res);
  } else if (req.method === 'POST') {
    handlePost(req, res);
  } else {
    res.status(405).end(); // Method not allowed
  }
}

// GET /api/code
async function handleGet(req, res) {
  const result = await prisma.code.findMany({
    include: {
      codings: true
    }
  });

  res.json(result);
}

// POST /api/code
async function handlePost(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    res.status(401).end();
    return;
  }

  const newCode: Code = req.body;

  const result = await prisma.code.create({
    data: {
      codeName: newCode.codeName
    }
  });
  res.json(result);
}

// PUT /api/code
async function handlePut(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    res.status(401).end();
    return;
  }

  const updatedCode: Code = req.body;

  const result = await prisma.code.update({
    where: {
      id: updatedCode.id
    },
    data: {
      parentId: updatedCode.parentId
    }
  });

  res.json(result);
}
