import { Event } from '../models/Event.js';
import { crudRouter } from './crud.js';

export const eventsRouter = crudRouter(Event, {
  sort: { date: 1, order: 1 },
  allowed: ['title', 'tag', 'date', 'time', 'place', 'description', 'image', 'order', 'published'],
});

