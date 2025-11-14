import 'reflect-metadata';
import express, { ErrorRequestHandler } from 'express';
import { useExpressServer } from 'routing-controllers';
import { connectDB } from './config/database';
import { ExpenseController } from './controllers/expenseController';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());

app.use((req, res, next) => {
  console.log('Incoming request:', req.method, req.url);
  next();
});

// Setup Apollo Server
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
});

// Start Apollo Server
(async () => {
  await apolloServer.start();

  // Apply Apollo middleware
  app.use('/graphql', express.json(), expressMiddleware(apolloServer) as any);
})();

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
  console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
});
