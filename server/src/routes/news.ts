import { Router } from 'express';
import { getLatestNews } from '../services/NewsService';

export const newsRouter = Router();

newsRouter.get('/', async (req, res) => {
    try {
        const news = await getLatestNews();
        res.json(news);
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});
