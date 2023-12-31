import React from 'react';
import { GetStaticProps } from 'next';
import Layout from '../components/Layout';
import prisma from '../lib/prisma';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography
} from '@mui/material';
import BasicTable from '../components/BasicTable';
import SourceTable from '../components/SourceTable';
import { Source } from '@prisma/client';

export const getStaticProps: GetStaticProps = async () => {
  const sources = await prisma.source.findMany({
    orderBy: {
      sourceNumber: 'asc'
    }
  });

  // console.log(sources);

  return {
    props: { sources },
    revalidate: 10
  };
};

type Props = {
  sources: Source[];
};

const Blog: React.FC<Props> = (props) => {
  const sourceTypeCount = new Map<string, number>();

  props.sources.forEach((source) => {
    if (!source.initialCodingDone) {
      return;
    }
    const { sourceType } = source;
    sourceTypeCount.set(sourceType, (sourceTypeCount.get(sourceType) || 0) + 1);
  });

  return (
    <Layout>
      <div className="page">
        <h1>Sources</h1>
        <main>
          <Accordion>
            <AccordionSummary>
              <Typography>{`Total sources reviewed: ${
                props.sources.filter(
                  (source) => source.initialCodingDone === true
                ).length
              }`}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {Array.from(sourceTypeCount).map(([key, value]) => (
                <Typography>{`${key}: ${value}`}</Typography>
              ))}
            </AccordionDetails>
          </Accordion>
          <SourceTable sources={props.sources} />
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

export default Blog;
