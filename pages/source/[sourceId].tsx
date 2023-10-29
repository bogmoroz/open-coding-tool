import React, { useMemo } from 'react';
import { GetServerSideProps } from 'next';
import ReactMarkdown from 'react-markdown';
import Layout from '../../components/Layout';
import prisma from '../../lib/prisma';
import {
  Autocomplete,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Input,
  Link as MuiLink,
  Select,
  TextField,
  TextareaAutosize,
  Typography,
  createFilterOptions
} from '@mui/material';
import { Source, Coding, Code } from '../../types';
import 'react-quill/dist/quill.snow.css';
import dynamic from 'next/dynamic';

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const source = await prisma.source.findUnique({
    where: {
      sourceNumber: Number(params?.sourceId)
    },
    include: {
      codings: {
        include: {
          code: true
        }
      }
    }
  });

  console.log('get codes');
  const codes = await prisma.code.findMany();

  console.log(codes);

  return {
    props: { source, availableCodes: codes }
  };
};

interface SourceProps {
  source: Source;
  availableCodes: Code[];
}

async function createNewCode(req, res) {}

const Source: React.FC<SourceProps> = (props) => {
  const { source, availableCodes } = props;

  const ReactQuill = useMemo(
    () => dynamic(() => import('react-quill'), { ssr: false }),
    []
  );

  const [newCoding, setNewCoding] = React.useState<Coding | undefined>(
    undefined
  );

  return (
    <Layout>
      <div>
        <h1>Source Details</h1>
        <h2>Source Name: {source.sourceName}</h2>
        <p>Source Type: {source.sourceType}</p>
        <p>Search Type: {source.searchType}</p>

        <MuiLink href={source.url} target="_blank" rel="noreferrer">
          {source.url}
        </MuiLink>

        <h2>Codings for this Source:</h2>
        {newCoding ? (
          <Card
            sx={{
              maxWidth: 400
            }}
          >
            <CardContent>
              {/* Autocomplete for a code */}
              <Autocomplete
                sx={{ marginBottom: '10px' }}
                freeSolo
                options={availableCodes.map((code) => code.codeName) || []}
                value={newCoding.code.codeName}
                onChange={(event, newValue) => {
                  setNewCoding((prevCoding) => ({
                    ...prevCoding,
                    code: { ...prevCoding.code, codeName: newValue }
                  }));
                }}
                renderInput={(params) => <TextField label="Code" {...params} />}
              />

              {/* Text editor for the coded snippet */}
              <ReactQuill
                placeholder="Enter the snippet that you are associating with the selected code"
                theme="snow"
                value={newCoding.codedSnippet}
                modules={{
                  toolbar: [
                    [{ header: '1' }, { header: '2' }],
                    ['bold', 'underline'], // Display only Bold and Underline
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    ['clean']
                  ]
                }}
                onChange={(value) =>
                  setNewCoding((prevCoding) => ({
                    ...prevCoding,
                    code: { ...prevCoding.code },
                    source: { ...prevCoding.source },
                    codedSnippet: value
                  }))
                }
              />
            </CardContent>

            <CardActions>
              <Button size="small">Save</Button>
              <Button size="small" onClick={() => setNewCoding(undefined)}>
                Cancel
              </Button>
            </CardActions>
          </Card>
        ) : (
          <Button
            onClick={() => {
              setNewCoding({
                id: undefined,
                startIndex: undefined,
                endIndex: undefined,
                code: {
                  codeName: '',
                  codeDescription: '',
                  codings: undefined,
                  id: undefined,
                  parentId: undefined
                },
                codeId: undefined,
                source: source,
                sourceId: source.id,
                codedSnippet: ''
              });
            }}
          >
            Add new
          </Button>
        )}

        <ul>
          {source.codings.map((coding) => (
            <Card key={coding.id} sx={{ maxWidth: 400 }}>
              <CardContent>
                <Typography
                  sx={{ fontSize: 14 }}
                  color="text.secondary"
                  gutterBottom
                >
                  Code name
                </Typography>
                <Typography variant="h5" component="div">
                  {coding.code.codeName}
                </Typography>
                <Typography variant="body2">{coding.codedSnippet}</Typography>
              </CardContent>

              <CardActions>
                <Button size="small">Edit coding</Button>
                <Button size="small">Remove coding</Button>
              </CardActions>
            </Card>
          ))}
        </ul>
      </div>
    </Layout>
  );
};

export default Source;
