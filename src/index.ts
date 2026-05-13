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
  const maxRetries = 10;
  const retryDelayMs = 3000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await initDatabase();
      console.log('Database initialized');
      app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
      return;
    } catch (err) {
      if (attempt === maxRetries) {
        console.error('Failed to start server after max retries:', err);
        process.exit(1);
      }
      console.warn(`DB connection attempt ${attempt}/${maxRetries} failed, retrying in ${retryDelayMs / 1000}s...`);
      await new Promise(res => setTimeout(res, retryDelayMs));
    }
  }
}

bootstrap();
