import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

import { Source } from '@prisma/client';
import { Link } from '@mui/material';

function createData(
  name: string,
  calories: number,
  fat: number,
  carbs: number,
  protein: number
) {
  return { name, calories, fat, carbs, protein };
}

const rows = [
  createData('Frozen yoghurt', 159, 6.0, 24, 4.0),
  createData('Ice cream sandwich', 237, 9.0, 37, 4.3),
  createData('Eclair', 262, 16.0, 24, 6.0),
  createData('Cupcake', 305, 3.7, 67, 4.3),
  createData('Gingerbread', 356, 16.0, 49, 3.9)
];

interface SourceTableProps {
  sources: Source[];
}

export default function SourceTable(props: SourceTableProps) {
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell align="right">Source #</TableCell>
            <TableCell align="right">Publication title</TableCell>
            <TableCell align="right">Source Type</TableCell>
            <TableCell align="right">URL</TableCell>
            <TableCell align="right">Search Type</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {props.sources.map((source) => (
            <TableRow
              key={source.sourceNumber}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {source.id}
              </TableCell>
              <TableCell align="right">{source.sourceNumber}</TableCell>
              <TableCell align="right">{source.sourceName}</TableCell>
              <TableCell align="right">{source.sourceType}</TableCell>
              <TableCell align="right">
                <Link href={source.url} target="_blank" rel="noreferrer">
                  {source.url}
                </Link>
              </TableCell>
              <TableCell align="right">{source.searchType}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
