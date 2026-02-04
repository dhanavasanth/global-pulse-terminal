import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { biasRouter } from './routes/bias';
import { newsRouter } from './routes/news';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001; // Use 5001 to avoid conflict with Frontend (5173) or other services

app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Global Pulse Terminal Backend is Running 🚀' });
});

app.use('/api/bias', biasRouter);
app.use('/api/news', newsRouter);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
