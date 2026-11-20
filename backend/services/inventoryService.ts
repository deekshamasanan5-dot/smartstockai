import { supabase } from '../config/supabase.ts';
import {
  initialProducts,
  initialSuppliers,
  initialMovements,
  initialAlerts,
  initialForecasts,
  initialCustomerInquiries,
} from '../data/seedData.ts';
import {
  Product,
  Supplier,
  StockMovement,
  ReorderAlert,
  AIForecast,
  DashboardStats,
  CustomerInquiry,
  InquiryStatus,
} from '../types/index.ts';

// In-memory data store for development & mock fallback
let memoryProducts: Product[] = JSON.parse(JSON.stringify(initialProducts));
let memorySuppliers: Supplier[] = JSON.parse(JSON.stringify(initialSuppliers));
let memoryMovements: StockMovement[] = JSON.parse(JSON.stringify(initialMovements));
let memoryAlerts: ReorderAlert[] = JSON.parse(JSON.stringify(initialAlerts));
let memoryForecasts: AIForecast[] = JSON.parse(JSON.stringify(initialForecasts));
let memoryInquiries: CustomerInquiry[] = JSON.parse(JSON.stringify(initialCustomerInquiries));

export const inventoryService = {
  // 1. Fetch Products
  async getProducts(params?: { search?: string; category?: string; status?: string }): Promise<Product[]> {
    if (supabase) {
      try {
        let query = supabase.from('products').select('*, supplier:suppliers(*)');
        if (params?.category && params.category !== 'all') {
          query = query.eq('category', params.category);
        }
        if (params?.status && params.status !== 'all') {
          query = query.eq('status', params.status);
        }
        if (params?.search) {
          query = query.or(`name.ilike.%${params.search}%,sku.ilike.%${params.search}%`);
        }
        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (!error && data) return data as Product[];
      } catch (err) {
        console.warn('[Service] Supabase getProducts failed, using in-memory store:', err);
      }
    }

    let items = [...memoryProducts];
    if (params?.category && params.category !== 'all') {
      items = items.filter((p) => p.category.toLowerCase() === params.category!.toLowerCase());
    }
    if (params?.status && params.status !== 'all') {
      items = items.filter((p) => p.status === params.status);
    }
    if (params?.search) {
      const s = params.search.toLowerCase();
      items = items.filter((p) => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s));
    }
    return items;
  },

  // 2. Fetch Single Product
  async getProductById(id: string): Promise<Product | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, supplier:suppliers(*)')
          .eq('id', id)
          .single();
        if (!error && data) return data as Product;
      } catch (err) {
        console.warn('[Service] Supabase getProductById failed:', err);
      }
    }
    return memoryProducts.find((p) => p.id === id) || null;
  },

  // 3. Create Product
  async createProduct(productData: Partial<Product>): Promise<Product> {
    const newProduct: Product = {
      id: productData.id || `b${Date.now().toString(16).padStart(31, '0')}`,
      sku: productData.sku || `SKU-${Date.now().toString().slice(-6)}`,
      name: productData.name || 'New Item',
      description: productData.description || '',
      category: productData.category || 'General',
      unit: productData.unit || 'Units',
      cost_price: Number(productData.cost_price) || 0,
      selling_price: Number(productData.selling_price) || 0,
      current_stock: Number(productData.current_stock) || 0,
      min_reorder_level: Number(productData.min_reorder_level) || 10,
      max_stock_level: Number(productData.max_stock_level) || 100,
      reorder_quantity: Number(productData.reorder_quantity) || 25,
      location: productData.location || 'Warehouse A - Bay 01',
      status: (Number(productData.current_stock) <= 0
        ? 'out_of_stock'
        : Number(productData.current_stock) <= (Number(productData.min_reorder_level) || 10)
        ? 'low_stock'
        : 'in_stock') as any,
      supplier_id: productData.supplier_id || undefined,
      tags: productData.tags || [],
      is_active: productData.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .insert([
            {
              sku: newProduct.sku,
              name: newProduct.name,
              description: newProduct.description,
              category: newProduct.category,
              unit: newProduct.unit,
              cost_price: newProduct.cost_price,
              selling_price: newProduct.selling_price,
              current_stock: newProduct.current_stock,
              min_reorder_level: newProduct.min_reorder_level,
              max_stock_level: newProduct.max_stock_level,
              reorder_quantity: newProduct.reorder_quantity,
              location: newProduct.location,
              supplier_id: newProduct.supplier_id || null,
              tags: newProduct.tags,
            },
          ])
          .select('*, supplier:suppliers(*)')
          .single();

        if (!error && data) return data as Product;
      } catch (err) {
        console.warn('[Service] Supabase createProduct failed:', err);
      }
    }

    memoryProducts.unshift(newProduct);
    return newProduct;
  },

  // 4. Update Product
  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select('*, supplier:suppliers(*)')
          .single();

        if (!error && data) return data as Product;
      } catch (err) {
        console.warn('[Service] Supabase updateProduct failed:', err);
      }
    }

    const idx = memoryProducts.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const current = memoryProducts[idx];
    const updated = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    if (updated.current_stock <= 0) {
      updated.status = 'out_of_stock';
    } else if (updated.current_stock <= updated.min_reorder_level) {
      updated.status = 'low_stock';
    } else {
      updated.status = 'in_stock';
    }
    memoryProducts[idx] = updated;
    return updated;
  },

  // 5. Delete Product
  async deleteProduct(id: string): Promise<boolean> {
    if (supabase) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (!error) return true;
      } catch (err) {
        console.warn('[Service] Supabase deleteProduct failed:', err);
      }
    }

    const initialLen = memoryProducts.length;
    memoryProducts = memoryProducts.filter((p) => p.id !== id);
    return memoryProducts.length < initialLen;
  },

  // 6. Record Stock Adjustment & Movement
  async adjustStock(params: {
    productId: string;
    movementType: 'in' | 'out' | 'adjustment' | 'transfer' | 'return';
    quantity: number;
    reason?: string;
    referenceNumber?: string;
    performedBy?: string;
  }): Promise<{ product: Product; movement: StockMovement }> {
    const product = await this.getProductById(params.productId);
    if (!product) {
      throw new Error(`Product ID ${params.productId} not found.`);
    }

    const previousStock = product.current_stock;
    let newStock = previousStock;

    if (params.movementType === 'in' || params.movementType === 'return') {
      newStock = previousStock + Math.abs(params.quantity);
    } else if (params.movementType === 'out') {
      newStock = Math.max(0, previousStock - Math.abs(params.quantity));
    } else if (params.movementType === 'adjustment') {
      newStock = Math.max(0, previousStock + params.quantity);
    }

    const movement: StockMovement = {
      id: `m${Date.now().toString(16).padStart(31, '0')}`,
      product_id: params.productId,
      movement_type: params.movementType,
      quantity: params.quantity,
      previous_stock: previousStock,
      new_stock: newStock,
      unit_cost: product.cost_price,
      reference_number: params.referenceNumber || `ADJ-${Date.now().toString().slice(-4)}`,
      reason: params.reason || `Stock adjustment (${params.movementType})`,
      performed_by: params.performedBy || 'System Admin',
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        const { data: mvData } = await supabase
          .from('stock_movements')
          .insert([movement])
          .select()
          .single();

        const updated = await this.updateProduct(params.productId, { current_stock: newStock });

        if (newStock <= product.min_reorder_level) {
          await supabase.from('reorder_alerts').insert([
            {
              product_id: product.id,
              alert_type: newStock === 0 ? 'out_of_stock' : 'low_stock',
              severity: newStock === 0 ? 'critical' : 'warning',
              current_stock: newStock,
              threshold: product.min_reorder_level,
              suggested_quantity: product.reorder_quantity,
              ai_prediction: `Stock depleted to ${newStock} units. Recommended replenishment quantity: ${product.reorder_quantity}.`,
              status: 'active',
            },
          ]);
        }

        return {
          product: updated || { ...product, current_stock: newStock },
          movement: (mvData as StockMovement) || movement,
        };
      } catch (err) {
        console.warn('[Service] Supabase adjustStock failed, continuing in memory:', err);
      }
    }

    const updatedProd = await this.updateProduct(params.productId, { current_stock: newStock });
    memoryMovements.unshift(movement);

    if (newStock <= product.min_reorder_level) {
      const existing = memoryAlerts.find((a) => a.product_id === product.id && a.status === 'active');
      if (!existing) {
        memoryAlerts.unshift({
          id: `c${Date.now().toString(16).padStart(31, '0')}`,
          product_id: product.id,
          product: updatedProd || product,
          alert_type: newStock === 0 ? 'out_of_stock' : 'low_stock',
          severity: newStock === 0 ? 'critical' : 'warning',
          current_stock: newStock,
          threshold: product.min_reorder_level,
          suggested_quantity: product.reorder_quantity,
          ai_prediction: `Stock fell to ${newStock} units (threshold: ${product.min_reorder_level}).`,
          status: 'active',
          created_at: new Date().toISOString(),
        });
      }
    }

    return {
      product: updatedProd || { ...product, current_stock: newStock },
      movement,
    };
  },

  // 7. Get Stock Movements
  async getMovements(productId?: string): Promise<StockMovement[]> {
    if (supabase) {
      try {
        let query = supabase
          .from('stock_movements')
          .select('*, product:products(name, sku, unit)');
        if (productId) query = query.eq('product_id', productId);
        query = query.order('created_at', { ascending: false }).limit(100);

        const { data, error } = await query;
        if (!error && data) return data as StockMovement[];
      } catch (err) {
        console.warn('[Service] Supabase getMovements failed:', err);
      }
    }

    if (productId) {
      return memoryMovements.filter((m) => m.product_id === productId);
    }
    return memoryMovements;
  },

  // 8. Get Alerts
  async getAlerts(status: string = 'active'): Promise<ReorderAlert[]> {
    if (supabase) {
      try {
        let query = supabase
          .from('reorder_alerts')
          .select('*, product:products(*, supplier:suppliers(*))');
        if (status !== 'all') query = query.eq('status', status);
        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (!error && data) return data as ReorderAlert[];
      } catch (err) {
        console.warn('[Service] Supabase getAlerts failed:', err);
      }
    }

    if (status !== 'all') {
      return memoryAlerts.filter((a) => a.status === status);
    }
    return memoryAlerts;
  },

  // 9. Resolve Alert
  async resolveAlert(alertId: string, status: 'resolved' | 'dismissed'): Promise<boolean> {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('reorder_alerts')
          .update({
            status,
            resolved_at: new Date().toISOString(),
          })
          .eq('id', alertId);
        if (!error) return true;
      } catch (err) {
        console.warn('[Service] Supabase resolveAlert failed:', err);
      }
    }

    const alert = memoryAlerts.find((a) => a.id === alertId);
    if (alert) {
      alert.status = status;
      alert.resolved_at = new Date().toISOString();
      return true;
    }
    return false;
  },

  // 10. Get Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('suppliers').select('*').order('name');
        if (!error && data) return data as Supplier[];
      } catch (err) {
        console.warn('[Service] Supabase getSuppliers failed:', err);
      }
    }
    return memorySuppliers;
  },

  // 11. Create Supplier
  async createSupplier(supplierData: Partial<Supplier>): Promise<Supplier> {
    const newSupplier: Supplier = {
      id: supplierData.id || `a${Date.now().toString(16).padStart(31, '0')}`,
      code: supplierData.code || `SUP-${Date.now().toString().slice(-4)}`,
      name: supplierData.name || 'New Supplier',
      contact_person: supplierData.contact_person,
      email: supplierData.email,
      phone: supplierData.phone,
      address: supplierData.address,
      city: supplierData.city,
      state: supplierData.state,
      lead_time_days: Number(supplierData.lead_time_days) || 7,
      rating: Number(supplierData.rating) || 4.5,
      status: supplierData.status || 'active',
      notes: supplierData.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('suppliers')
          .insert([newSupplier])
          .select()
          .single();
        if (!error && data) return data as Supplier;
      } catch (err) {
        console.warn('[Service] Supabase createSupplier failed:', err);
      }
    }

    memorySuppliers.push(newSupplier);
    return newSupplier;
  },

  // 12. Dashboard Stats Calculation
  async getDashboardStats(): Promise<DashboardStats> {
    const products = await this.getProducts();
    const alerts = await this.getAlerts('active');

    const totalInventoryValue = products.reduce((acc, p) => acc + p.current_stock * p.cost_price, 0);
    const totalSKUs = products.length;
    const inStockCount = products.filter((p) => p.status === 'in_stock').length;
    const lowStockCount = products.filter((p) => p.status === 'low_stock').length;
    const outOfStockCount = products.filter((p) => p.status === 'out_of_stock').length;
    const criticalAlertsCount = alerts.filter((a) => a.severity === 'critical').length;

    return {
      totalInventoryValue,
      totalSKUs,
      inStockCount,
      lowStockCount,
      outOfStockCount,
      criticalAlertsCount,
      activePurchaseOrders: 3,
      monthlyTurnoverRate: 4.2,
    };
  },

  // 13. Demand Forecasts
  async getAIForecasts(): Promise<AIForecast[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('ai_forecasts')
          .select('*, product:products(*)');
        if (!error && data) return data as AIForecast[];
      } catch (err) {
        console.warn('[Service] Supabase getAIForecasts failed:', err);
      }
    }
    return memoryForecasts;
  },

  // 14. Customer Inquiries
  async getCustomerInquiries(params?: { status?: string; priority?: string }): Promise<CustomerInquiry[]> {
    if (supabase) {
      try {
        let query = supabase.from('customer_inquiries').select('*').order('created_at', { ascending: false });
        if (params?.status && params.status !== 'all') {
          query = query.eq('status', params.status);
        }
        if (params?.priority && params.priority !== 'all') {
          query = query.eq('priority', params.priority);
        }
        const { data, error } = await query;
        if (!error && data) return data as CustomerInquiry[];
      } catch (err) {
        console.warn('[Service] Supabase getCustomerInquiries failed, using in-memory store:', err);
      }
    }

    let items = [...memoryInquiries];
    if (params?.status && params.status !== 'all') {
      items = items.filter((i) => i.status === params.status);
    }
    if (params?.priority && params.priority !== 'all') {
      items = items.filter((i) => i.priority === params.priority);
    }
    return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getCustomerInquiryById(id: string): Promise<CustomerInquiry | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('customer_inquiries').select('*').eq('id', id).single();
        if (!error && data) return data as CustomerInquiry;
      } catch (err) {
        console.warn('[Service] Supabase getCustomerInquiryById failed:', err);
      }
    }
    return memoryInquiries.find((i) => i.id === id) || null;
  },

  async createCustomerInquiry(inquiryData: Partial<CustomerInquiry>): Promise<CustomerInquiry> {
    const newInquiry: CustomerInquiry = {
      id: crypto.randomUUID ? crypto.randomUUID() : `inq-${Date.now()}`,
      customer_name: inquiryData.customer_name || 'Anonymous Customer',
      email: inquiryData.email || 'customer@example.com',
      phone: inquiryData.phone || '',
      company: inquiryData.company || '',
      inquiry_type: inquiryData.inquiry_type || 'stock_check',
      product_id: inquiryData.product_id,
      product_name: inquiryData.product_name,
      requested_quantity: inquiryData.requested_quantity || 1,
      subject: inquiryData.subject || 'Stock Inquiry',
      message: inquiryData.message || '',
      priority: inquiryData.priority || 'medium',
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        const { data, error } = await supabase.from('customer_inquiries').insert([newInquiry]).select().single();
        if (!error && data) return data as CustomerInquiry;
      } catch (err) {
        console.warn('[Service] Supabase createCustomerInquiry failed:', err);
      }
    }

    memoryInquiries.unshift(newInquiry);
    return newInquiry;
  },

  // 15. Smart AI Customer Response Generator
  async generateAICustomerResponse(id: string, tone: 'formal' | 'friendly' | 'urgent' = 'formal'): Promise<{
    inquiry: CustomerInquiry;
    suggestedResponse: string;
    stockDetails: {
      availableStock: number;
      canFulfillImmediately: boolean;
      unitPrice: number;
      productName: string;
    };
  }> {
    const inquiry = await this.getCustomerInquiryById(id);
    if (!inquiry) throw new Error('Customer inquiry not found');

    // Retrieve product details if product_id is set
    let targetProduct: Product | null = null;
    if (inquiry.product_id) {
      targetProduct = await this.getProductById(inquiry.product_id);
    } else if (inquiry.product_name) {
      const allProds = await this.getProducts();
      targetProduct = allProds.find((p) => p.name.toLowerCase().includes(inquiry.product_name!.toLowerCase())) || null;
    }

    const availableStock = targetProduct ? targetProduct.current_stock : 0;
    const requestedQty = inquiry.requested_quantity || 1;
    const canFulfill = availableStock >= requestedQty;
    const unitPrice = targetProduct ? targetProduct.selling_price : 0;
    const productName = targetProduct ? targetProduct.name : (inquiry.product_name || 'Requested Item');
    const totalCost = unitPrice * requestedQty;

    let responseDraft = '';

    if (tone === 'formal') {
      responseDraft = `Dear ${inquiry.customer_name},\n\nThank you for contacting SmartStock Precision Inventory regarding your inquiry on "${productName}".\n\n`;
      if (targetProduct) {
        if (canFulfill) {
          responseDraft += `We are pleased to inform you that we currently have ${availableStock} units in stock at our warehouse, which fully satisfies your requested quantity of ${requestedQty} units.\n\n`;
          responseDraft += `Commercial Quotation Details:\n- Item: ${productName} (SKU: ${targetProduct.sku})\n- Unit Price: ₹${unitPrice.toLocaleString('en-IN')}\n- Requested Quantity: ${requestedQty} units\n- Total Estimated Amount: ₹${totalCost.toLocaleString('en-IN')} (exclusive of 18% GST)\n- Dispatch Lead Time: 24 to 48 hours via express freight.\n\n`;
        } else if (availableStock > 0) {
          responseDraft += `We currently have ${availableStock} units immediately on hand (partial fulfillment of your ${requestedQty} unit requirement).\n`;
          responseDraft += `Our next scheduled factory replenishment batch is expected within 5-7 business days.\n\nUnit Price: ₹${unitPrice.toLocaleString('en-IN')} per unit.\n\n`;
        } else {
          responseDraft += `Currently, this item is in high demand and is temporarily zero-stock at our primary distribution hub.\n`;
          responseDraft += `A purchase order has been placed with our preferred supplier, and new stock is scheduled to arrive within 7 business days.\n\n`;
        }
      } else {
        responseDraft += `We have reviewed your request: "${inquiry.subject}". Our customer operations team is reviewing catalog specifications to ensure the best solution for your project.\n\n`;
      }
      responseDraft += `Please confirm if you would like us to reserve the units and issue a formal Proforma Invoice.\n\nSincerely,\nSmartStock Customer Operations Team\nSmartStock Precision Inventory`;
    } else if (tone === 'friendly') {
      responseDraft = `Hi ${inquiry.customer_name}!\n\nThanks for reaching out to us at SmartStock! Great to connect with you.\n\n`;
      if (canFulfill) {
        responseDraft += `Good news — we have ${availableStock} units of "${productName}" ready to go right now! Your requested ${requestedQty} units can be packed and dispatched straight away.\n\n`;
        responseDraft += `Pricing is ₹${unitPrice.toLocaleString('en-IN')} per unit (Total: ₹${totalCost.toLocaleString('en-IN')} + GST). We can have this on its way to you within 24 hours.\n\n`;
      } else {
        responseDraft += `We checked our inventory for "${productName}". Right now we have ${availableStock} units in stock. We are actively restocking and our next batch will land very soon!\n\n`;
      }
      responseDraft += `Let us know if you'd like us to hold this stock for you or help you with anything else!\n\nCheers,\nSmartStock Support Team`;
    } else {
      // urgent
      responseDraft = `ATTN: ${inquiry.customer_name},\n\nPRIORITY RESPONSE — SmartStock Rapid Fulfillment Desk.\n\n`;
      if (canFulfill) {
        responseDraft += `STATUS: READY FOR SAME-DAY DISPATCH.\nInventory Level: ${availableStock} available | Requirement: ${requestedQty} units.\nUnit Rate: ₹${unitPrice.toLocaleString('en-IN')}.\n\nTo lock in dispatch for today's courier cutoff, please confirm your delivery address and billing details immediately.\n\n`;
      } else {
        responseDraft += `STATUS: BACKORDER EXPEDITED.\nAvailable: ${availableStock}/${requestedQty} units.\nWe have triggered an emergency priority PO with our distributor to shorten lead time.\n\n`;
      }
      responseDraft += `Regards,\nSmartStock Priority Dispatch Team`;
    }

    // Save draft on the inquiry
    inquiry.ai_draft_response = responseDraft;
    inquiry.status = inquiry.status === 'pending' ? 'drafted' : inquiry.status;

    if (supabase) {
      try {
        await supabase
          .from('customer_inquiries')
          .update({ ai_draft_response: responseDraft, status: inquiry.status })
          .eq('id', id);
      } catch (err) {
        console.warn('[Service] Supabase update draft failed:', err);
      }
    }

    return {
      inquiry,
      suggestedResponse: responseDraft,
      stockDetails: {
        availableStock,
        canFulfillImmediately: canFulfill,
        unitPrice,
        productName,
      },
    };
  },

  async respondToCustomerInquiry(id: string, responseText: string): Promise<CustomerInquiry> {
    const inquiry = await this.getCustomerInquiryById(id);
    if (!inquiry) throw new Error('Inquiry not found');

    inquiry.final_response = responseText;
    inquiry.status = 'replied';
    inquiry.responded_at = new Date().toISOString();

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('customer_inquiries')
          .update({
            final_response: responseText,
            status: 'replied',
            responded_at: inquiry.responded_at,
          })
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data as CustomerInquiry;
      } catch (err) {
        console.warn('[Service] Supabase respondToCustomerInquiry failed:', err);
      }
    }

    return inquiry;
  },

  async updateInquiryStatus(id: string, status: InquiryStatus): Promise<CustomerInquiry> {
    const inquiry = await this.getCustomerInquiryById(id);
    if (!inquiry) throw new Error('Inquiry not found');

    inquiry.status = status;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('customer_inquiries')
          .update({ status })
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data as CustomerInquiry;
      } catch (err) {
        console.warn('[Service] Supabase updateInquiryStatus failed:', err);
      }
    }

    return inquiry;
  },
};

