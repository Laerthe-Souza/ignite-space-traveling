import { useState } from 'react';
import { useCallback } from 'react';
import { ReactNode } from 'react';
import { createContext } from 'react';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

export type PostListContextData = {
  postList: Post[];
  hasNextPost: boolean;
  hasPreviousPost: boolean;
  insertPosts: (posts: Post[]) => void;
  nextPost: (index: number) => void;
  previousPost: (index: number) => void;
  currentPostIndex: number;
};

type PostListProviderProps = {
  children: ReactNode;
};

export const PostListContext = createContext({} as PostListContextData);

export function PostListProvider({
  children,
}: PostListProviderProps): JSX.Element {
  const [postList, setPostList] = useState<Post[]>([]);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);

  const hasNextPost = currentPostIndex + 1 < postList.length;
  const hasPreviousPost = currentPostIndex > 0;

  const insertPosts = useCallback((posts: Post[]) => {
    setPostList(posts);
  }, []);

  const nextPost = useCallback(() => {
    setCurrentPostIndex(olCurrentPostIndex => olCurrentPostIndex + 1);
  }, []);

  const previousPost = useCallback(() => {
    setCurrentPostIndex(olCurrentPostIndex => olCurrentPostIndex - 1);
  }, []);

  return (
    <PostListContext.Provider
      value={{
        postList,
        hasNextPost,
        hasPreviousPost,
        insertPosts,
        nextPost,
        previousPost,
        currentPostIndex,
      }}
    >
      {children}
    </PostListContext.Provider>
  );
}
