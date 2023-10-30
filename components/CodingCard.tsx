import {
  Button,
  Card,
  CardActions,
  CardContent,
  Typography
} from '@mui/material';
import { Coding } from '../types';
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';

interface CodingCardProps {
  coding: Coding;
  onCodingEdited: () => void;
}

const editingModules = {
  toolbar: [
    [{ header: '1' }, { header: '2' }],
    ['bold', 'underline'], // Display only Bold and Underline
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['clean']
  ]
};

const viewingModules = {
  toolbar: false
};

const CodingCard: React.FC<CodingCardProps> = (props) => {
  const { coding, onCodingEdited } = props;

  console.log(coding);

  const [editedSnippet, setEditedSnippet] = useState(coding.codedSnippet);

  const [editing, setEditing] = useState(false);

  const ReactQuill = useMemo(
    () => dynamic(() => import('react-quill'), { ssr: false }),
    [editing]
  );

  const handleSaveCode = async () => {
    try {
      const response = await fetch('/api/coding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: coding.id,
          codedSnippet: editedSnippet
        })
      });

      onCodingEdited();
    } catch (error) {
      console.error('Failed to save changes');
    }
  };

  useEffect(() => {
    setEditedSnippet(props.coding.codedSnippet);
  }, [props.coding]);

  return (
    <Card key={coding.id} sx={{ maxWidth: 400 }}>
      <CardContent>
        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
          Code name
        </Typography>
        <Typography variant="h5" component="div">
          {coding.code?.codeName}
        </Typography>

        <ReactQuill
          readOnly={!editing}
          placeholder="No snippet provided"
          theme="snow"
          value={editedSnippet}
          onChange={(value) => setEditedSnippet(value)}
          modules={editing ? editingModules : viewingModules}
        />
      </CardContent>

      <CardActions>
        {!editing && (
          <Button size="small" onClick={() => setEditing(true)}>
            Edit coding
          </Button>
        )}

        {editing && (
          <>
            <Button size="small" onClick={handleSaveCode}>
              Save
            </Button>
            <Button
              size="small"
              onClick={() => {
                setEditing(false);
                setEditedSnippet(props.coding.codedSnippet);
              }}
            >
              Cancel
            </Button>
          </>
        )}

        <Button size="small">Remove coding</Button>
      </CardActions>
    </Card>
  );
};

export default CodingCard;
