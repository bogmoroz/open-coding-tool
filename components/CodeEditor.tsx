import React, { useMemo } from 'react';
import { GetServerSideProps } from 'next';
import ReactMarkdown from 'react-markdown';

import {
  Autocomplete,
  Link as MuiLink,
  TextField,
  Typography
} from '@mui/material';
import { Code } from '../types';
import 'react-quill/dist/quill.snow.css';

interface CodeEditorProps {
  initialAvailableCodes: Code[];
  label?: string;
  onCodeSelected?: (code: Code | undefined) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = (props) => {
  const [availableCodes, setAvailableCodes] = React.useState<Code[]>(
    props.initialAvailableCodes
  );

  const [selectedCode, setSelectedCode] = React.useState<Code | undefined>(
    undefined
  );

  const [codeInputValue, setCodeInputValue] = React.useState('');

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

  React.useEffect(() => {
    props.onCodeSelected && props.onCodeSelected(selectedCode);
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

      // console.log(responseBody);

      setSelectedCode(responseBody as Code);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <Autocomplete
        sx={{ marginBottom: '10px', minWidth: '500px' }}
        freeSolo
        options={availableCodes.map((code) => code.codeName) || []}
        value={selectedCode?.codeName}
        inputValue={codeInputValue}
        onInputChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        renderInput={(params) => (
          <TextField label={props.label || 'code'} {...params} />
        )}
      />
    </div>
  );
};

export default CodeEditor;
