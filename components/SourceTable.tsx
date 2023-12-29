import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

import { Source } from '@prisma/client';
import { Button, Link as MuiLink } from '@mui/material';
import Link from 'next/link';

interface SourceTableProps {
  sources: Source[];
}

export default function SourceTable(props: SourceTableProps) {
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell align="right"></TableCell>
            {/* <TableCell>ID</TableCell> */}
            <TableCell align="right">Source #</TableCell>
            <TableCell align="right">Author</TableCell>
            <TableCell align="right">Source name</TableCell>
            <TableCell align="right">Publication Title</TableCell>
            <TableCell align="right">Source type</TableCell>
            <TableCell align="right">URL</TableCell>
            <TableCell align="right">Search Type</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {props.sources.map((source) => (
            <TableRow
              key={source.sourceNumber}
              sx={{
                '&:last-child td, &:last-child th': { border: 0 },
                background: source.initialCodingDone === true && '#D1FFBD'
              }}
            >
              <TableCell align="right">
                <Link href={`source/${source.sourceNumber}/`} legacyBehavior>
                  <Button>Analyse</Button>
                </Link>
              </TableCell>
              {/* <TableCell component="th" scope="row">
                {source.id}
              </TableCell> */}
              <TableCell align="right">{source.sourceNumber}</TableCell>
              <TableCell align="right">{source.author}</TableCell>
              <TableCell align="right">{source.sourceName}</TableCell>
              <TableCell align="right">{source.publicationTitle}</TableCell>
              <TableCell align="right">{source.sourceType}</TableCell>
              <TableCell align="right">
                <MuiLink href={source.url} target="_blank" rel="noreferrer">
                  {source.url}
                </MuiLink>
              </TableCell>
              <TableCell align="right">{source.searchType}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
