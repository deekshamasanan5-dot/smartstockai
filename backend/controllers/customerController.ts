import { Request, Response } from 'express';
import { inventoryService } from '../services/inventoryService.ts';

export const customerController = {
  async getInquiries(req: Request, res: Response) {
    try {
      const { status, priority } = req.query;
      const inquiries = await inventoryService.getCustomerInquiries({
        status: status as string,
        priority: priority as string,
      });
      res.json({ success: true, data: inquiries, meta: { count: inquiries.length } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async getInquiryById(req: Request, res: Response) {
    try {
      const inquiry = await inventoryService.getCustomerInquiryById(req.params.id);
      if (!inquiry) {
        return res.status(404).json({ success: false, error: 'Customer inquiry not found' });
      }
      res.json({ success: true, data: inquiry });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async createInquiry(req: Request, res: Response) {
    try {
      const { customer_name, email, subject, message } = req.body;
      if (!customer_name || !email || !subject || !message) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: customer_name, email, subject, and message are mandatory.',
        });
      }
      const inquiry = await inventoryService.createCustomerInquiry(req.body);
      res.status(201).json({ success: true, data: inquiry });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async generateAIResponse(req: Request, res: Response) {
    try {
      const { tone } = req.body;
      const result = await inventoryService.generateAICustomerResponse(
        req.params.id,
        tone as 'formal' | 'friendly' | 'urgent'
      );
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async sendResponse(req: Request, res: Response) {
    try {
      const { response: responseText } = req.body;
      if (!responseText) {
        return res.status(400).json({ success: false, error: 'Response text is required' });
      }
      const updated = await inventoryService.respondToCustomerInquiry(req.params.id, responseText);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async updateStatus(req: Request, res: Response) {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ success: false, error: 'Status is required' });
      }
      const updated = await inventoryService.updateInquiryStatus(req.params.id, status);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
};
