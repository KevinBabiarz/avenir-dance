import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, trim: true }, // ex: "Hip-Hop & Breaking"
    bio: { type: String, trim: true },
    image: { type: String, default: '' }, // portrait uploadé
    instagram: { type: String, trim: true, default: '' },
    facebook: { type: String, trim: true, default: '' },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Teacher = mongoose.model('Teacher', teacherSchema);

