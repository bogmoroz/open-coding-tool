import React from 'react';
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
  Link as MuiLink,
  Select,
  TextField,
  Typography
} from '@mui/material';
import { Source, Coding, Code } from '../../types';

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

const Source: React.FC<SourceProps> = (props) => {
  const { source, availableCodes } = props;

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
          <Card sx={{ maxWidth: 400 }}>
            <CardContent>
              <Autocomplete
                options={availableCodes?.map((code) => code.codeName) || []}
                renderInput={(params) => <TextField {...params} label="Code" />}
              ></Autocomplete>
              <Typography variant="body2">{newCoding.codedSnippet}</Typography>
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
                code: undefined,
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
