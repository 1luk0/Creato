import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const { MONGO_URI } = process.env;

if (!MONGO_URI) {
  throw new Error('MONGO_URI no está definido en .env');
}

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Atlas conectado');
  } catch (error) {
    console.error('Error conectando a MongoDB Atlas:', error);
    process.exit(1);
  }
};
