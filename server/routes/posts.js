import { Post } from '../models/Post.js';
import { crudRouter } from './crud.js';

export const postsRouter = crudRouter(Post, {
  sort: { order: 1, date: -1 },
  allowed: ['title', 'category', 'excerpt', 'content', 'image', 'date', 'order', 'published'],
});

