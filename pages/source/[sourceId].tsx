import React from 'react';
import { GetServerSideProps } from 'next';
import ReactMarkdown from 'react-markdown';
import Layout from '../../components/Layout';
import { PostProps } from '../../components/Post';

// export const getServerSideProps: GetServerSideProps = async ({ params }) => {
//   const post = {
//     id: '1',
//     title: 'Prisma is the perfect ORM for Next.js',
//     content:
//       '[Prisma](https://github.com/prisma/prisma) and Next.js go _great_ together!',
//     published: false,
//     author: {
//       name: 'Nikolas Burk',
//       email: 'burk@prisma.io'
//     }
//   };
//   return {
//     props: post
//   };
// };

const Source: React.FC<PostProps> = () => {
  return (
    <Layout>
      <div>
        <h2>{'Test'}</h2>
      </div>
    </Layout>
  );
};

export default Source;
