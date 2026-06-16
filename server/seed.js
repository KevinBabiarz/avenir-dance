import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { Course } from './models/Course.js';
import { Teacher } from './models/Teacher.js';
import { Post } from './models/Post.js';
import { Event } from './models/Event.js';
import { GalleryItem } from './models/GalleryItem.js';

dotenv.config();

// Données reprises de la maquette "Avenir Crazy Dance"
const courses = [
  { category: 'hip-hop', tag: 'Hip-Hop', title: 'Hip-Hop Fondamentaux', schedule: 'Lun & Mer · 18h00', level: 'Débutant', order: 1 },
  { category: 'hip-hop', tag: 'Hip-Hop', title: 'Choré Hip-Hop Avancé', schedule: 'Ven · 19h30', level: 'Avancé', order: 2 },
  { category: 'contemporain', tag: 'Contemporain', title: 'Contemporain Flow', schedule: 'Mar · 18h00', level: 'Tous niveaux', order: 3 },
  { category: 'contemporain', tag: 'Contemporain', title: 'Contemporain Création', schedule: 'Jeu · 20h00', level: 'Intermédiaire', order: 4 },
  { category: 'latino', tag: 'Latino', title: 'Salsa Cubaine', schedule: 'Mer · 19h00', level: 'Débutant', order: 5 },
  { category: 'latino', tag: 'Latino', title: 'Bachata Sensual', schedule: 'Ven · 20h30', level: 'Intermédiaire', order: 6 },
  { category: 'jazz', tag: 'Jazz', title: 'Jazz Moderne', schedule: 'Sam · 11h00', level: 'Tous niveaux', order: 7 },
  { category: 'breakdance', tag: 'Breakdance', title: 'Breaking Kids', schedule: 'Sam · 14h00', level: 'Enfants', order: 8 },
  { category: 'breakdance', tag: 'Breakdance', title: 'Breaking Battle', schedule: 'Dim · 16h00', level: 'Avancé', order: 9 },
];

const teachers = [
  { name: 'Maya Lopez', role: 'Hip-Hop & Breaking', order: 1 },
  { name: 'Théo Marchand', role: 'Contemporain', order: 2 },
  { name: 'Inès Carvalho', role: 'Latino & Salsa', order: 3 },
  { name: 'Driss Benali', role: 'Jazz & Modern', order: 4 },
];

const posts = [
  { category: 'Conseils', date: new Date('2026-06-02'), title: '5 conseils pour progresser plus vite', excerpt: 'Régularité, écoute du corps et plaisir : nos profs partagent leurs secrets.', order: 1 },
  { category: 'Bien-être', date: new Date('2026-05-28'), title: 'Les bienfaits du contemporain', excerpt: 'Au-delà de la technique, une discipline qui libère le mental autant que le corps.', order: 2 },
  { category: 'Compétition', date: new Date('2026-05-15'), title: 'Préparer ton premier battle', excerpt: 'Mental, freestyle et gestion du stress : le guide pour monter sur scène serein.', order: 3 },
];

const events = [
  { tag: 'Spectacle', title: 'Gala de fin d\u2019année', date: new Date('2026-06-21'), time: '19h00', place: 'Salle Pierre Perret, Ans', order: 1 },
  { tag: 'Stage', title: 'Stage d\u2019été Hip-Hop & Breaking', date: new Date('2026-07-05'), time: '10h00 – 16h00', place: 'Studio 1', order: 2 },
  { tag: 'Découverte', title: 'Portes ouvertes & cours d\u2019essai', date: new Date('2026-09-14'), time: '14h00 – 18h00', place: 'Tous les studios', order: 3 },
  { tag: 'Compétition', title: 'Battle Crazy Dance 2026', date: new Date('2026-10-12'), time: '18h00', place: 'Studio principal', order: 4 },
];

const gallery = [
  { label: 'Showcase annuel', category: 'Showcase', size: 'large', image: '/uploads/placeholder.png', order: 1 },
  { label: 'Hip-Hop', category: 'Hip-Hop', size: 'wide', image: '/uploads/placeholder.png', order: 2 },
  { label: '', category: '', size: 'small', image: '/uploads/placeholder.png', order: 3 },
  { label: 'Latino', category: 'Latino', size: 'small', image: '/uploads/placeholder.png', order: 4 },
  { label: 'Contemporain', category: 'Contemporain', size: 'wide', image: '/uploads/placeholder.png', order: 5 },
];

async function run() {
  await connectDB(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/avenir_crazy_dance');

  await Promise.all([
    Course.deleteMany({}),
    Teacher.deleteMany({}),
    Post.deleteMany({}),
    Event.deleteMany({}),
    GalleryItem.deleteMany({}),
  ]);

  await Course.insertMany(courses);
  await Teacher.insertMany(teachers);
  await Post.insertMany(posts);
  await Event.insertMany(events);
  await GalleryItem.insertMany(gallery);

  console.log('✓ Données de démonstration insérées :');
  console.log(`  ${courses.length} cours, ${teachers.length} professeurs, ${posts.length} articles,`);
  console.log(`  ${events.length} évènements, ${gallery.length} éléments de galerie.`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

