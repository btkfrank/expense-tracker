import 'reflect-metadata';
import express, { ErrorRequestHandler } from 'express';
import { useExpressServer } from 'routing-controllers';
import { connectDB } from './config/database';
import { ExpenseController } from './controllers/expenseController';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { upload } from './middleware/upload';
import Expense from './models/Expense';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
// app.use(express.json());

app.use((req, res, next) => {
  console.log('Incoming request:', req.method, req.url);
  next();
});

// Setup routing-controllers
useExpressServer(app, {
  controllers: [ExpenseController],
  routePrefix: '/api',
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err);
    res.status(400).json({ message: err.message });
  } else if (err) {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: err.message });
  }
  next();
};

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
