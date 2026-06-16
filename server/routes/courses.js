import { Course } from '../models/Course.js';
import { crudRouter } from './crud.js';

export const coursesRouter = crudRouter(Course, {
  sort: { order: 1, createdAt: -1 },
  allowed: ['title', 'category', 'tag', 'schedule', 'level', 'description', 'image', 'order', 'published'],
});

