import { Router, Request, Response } from 'express';
import { inventoryService } from '../supabaseServer.ts';

const router = Router();

// GET /api/inventory - Get all products with query filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, category, status } = req.query;
    const products = await inventoryService.getProducts({
      search: search as string,
      category: category as string,
      status: status as string,
    });
    res.json({
      success: true,
      data: products,
      meta: { count: products.length },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch inventory items',
    });
  }
});

// GET /api/inventory/:id - Get product by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const product = await inventoryService.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/inventory - Create new product
router.post('/', async (req: Request, res: Response) => {
  try {
    const { sku, name, category, unit, cost_price, selling_price, current_stock, min_reorder_level, location, supplier_id } = req.body;
    if (!sku || !name || !category) {
      return res.status(400).json({
        success: false,
        error: 'SKU, Name, and Category are required fields.',
      });
    }

    const created = await inventoryService.createProduct(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/inventory/:id - Update product
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const updated = await inventoryService.updateProduct(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/inventory/:id - Delete product
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const success = await inventoryService.deleteProduct(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Product not found or already deleted' });
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/inventory/:id/adjust - Adjust stock level & log movement
router.post('/:id/adjust', async (req: Request, res: Response) => {
  try {
    const { movement_type, quantity, reason, reference_number, performed_by } = req.body;
    if (!movement_type || quantity === undefined) {
      return res.status(400).json({
        success: false,
        error: 'movement_type and quantity are required.',
      });
    }

    const result = await inventoryService.adjustStock({
      productId: req.params.id,
      movementType: movement_type,
      quantity: Number(quantity),
      reason,
      referenceNumber: reference_number,
      performedBy: performed_by,
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
