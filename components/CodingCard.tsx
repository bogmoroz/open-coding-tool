import {
  Button,
  Card,
  CardActions,
  CardContent,
  Typography
} from '@mui/material';
import { Coding } from '../types';
import { useMemo } from 'react';
import dynamic from 'next/dynamic';

interface CodingCardProps {
  coding: Coding;
}

const CodingCard: React.FC<CodingCardProps> = (props) => {
  const { coding } = props;

  const ReactQuill = useMemo(
    () => dynamic(() => import('react-quill'), { ssr: false }),
    []
  );

  return (
    <Card key={coding.id} sx={{ maxWidth: 400 }}>
      <CardContent>
        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
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
  );
};

export default CodingCard;
