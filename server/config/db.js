import mongoose from 'mongoose';

export async function connectDB(uri) {
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(uri);
    console.log('✓ Connecté à MongoDB');
  } catch (err) {
    console.error('✗ Erreur de connexion MongoDB :', err.message);
    process.exit(1);
  }
}

