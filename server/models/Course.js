import mongoose from 'mongoose';

const CATEGORIES = ['hip-hop', 'contemporain', 'latino', 'jazz', 'breakdance'];

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: CATEGORIES, required: true },
    tag: { type: String, trim: true },
    schedule: { type: String, trim: true }, // ex: "Lun & Mer · 18h00"
    level: { type: String, trim: true }, // ex: "Débutant"
    description: { type: String, trim: true },
    image: { type: String, default: '' }, // URL de l'image uploadée
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Course = mongoose.model('Course', courseSchema);
export const COURSE_CATEGORIES = CATEGORIES;

