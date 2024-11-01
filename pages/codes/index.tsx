import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import { Code, ISource } from '../../types';

import '@nosferatu500/react-sortable-tree/style.css'; // This only needs to be imported once in your app

import { Box, Button, TextField, Typography } from '@mui/material';
import CodingCard from '../../components/CodingCard';
import { GetServerSideProps } from 'next';
import prisma from '../../lib/prisma';
import dynamic from 'next/dynamic';

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

interface CodesPageProps {
  sourceDictionary: Record<number, ISource>;
}

const CodesPage: React.FC<CodesPageProps> = (props) => {
  const SortableTree = useMemo(
    () =>
      dynamic(() => import('@nosferatu500/react-sortable-tree'), {
        ssr: false
      }),
    []
  );

  const [codes, setCodes] = React.useState<Code[]>([]);

  const [unsavedChanges, setUnsavedChanges] = React.useState(false);

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
          title: code.codeName + ' (' + code.codings?.length + ')',
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
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            height: '100vh'
          }}
        >
          <div style={{ height: '100%' }}>
            <Button onClick={handleSave} disabled={!unsavedChanges}>
              Save
            </Button>
            <TextField
              aria-label="code-search"
              autoComplete="off"
              placeholder="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
            />
            <SortableTree
              searchQuery={searchQuery}
              searchFocusOffset={5}
              treeData={treeData}
              onChange={handleTreeChange}
              generateNodeProps={(rowInfo) => {
                return {
                  onClick: () => {
                    // console.log(rowInfo);
                    const selectedCode = codeDictionary[rowInfo.node.id];

                    setSelectedCode({
                      ...selectedCode
                    });
                  }
                };
              }}
            />
          </div>
          {selectedCode && (
            <div>
              <Typography variant="h5">{selectedCode.codeName}</Typography>
              {Array.from(
                new Set(
                  selectedCode.codings
                    ?.map(
                      (coding) =>
                        props.sourceDictionary[coding.sourceId].sourceNumber
                    )
                    .sort((a, b) => a - b)
                )
              )
                .reduce((prev, cur) => prev.concat(cur + ', '), '')
                .slice(0, -2)}
              <Box
                sx={{
                  display: 'grid',
                  gridColumnGap: '5px',
                  gridRowGap: '5px',
                  gridTemplateColumns: 'repeat( auto-fit, minmax(250px, 1fr) )'
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

export default CodesPage;
