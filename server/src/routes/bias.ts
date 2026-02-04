import { Router } from 'express';
import { getMockBiasFactors, calculateBiasScore } from '../services/BiasEngine';

export const biasRouter = Router();

biasRouter.get('/', (req, res) => {
    try {
        // In a real app, you would fetch live data here
        const factors = getMockBiasFactors();
        const result = calculateBiasScore(factors);
        res.json(result);
    } catch (error) {
        console.error('Error calculating bias:', error);
        res.status(500).json({ error: 'Failed to calculate bias' });
    }
});
