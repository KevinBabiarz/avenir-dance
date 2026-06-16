import { Teacher } from '../models/Teacher.js';
import { crudRouter } from './crud.js';

export const teachersRouter = crudRouter(Teacher, {
  sort: { order: 1, createdAt: -1 },
  allowed: ['name', 'role', 'bio', 'image', 'instagram', 'facebook', 'order', 'published'],
});

