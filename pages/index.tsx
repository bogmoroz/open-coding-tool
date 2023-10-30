import React from 'react';
import { GetStaticProps } from 'next';
import Layout from '../components/Layout';
import prisma from '../lib/prisma';
import { Table } from '@mui/material';
import BasicTable from '../components/BasicTable';
import SourceTable from '../components/SourceTable';
import { Source } from '@prisma/client';

export const getStaticProps: GetStaticProps = async () => {
  const sources = await prisma.source.findMany();

  console.log(sources);

  return {
    props: { sources },
    revalidate: 10
  };
};

type Props = {
  sources: Source[];
};

const Blog: React.FC<Props> = (props) => {
  return (
    <Layout>
      <div className="page">
        <h1>Sources</h1>
        <main>
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
