import { GalleryItem } from '../models/GalleryItem.js';
import { crudRouter } from './crud.js';

export const galleryRouter = crudRouter(GalleryItem, {
  sort: { order: 1, createdAt: -1 },
  allowed: ['label', 'category', 'image', 'size', 'order', 'published'],
});

