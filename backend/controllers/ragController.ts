import { Request, Response } from 'express';
import { ragService } from '../services/ragService.ts';

export const ragController = {
  async chat(req: Request, res: Response) {
    try {
      const { query, history, mode } = req.body;
      if (!query || typeof query !== 'string' || query.trim() === '') {
        return res.status(400).json({ success: false, error: 'Query is required' });
      }

      const result = await ragService.generateAnswer(
        query.trim(),
        history || [],
        mode || 'customer'
      );

      res.json({ success: true, data: result });
    } catch (err: any) {
      console.error('[RAGController] chat error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async getKnowledgeBase(req: Request, res: Response) {
    try {
      const corpus = await ragService.buildKnowledgeCorpus();
      res.json({
        success: true,
        data: {
          totalChunks: corpus.length,
          chunksByType: {
            products: corpus.filter((c) => c.type === 'product').length,
            suppliers: corpus.filter((c) => c.type === 'supplier').length,
            alerts: corpus.filter((c) => c.type === 'alert').length,
            policies: corpus.filter((c) => c.type === 'policy').length,
          },
          chunks: corpus,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
};
