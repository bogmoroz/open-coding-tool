import React, { useMemo, useState } from 'react';
import { GetStaticProps } from 'next';

import prisma from '../../lib/prisma';
import Layout from '../../components/Layout';
import { Code } from '../../types';

// import SortableTree from '@nosferatu500/react-sortable-tree';
import '@nosferatu500/react-sortable-tree/style.css'; // This only needs to be imported once in your app
import dynamic from 'next/dynamic';

import { useRouter } from 'next/router';
import { Button } from '@mui/material';

export const getStaticProps: GetStaticProps = async () => {
  const codes = await prisma.code.findMany({
    include: {
      codings: true
    }
  });

  console.log(codes);

  return {
    props: { codes },
    revalidate: 10
  };
};

type Props = {
  codes: Code[];
};

const CodesPage: React.FC<Props> = (props) => {
  const SortableTree = useMemo(
    () =>
      dynamic(() => import('@nosferatu500/react-sortable-tree'), {
        ssr: true
      }),
    []
  );

  const router = useRouter();

  const [unsavedChanges, setUnsavedChanges] = React.useState(false);

  const [treeData, setTreeData] = useState(() => buildTree(props.codes));

  const codeDictionary: Record<number, Code> = {}; // A dictionary to efficiently look up code objects by ID

  // Populate the codeDictionary with code objects
  props.codes.forEach((code) => {
    codeDictionary[code.id] = code;
  });

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
  function flattenTree(treeData: any[]): Code[] {
    const flatList: Code[] = [];

    treeData.forEach((node) => {
      const code = codeDictionary[node.id];

      if (node.children) {
        node.children.forEach((childNode) => {
          const childCode = codeDictionary[childNode.id];
          if (!code.children) {
            code.children = [];
          }
          code.children.push(childCode);
        });
      }

      //   if (code) {
      //     code.parentId = node.parentId || null;
      //     code.children = node.children
      //       ? node.children.map((childNode) => childNode.id)
      //       : [];
      //   }
      flatList.push(code);
    });

    return flatList;
  }

  // Handle changes in the tree structure
  function handleTreeChange(newTreeData: any[]) {
    setTreeData(newTreeData);
    setUnsavedChanges(true);
  }

  const handleSave = async () => {
    // Flatten the tree structure back into a flat list
    const updatedCodes = flattenTree(treeData);

    try {
      const response = await fetch('/api/update-code-parents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCodes)
      });

      const responseBody = await response.json();

      console.log(responseBody);

      router.reload();
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
