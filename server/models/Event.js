import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    tag: { type: String, trim: true }, // ex: "Spectacle", "Stage", "Battle"
    date: { type: Date, required: true }, // date de l'évènement
    time: { type: String, trim: true }, // ex: "19h00", "10h00 – 16h00"
    place: { type: String, trim: true }, // ex: "Salle Pierre Perret, Ans"
    description: { type: String, trim: true },
    image: { type: String, default: '' },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Champs virtuels pour l'affichage du bloc date (jour / mois) du site
eventSchema.virtual('day').get(function () {
  return this.date ? String(this.date.getDate()).padStart(2, '0') : '';
});

eventSchema.virtual('month').get(function () {
  if (!this.date) return '';
  const mois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
  return mois[this.date.getMonth()];
});

eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

export const Event = mongoose.model('Event', eventSchema);

