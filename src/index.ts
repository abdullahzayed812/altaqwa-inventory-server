import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import * as dotenv from 'dotenv';
import { initDatabase } from './infrastructure/database/connection';
import apiRoutes from './presentation/routes';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

async function bootstrap() {
  try {
    await initDatabase();
    console.log('Database initialized');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();
