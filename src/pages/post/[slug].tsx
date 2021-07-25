import { ptBR } from 'date-fns/locale';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { format } from 'date-fns';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { MdAccessTime } from 'react-icons/md';
import Prismic from '@prismicio/client';

import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
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

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <div className={styles.loadingContainer}>
        <div />
        <h1>Carregando...</h1>
      </div>
    );
  }

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
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    first_publication_date: response.first_publication_date,
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
    },
  };
};
