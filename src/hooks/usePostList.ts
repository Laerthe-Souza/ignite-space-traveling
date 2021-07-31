import { useContext } from 'react';

import { PostListContext, PostListContextData } from '../contexts/postList';

export function usePostList(): PostListContextData {
  const context = useContext(PostListContext);

  return context;
}
