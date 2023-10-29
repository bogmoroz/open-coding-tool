import React from 'react';
import { GetStaticProps } from 'next';

import prisma from '../../lib/prisma';
import Layout from '../../components/Layout';
import { Code } from '../../types';

export const getStaticProps: GetStaticProps = async () => {
  const codes = await prisma.code.findMany({
    include: {
      codings: true
    }
  });

  console.log(codes);

  return {
    props: { codes },
    revalidate: 10
  };
};

type Props = {
  codes: Code[];
};

const Blog: React.FC<Props> = (props) => {
  return (
    <Layout>
      <div className="page">
        <h1>Codes</h1>
        <main></main>
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
