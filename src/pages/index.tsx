import Head from 'next/head';
import Link from 'next/link';
import { GetStaticProps } from 'next';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';

import styles from './home.module.scss';
import commonStyles from '../styles/common.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string | null;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
  previewData: string;
}

export default function Home({
  postsPagination,
  preview,
}: Omit<HomeProps, 'previewData'>): JSX.Element {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState<string | null>(
    postsPagination.next_page
  );

  async function handleSearchMorePost(): Promise<void> {
    const response = await fetch(postsPagination.next_page);

    const data = await response.json();

    const newPosts = data.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd LLL yyyy',
          {
            locale: ptBR,
          }
        ),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });

    setNextPage(data.next_page);
    setPosts(oldPosts => [...oldPosts, ...newPosts]);
  }

  return (
    <>
      <Head>
        <title>Home | Space Traveling</title>
      </Head>

      <div className={`${commonStyles.container} ${styles.container}`}>
        <header className={`${styles.header} ${preview ? styles.preview : ''}`}>
          <img src="/images/logo.svg" alt="logo" />
        </header>

        <main className={styles.content}>
          {posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <strong>{post.data.title}</strong>

                <p>{post.data.subtitle}</p>

                <time>
                  <FiCalendar size={24} />
                  {format(
                    new Date(post.first_publication_date),
                    'dd MMM yyyy',
                    {
                      locale: ptBR,
                    }
                  )}
                </time>

                <span>
                  <FiUser size={24} />
                  {post.data.author}
                </span>
              </a>
            </Link>
          ))}

          {nextPage && (
            <button type="button" onClick={handleSearchMorePost}>
              Carregar mais posts
            </button>
          )}
        </main>

        {preview && (
          <div className={styles.previewButton}>
            <Link href="/api/exit-preview">
              <a>Sair do modo Preview</a>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'post')],
    {
      fetch: [
        'post.title',
        'post.subtitle',
        'post.author',
        'post.last_publication_date',
      ],
      pageSize: 2,
      ref: previewData?.ref ?? null,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: posts,
  };

  return {
    props: {
      postsPagination,
      preview,
      previewData: previewData ?? null,
    },
  };
};
