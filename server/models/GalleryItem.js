import mongoose from 'mongoose';

const gallerySchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: '' }, // ex: "Showcase annuel"
    category: { type: String, trim: true, default: '' }, // ex: "Hip-Hop"
    image: { type: String, required: true }, // image obligatoire pour la galerie
    // Taille de la tuile dans la mosaïque du site
    size: { type: String, enum: ['small', 'wide', 'large'], default: 'small' },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const GalleryItem = mongoose.model('GalleryItem', gallerySchema);

