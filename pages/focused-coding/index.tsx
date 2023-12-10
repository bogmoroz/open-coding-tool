import React from 'react';
import { GetServerSideProps } from 'next';
import ReactMarkdown from 'react-markdown';
import Layout from '../../components/Layout';
import prisma from '../../lib/prisma';
import { Button, Link as MuiLink, Typography } from '@mui/material';
import { Source, Code } from '../../types';
import 'react-quill/dist/quill.snow.css';
import CodeEditor from '../../components/CodeEditor';

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const source = await prisma.source.findMany({
    include: {
      codings: {
        include: {
          code: true
        },
        orderBy: {
          id: 'desc'
        }
      }
    }
  });

  const codes = await prisma.code.findMany();

  return {
    props: { source, initialAvailableCodes: codes }
  };
};

interface SourceProps {
  source: Source;
  initialAvailableCodes: Code[];
}

const ParentChildEditor: React.FC<SourceProps> = (props) => {
  const [availableCodes, setAvailableCodes] = React.useState<Code[]>(
    props.initialAvailableCodes
  );

  const [selectedParentCode, setSelectedParentCode] = React.useState<
    Code | undefined
  >(undefined);

  const [selectedChildCode, setSelectedChildCode] = React.useState<
    Code | undefined
  >(undefined);

  React.useEffect(() => {
    const fetchCodes = async () => {
      const response = await fetch('/api/code', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const responseBody = await response.json();

      setAvailableCodes(responseBody as Code[]);
    };

    fetchCodes();
  }, [selectedParentCode, selectedChildCode]);

  const updateCodeParent = async (newParentId: number, newChildId: number) => {
    const updatedChildCode = { ...selectedChildCode, parentId: newParentId };

    try {
      const response = await fetch('/api/code', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedChildCode)
      });

      const responseBody = await response.json();

      console.log(responseBody);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Layout>
      <div>
        <Typography variant="h4">{`Parent-child editor`}</Typography>
        <div style={{ display: 'flex', justifyContent: 'space-evenly' }}>
          <CodeEditor
            initialAvailableCodes={availableCodes}
            label="Parent code"
            onCodeSelected={(code) => setSelectedParentCode(code)}
          />

          <CodeEditor
            initialAvailableCodes={availableCodes}
            label="Child code"
            onCodeSelected={(code) => setSelectedChildCode(code)}
          />

          <Button
            disabled={!selectedChildCode || !selectedParentCode}
            onClick={() => {
              updateCodeParent(selectedParentCode.id, selectedChildCode.id);
            }}
          >
            Save pairing
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default ParentChildEditor;
