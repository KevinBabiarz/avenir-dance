import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, trim: true }, // ex: "Conseils", "Bien-être"
    excerpt: { type: String, trim: true },
    content: { type: String, trim: true }, // corps complet de l'article
    image: { type: String, default: '' },
    date: { type: Date, default: Date.now }, // date de publication affichée
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Post = mongoose.model('Post', postSchema);

