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
  Grid,
  Grow,
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
import { useRouter } from 'next/router';

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

  const codes = await prisma.code.findMany();

  return {
    props: { source, initialAvailableCodes: codes }
  };
};

interface SourceProps {
  source: Source;
  initialAvailableCodes: Code[];
}

const Source: React.FC<SourceProps> = (props) => {
  const { source } = props;

  const ReactQuill = useMemo(
    () => dynamic(() => import('react-quill'), { ssr: false }),
    []
  );

  const [availableCodes, setAvailableCodes] = React.useState<Code[]>(
    props.initialAvailableCodes
  );

  const [selectedCode, setSelectedCode] = React.useState<Code | undefined>(
    undefined
  );
  const [codeInputValue, setCodeInputValue] = React.useState('');

  const [newCoding, setNewCoding] = React.useState<Coding | undefined>(
    undefined
  );

  const router = useRouter();

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
  }, [selectedCode]);

  const handleAutocompleteChange = (submittedCodeName) => {
    const selectedExistingCode = availableCodes.find(
      (code) => code.codeName === submittedCodeName
    );

    if (selectedExistingCode) {
      setSelectedCode(selectedExistingCode);
    } else {
      createCode(submittedCodeName);
    }
  };

  const handleInputChange = (event, newInputValue) => {
    setCodeInputValue(newInputValue);
  };

  const handleInputKeyDown = (event) => {
    if (event.key === 'Enter') {
      // The user pressed Enter, handle the selection or creation here
      handleAutocompleteChange(codeInputValue);
    }
  };

  const createCode = async (newCodeName: string) => {
    try {
      const response = await fetch('/api/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codeName: newCodeName
        })
      });

      const responseBody = await response.json();

      console.log(responseBody);

      setSelectedCode(responseBody as Code);
    } catch (error) {
      console.error(error);
    }
  };

  const createCoding = async () => {
    try {
      const response = await fetch('/api/coding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCoding,
          codeId: selectedCode.id,
          sourceId: props.source.id
        })
      });

      const responseJson = await response.json();
      console.log(responseJson);
      router.reload();
    } catch (error) {
      console.error(error);
    }
  };

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
                value={selectedCode?.codeName}
                inputValue={codeInputValue}
                onInputChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
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
                    codedSnippet: value
                  }))
                }
              />
            </CardContent>

            <CardActions>
              <Button
                size="small"
                onClick={() => {
                  if (newCoding && selectedCode.id) {
                    createCoding();
                  }
                }}
              >
                Save
              </Button>
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

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            columnGap: '10px',
            rowGap: '10px'
          }}
        >
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
                <ReactQuill
                  readOnly
                  placeholder="No snippet provided"
                  theme="snow"
                  value={coding.codedSnippet}
                  modules={{
                    toolbar: false
                  }}
                />
              </CardContent>

              <CardActions>
                <Button size="small">Edit coding</Button>
                <Button size="small">Remove coding</Button>
              </CardActions>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Source;
