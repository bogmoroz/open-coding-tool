import React, { useEffect, useState } from 'react';
import { GetStaticProps } from 'next';

import prisma from '../../lib/prisma';
import Layout from '../../components/Layout';
import { Code } from '../../types';

// import SortableTree from '@nosferatu500/react-sortable-tree';
import '@nosferatu500/react-sortable-tree/style.css'; // This only needs to be imported once in your app

import { useRouter } from 'next/router';
import { Button } from '@mui/material';
import SortableTree from '@nosferatu500/react-sortable-tree';

export const dynamic = 'force-dynamic';

// export const getStaticProps: GetStaticProps = async () => {
//   const codes = await prisma.code.findMany({
//     include: {
//       codings: true
//     }
//   });

//   console.log(codes);

//   return {
//     props: { codes },
//     revalidate: 1
//   };
// };

// type Props = {
//   codes: Code[];
// };

const CodesPage: React.FC = () => {
  const router = useRouter();

  const [codes, setCodes] = React.useState<Code[]>([]);

  const [unsavedChanges, setUnsavedChanges] = React.useState(false);

  const [treeData, setTreeData] = useState(() => buildTree(codes));

  const [codeDictionary, setCodeDictionary] = React.useState<
    Record<number, Code>
  >({}); // A dictionary to efficiently look up code objects by ID

  const fetchCodes = async () => {
    try {
      const response = await fetch('/api/code', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const responseBody = await response.json();

      setCodes(responseBody);
    } catch (error) {
      console.error('Failed to save changes');
    }
  };

  useEffect(() => {
    console.log('Fetch codes');

    fetchCodes();
  }, []);

  useEffect(() => {
    // Populate the codeDictionary with code objects
    codes.forEach((code) => {
      codeDictionary[code.id] = code;
    });

    setTreeData(buildTree(codes));
  }, [codes]);

  // Convert flat list of codes to hierarchical tree structure
  function buildTree(data: Code[], parentId: number | null = null) {
    const tree = data
      .filter((code) => code.parentId === parentId)
      .map((code) => {
        const children = buildTree(data, code.id);
        return {
          title: code.codeName,
          children: children.length > 0 ? children : undefined,
          id: code.id,
          expanded: true
        };
      });
    return tree;
  }

  // Flatten the hierarchical tree structure back into a flat list of codes
  function flattenTree(treeData: any[], parentId?: number) {
    treeData.forEach((node) => {
      const code = codeDictionary[node.id];

      code.parentId = parentId || null;

      console.log(
        'new parent id for code: ' + code.codeName + ' is ' + code.parentId
      );

      if (node.children && node.children.length > 0) {
        // Recursively call flattenTree to set the parent ID for children
        flattenTree(node.children, node.id);
      }
    });
  }

  // Handle changes in the tree structure
  function handleTreeChange(newTreeData: any[]) {
    setTreeData(newTreeData);
    setUnsavedChanges(true);
  }

  const handleSave = async () => {
    // Flatten the tree structure back into a flat list
    flattenTree(treeData);

    const updatedCodes = Object.values(codeDictionary);

    try {
      const response = await fetch('/api/update-code-parents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCodes)
      });

      const responseBody = await response.json();

      setUnsavedChanges(false);
      console.log(responseBody);

      fetchCodes();
    } catch (error) {
      console.error('Failed to save changes');
    }
  };

  return (
    <Layout>
      <div className="page">
        <h1>Codes</h1>
        <main>
          <div style={{ height: '100vh' }}>
            <Button onClick={handleSave} disabled={!unsavedChanges}>
              Save
            </Button>
            <SortableTree treeData={treeData} onChange={handleTreeChange} />
          </div>
        </main>
      </div>
      <style jsx>{`
        .post {
          background: white;
          transition: box-shadow 0.1s ease-in;
        }

        .post:hover {
          box-shadow: 1px 1px 3px #aaa;
        }

        .post + .post {
          margin-top: 2rem;
        }
      `}</style>
    </Layout>
  );
};

export default CodesPage;
