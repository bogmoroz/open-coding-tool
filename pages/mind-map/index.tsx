import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import { Code, ISource } from '../../types';

import '@nosferatu500/react-sortable-tree/style.css'; // This only needs to be imported once in your app

import { Box, Button, TextField, Typography } from '@mui/material';
import CodingCard from '../../components/CodingCard';
import { GetServerSideProps } from 'next';
import prisma from '../../lib/prisma';
import dynamic from 'next/dynamic';
import Tree from 'react-d3-tree';

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const sources = await prisma.source.findMany();

  const sourceDictionary: Record<number, ISource> = {};

  sources.forEach((source) => {
    sourceDictionary[source.id] = { ...source };
  });

  return {
    props: { sourceDictionary }
  };
};

interface MindMapPageProps {
  sourceDictionary: Record<number, ISource>;
}

const MindMapPage: React.FC<MindMapPageProps> = (props) => {
  const [codes, setCodes] = React.useState<Code[]>([]);

  const [unsavedChanges, setUnsavedChanges] = React.useState(false);

  const [showTree, setShowTree] = React.useState(false);

  const [treeData, setTreeData] = useState(() => buildTree(codes));

  const [searchQuery, setSearchQuery] = useState('');

  const [codeDictionary, _setCodeDictionary] = React.useState<
    Record<number, Code>
  >({}); // A dictionary to efficiently look up code objects by ID

  const [selectedCode, setSelectedCode] = React.useState<Code | undefined>();

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
    fetchCodes();
  }, []);

  useEffect(() => {
    // Populate the codeDictionary with code objects
    codes.forEach((code) => {
      codeDictionary[code.id] = code;
    });

    setTreeData(buildTree(codes));
    setShowTree(true);
  }, [codes]);

  // Convert flat list of codes to hierarchical tree structure
  function buildTree(data: Code[], parentId: number | null = null) {
    const tree = data
      .filter((code) => code.parentId === parentId)
      .map((code) => {
        const children = buildTree(data, code.id);
        return {
          id: code.id,
          name: code.codeName + ' (' + code.codings?.length + ')',
          children: children.length > 0 ? children : undefined
        };
      });
    return tree;
  }

  // Flatten the hierarchical tree structure back into a flat list of codes
  function flattenTree(treeData: any[], parentId?: number) {
    treeData.forEach((node) => {
      const code = codeDictionary[node.id];

      code.parentId = parentId || null;

      // console.log(
      //   'new parent id for code: ' + code.codeName + ' is ' + code.parentId
      // );

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
      // console.log(responseBody);

      fetchCodes();
    } catch (error) {
      console.error('Failed to save changes');
    }
  };

  return (
    <Layout>
      <div className="page">
        {/* <h1>Codes</h1> */}
        <main
          id="treeWrapper"
          style={{
            display: 'grid',
            gridTemplateRows: '1fr 2fr',
            height: '100vh',
            overflow: 'auto'
          }}
        >
          <div style={{ height: '100%', width: '100%', overflow: 'auto' }}>
            {showTree && treeData && (
              <Tree
                data={{ name: 'Product Ops Root', children: treeData }}
                zoomable={true}
                collapsible={false}
                draggable={true}
                pathFunc={'step'}
                orientation="vertical"
                separation={{
                  siblings: 4,
                  nonSiblings: 5
                }}
                onNodeClick={(node) => {
                  const selectedCode = codeDictionary[(node.data as any)?.id];
                  setSelectedCode({
                    ...selectedCode
                  });
                }}
              />
            )}
          </div>
          {selectedCode && (
            <div
              style={{
                height: '100%',
                overflow: 'auto'
              }}
            >
              <Typography variant="h5">{selectedCode.codeName}</Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridColumnGap: '5px',
                  gridRowGap: '5px',
                  gridTemplateColumns: 'repeat( auto-fit, minmax(250px, 1fr) )',
                  height: '100%',
                  overflow: 'scroll'
                }}
              >
                {selectedCode.codings?.map((coding) => (
                  <CodingCard
                    coding={{
                      ...coding,
                      codedSnippet: coding.codedSnippet,
                      code: { ...selectedCode },
                      source: {
                        ...coding.source
                      }
                    }}
                    onCodingEdited={() => {}}
                    source={props.sourceDictionary[coding.sourceId]}
                    showCodeName={false}
                  />
                ))}
              </Box>
            </div>
          )}
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

export default MindMapPage;
