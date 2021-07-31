import { ptBR } from 'date-fns/locale';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { format } from 'date-fns';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { MdAccessTime } from 'react-icons/md';
import Prismic from '@prismicio/client';

import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

type PostList = {
  uid?: string;
  title: string;
};

interface PostProps {
  post: Post;
  postList: PostList[];
  currentPostIndex: number;
}

export default function Post({
  post,
  postList,
  currentPostIndex,
}: PostProps): JSX.Element {
  const commentsRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  useEffect(() => {
    const script = document.createElement('script');

    script.setAttribute('src', 'https://utteranc.es/client.js');
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('async', 'true');
    script.setAttribute('repo', process.env.NEXT_PUBLIC_GITHUB_REPO);
    script.setAttribute('issue-term', 'blog');
    script.setAttribute('theme', 'github-dark');

    commentsRef.current.appendChild(script);
  }, []);

  /*   if (router.isFallback) {
    return (
      <div className={styles.loadingContainer}>
        <div />
        <h1>Carregando...</h1>
      </div>
    );
  } */

  const hasNextPost = currentPostIndex + 1 < postList.length;
  const hasPreviousPost = currentPostIndex > 0;

  const words = post.data.content.reduce(
    (acc, content) => {
      const allWords = RichText.asText(content.body).split(/\S+/g);

      acc.length += allWords.length;

      return acc;
    },
    {
      length: 0,
    }
  );

  return (
    <>
      <Head>
        <title>{post.data.title}</title>
      </Head>

      <Header />

      <div className={styles.container}>
        <img src={post.data.banner.url} alt="Banner" />

        <main className={`${commonStyles.container} ${styles.content}`}>
          <h1>{post.data.title}</h1>

          <time>
            <FiCalendar size={24} />
            {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
              locale: ptBR,
            })}
          </time>

          <span>
            <FiUser size={24} />
            {post.data.author}
          </span>

          <span>
            <MdAccessTime size={24} /> {Math.ceil(words.length / 200)} min
          </span>

          <p className={styles.updatedAtInfo}>
            * editado em
            {format(
              new Date(post.last_publication_date),
              " dd MMM yyyy 'às' HH:mm",
              {
                locale: ptBR,
              }
            )}
          </p>

          {post.data.content.map(content => (
            <div key={content.heading} className={styles.postContainer}>
              <strong>{content.heading}</strong>

              <div
                className={styles.postContent}
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </div>
          ))}
        </main>

        <footer className={`${styles.footer} ${commonStyles.container}`}>
          <div>
            {hasPreviousPost && (
              <Link href={`/post/${postList[currentPostIndex - 1].uid}`}>
                <a>
                  {postList[currentPostIndex - 1].title}
                  <br /> <strong>Post anterior</strong>
                </a>
              </Link>
            )}

            {hasNextPost ? (
              <Link href={`/post/${postList[currentPostIndex + 1].uid}`}>
                <a>
                  {postList[currentPostIndex + 1].title}
                  <br /> <strong>Proximo post</strong>
                </a>
              </Link>
            ) : (
              <Link href="/">
                <a>
                  <strong>Voltar para página inicial</strong>
                </a>
              </Link>
            )}
          </div>

          <div ref={commentsRef} />
        </footer>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'post')],
    {
      fetch: [],
      pageSize: 2,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths: posts,
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('post', String(slug), {});

  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'post')],
    {
      fetch: [
        'post.title',
        'post.subtitle',
        'post.author',
        'post.last_publication_date',
      ],
    }
  );

  let currentPostIndex: number;

  postsResponse.results.forEach((post, index) => {
    if (Object.is(post.uid, response.uid)) {
      currentPostIndex = index;
    }
  });

  const postList = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      title: post.data.title,
    };
  });

  const post = {
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => ({
        heading: content.heading,
        body: content.body,
      })),
    },
    uid: response.uid,
  };

  return {
    props: {
      post,
      postList,
      currentPostIndex,
    },
  };
};
