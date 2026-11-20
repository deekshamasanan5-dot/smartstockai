import { inventoryService } from './inventoryService.ts';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

export interface RAGKnowledgeChunk {
  id: string;
  type: 'product' | 'supplier' | 'alert' | 'policy' | 'faq';
  title: string;
  content: string;
  metadata: Record<string, any>;
}

export interface RAGRetrievalResult {
  chunk: RAGKnowledgeChunk;
  score: number;
}

export interface RAGChatResponse {
  answer: string;
  sources: {
    title: string;
    type: string;
    snippet: string;
    score: number;
    metadata?: Record<string, any>;
  }[];
  suggestedActions?: {
    label: string;
    actionType: 'navigate_inventory' | 'adjust_stock' | 'view_supplier' | 'quote';
    payload?: any;
  }[];
}

// Operational warehouse knowledge & policies
const WAREHOUSE_POLICIES: RAGKnowledgeChunk[] = [
  {
    id: 'pol-001',
    type: 'policy',
    title: 'Domestic Shipping & Fulfillment SLA',
    content:
      'All in-stock orders confirmed before 4:00 PM IST (Monday through Saturday) are dispatched same-day from our Bengaluru central hub. Express air courier transit takes 24-48 hours for Tier-1 cities (Delhi NCR, Mumbai, Hyderabad, Chennai, Pune). Standard surface transit takes 3-5 business days for other regional hubs.',
    metadata: { category: 'shipping', cutoff: '16:00 IST' },
  },
  {
    id: 'pol-002',
    type: 'policy',
    title: 'Tiered Volume Discounts & Bulk Quotations',
    content:
      'Wholesale and institutional volume pricing tiers: Tier 1 (1-19 units): Standard listing price. Tier 2 (20-49 units): 5% off standard listing price. Tier 3 (50-99 units): 10% off standard listing price. Tier 4 (100+ units): 15% off standard listing price + free express logistics. Formal GST quotations are valid for 14 calendar days.',
    metadata: { category: 'pricing', gst: '18%' },
  },
  {
    id: 'pol-003',
    type: 'policy',
    title: 'Warranty & Return Policy',
    content:
      'All active electronic modules and components include a standard 1-year manufacturer replacement warranty against functional defects. Unused, unopened products in original anti-static packaging can be returned within 15 days of delivery for a 100% store credit or refund. DOA (Dead on Arrival) items must be reported within 72 hours of receipt with video evidence.',
    metadata: { category: 'warranty', duration: '1 year' },
  },
  {
    id: 'pol-004',
    type: 'policy',
    title: 'Minimum Reorder & Safety Buffer Methodology',
    content:
      'Safety stock thresholds are dynamically computed: Safety Stock = (Max Daily Consumption * Max Lead Time Days) - (Average Daily Consumption * Average Lead Time Days). When inventory hits the min_reorder_level, automated alerts trigger an expedited PO recommendation.',
    metadata: { category: 'inventory_control' },
  },
];

export class RAGService {
  private genAI: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim() !== '') {
      try {
        this.genAI = new GoogleGenAI({ apiKey });
      } catch (err) {
        console.warn('[RAGService] Failed to initialize GoogleGenAI with key:', err);
      }
    }
  }

  // 1. Build Knowledge Corpus from Live Inventory & Static Policies
  async buildKnowledgeCorpus(): Promise<RAGKnowledgeChunk[]> {
    const chunks: RAGKnowledgeChunk[] = [...WAREHOUSE_POLICIES];

    try {
      // Products
      const products = await inventoryService.getProducts();
      for (const p of products) {
        chunks.push({
          id: `prod-${p.id}`,
          type: 'product',
          title: `${p.name} (SKU: ${p.sku})`,
          content: `Product Name: ${p.name}. SKU: ${p.sku}. Category: ${p.category}. Status: ${p.status.toUpperCase()}. Current Available Stock: ${p.current_stock} ${p.unit}. Cost Price: ₹${p.cost_price}. Selling Price: ₹${p.selling_price} (INR). Min Reorder Level: ${p.min_reorder_level} units. Max Stock: ${p.max_stock_level} units. Warehouse Location: ${p.location}. Description: ${p.description || 'N/A'}.`,
          metadata: {
            productId: p.id,
            sku: p.sku,
            currentStock: p.current_stock,
            sellingPrice: p.selling_price,
            status: p.status,
            category: p.category,
          },
        });
      }

      // Suppliers
      const suppliers = await inventoryService.getSuppliers();
      for (const s of suppliers) {
        chunks.push({
          id: `sup-${s.id}`,
          type: 'supplier',
          title: `Supplier: ${s.name} (${s.code})`,
          content: `Supplier Name: ${s.name} (${s.code}). Contact Person: ${s.contact_person || 'N/A'}. Email: ${s.email || 'N/A'}. Phone: ${s.phone || 'N/A'}. Location: ${s.city}, ${s.state}. Lead Time: ${s.lead_time_days} days. Quality Rating: ${s.rating}/5.0. Status: ${s.status}. Specialization Notes: ${s.notes || 'N/A'}.`,
          metadata: {
            supplierId: s.id,
            code: s.code,
            leadTimeDays: s.lead_time_days,
            rating: s.rating,
          },
        });
      }

      // Active Alerts
      const alerts = await inventoryService.getAlerts('active');
      for (const a of alerts) {
        chunks.push({
          id: `alert-${a.id}`,
          type: 'alert',
          title: `Stock Alert: ${a.product?.name || 'Item'} (${a.severity.toUpperCase()})`,
          content: `Alert Type: ${a.alert_type}. Severity: ${a.severity}. Current Stock: ${a.current_stock}. Safety Threshold: ${a.threshold}. Recommended Order Quantity: ${a.suggested_quantity} units. AI Diagnostic: ${a.ai_prediction || 'Low stock threshold breached.'}`,
          metadata: {
            alertId: a.id,
            productId: a.product_id,
            severity: a.severity,
          },
        });
      }
    } catch (err) {
      console.error('[RAGService] Error compiling dynamic knowledge chunks:', err);
    }

    return chunks;
  }

  // 2. Retrieve Relevant Context Chunks (BM25 / Keyword Similarity Scoring)
  async retrieveContext(query: string, topK: number = 4): Promise<RAGRetrievalResult[]> {
    const corpus = await this.buildKnowledgeCorpus();
    const queryTokens = query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2);

    if (queryTokens.length === 0) {
      return corpus.slice(0, topK).map((chunk) => ({ chunk, score: 0.5 }));
    }

    const scored: RAGRetrievalResult[] = [];

    for (const chunk of corpus) {
      const titleLower = chunk.title.toLowerCase();
      const contentLower = chunk.content.toLowerCase();

      let score = 0;
      for (const token of queryTokens) {
        // Higher weight for matches in title or SKU
        if (titleLower.includes(token)) score += 3.5;
        // Moderate weight for content match
        if (contentLower.includes(token)) score += 1.2;
      }

      // Bonus for exact word boundary matches
      for (const token of queryTokens) {
        const regex = new RegExp(`\\b${token}\\b`, 'i');
        if (regex.test(titleLower)) score += 2.0;
        if (regex.test(contentLower)) score += 0.8;
      }

      // Normalize score
      if (score > 0) {
        const normalized = Math.min(1.0, score / (queryTokens.length * 3.5));
        scored.push({ chunk, score: parseFloat(normalized.toFixed(2)) });
      }
    }

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    // If no strong matches, fallback to general product/policy overview
    if (scored.length === 0) {
      return corpus.slice(0, topK).map((chunk) => ({ chunk, score: 0.25 }));
    }

    return scored.slice(0, topK);
  }

  // 3. Generate Answer (Gemini API or Deterministic Grounded Engine)
  async generateAnswer(
    query: string,
    history: { role: 'user' | 'assistant'; content: string }[] = [],
    mode: 'customer' | 'staff' = 'customer'
  ): Promise<RAGChatResponse> {
    const retrieved = await this.retrieveContext(query, 5);

    const contextSnippet = retrieved
      .map(
        (r, i) =>
          `[Source ${i + 1}] (${r.chunk.type.toUpperCase()}: ${r.chunk.title})\n${r.chunk.content}`
      )
      .join('\n\n');

    // Build suggested actions based on retrieved items
    const suggestedActions: RAGChatResponse['suggestedActions'] = [];
    const productChunks = retrieved.filter((r) => r.chunk.type === 'product');
    if (productChunks.length > 0) {
      const topProd = productChunks[0].chunk.metadata;
      suggestedActions.push({
        label: `View ${topProd.sku} in Inventory`,
        actionType: 'navigate_inventory',
        payload: { sku: topProd.sku },
      });
      if (topProd.currentStock <= 15) {
        suggestedActions.push({
          label: `Adjust / Restock ${topProd.sku}`,
          actionType: 'adjust_stock',
          payload: { productId: topProd.productId },
        });
      }
    }

    // Check if we can use Google GenAI
    let generatedAnswer = '';
    const hasLiveGemini = !!this.genAI;

    if (hasLiveGemini && this.genAI) {
      try {
        const systemInstruction = `You are SmartStock AI, an expert, highly accurate inventory assistant and customer support bot for an Indian electronics and components enterprise.
All currency values are strictly in Indian Rupees (₹ INR).
Current Mode: ${mode === 'customer' ? 'Customer Support & Inquiries (Be polite, helpful, clear on stock availability, pricing, shipping SLAs and discounts)' : 'Internal Inventory Controller / Staff (Be precise, highlight stock levels, margins, supplier lead times, and actionable warehouse recommendations)'}.

GROUNDING RULES:
1. Ground your response ONLY in the retrieved sources provided below.
2. If real-time stock is available, state the exact quantity and unit price in ₹.
3. If an item is out of stock, mention the expected restock lead time from the supplier.
4. If asked about bulk orders, cite the volume discount tiers.
5. If the exact answer is not present in the sources, say so honestly and offer to contact the operations desk.

RETRIEVED KNOWLEDGE SOURCES:
${contextSnippet}`;

        const prompt = `User Query: "${query}"`;
        const response = await this.genAI.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            { role: 'user', parts: [{ text: `${systemInstruction}\n\n${prompt}` }] },
          ],
        });

        if (response.text) {
          generatedAnswer = response.text;
        }
      } catch (err) {
        console.warn('[RAGService] Gemini call failed, falling back to deterministic grounding:', err);
      }
    }

    // Fallback: Deterministic high-precision Grounded RAG Generator
    if (!generatedAnswer) {
      generatedAnswer = this.deterministicGroundedResponse(query, retrieved, mode);
    }

    const sources = retrieved.map((r) => ({
      title: r.chunk.title,
      type: r.chunk.type,
      snippet: r.chunk.content.slice(0, 180) + '...',
      score: r.score,
      metadata: r.chunk.metadata,
    }));

    return {
      answer: generatedAnswer,
      sources,
      suggestedActions,
    };
  }

  // High-fidelity fallback that grounds answer directly in retrieved chunks
  private deterministicGroundedResponse(
    query: string,
    retrieved: RAGRetrievalResult[],
    mode: 'customer' | 'staff'
  ): string {
    const qLower = query.toLowerCase();

    // Check for product match
    const prodMatches = retrieved.filter((r) => r.chunk.type === 'product');
    const policyMatches = retrieved.filter((r) => r.chunk.type === 'policy');
    const supplierMatches = retrieved.filter((r) => r.chunk.type === 'supplier');
    const alertMatches = retrieved.filter((r) => r.chunk.type === 'alert');

    if (prodMatches.length > 0 && (qLower.includes('stock') || qLower.includes('price') || qLower.includes('cost') || qLower.includes('avail') || qLower.includes('do you have') || qLower.includes('how many'))) {
      const topProd = prodMatches[0].chunk;
      const meta = topProd.metadata;
      const statusText = meta.status === 'in_stock' ? 'In Stock ✅' : meta.status === 'low_stock' ? 'Low Stock ⚠️' : 'Out of Stock ❌';

      if (mode === 'customer') {
        return `Hello! Regarding your inquiry on **${topProd.title}**:\n\n- **Availability:** ${meta.currentStock} units available right now (${statusText}).\n- **Unit Price:** ₹${meta.sellingPrice?.toLocaleString('en-IN')} (exclusive of 18% GST).\n- **Fulfillment:** Orders placed before 4:00 PM IST qualify for same-day dispatch from our central facility, with 24-48h express delivery to major cities.\n\nFor bulk orders of 20+ units, a 5% discount applies (10% for 50+ units). Would you like to proceed with a formal quotation?`;
      } else {
        return `**Inventory Status for ${topProd.title}:**\n\n- **Current Stock:** ${meta.currentStock} units (${statusText})\n- **Location:** ${topProd.content.match(/Warehouse Location: ([^.]+)/)?.[1] || 'Main Hub'}\n- **Selling Price:** ₹${meta.sellingPrice?.toLocaleString('en-IN')} | **Cost Price:** ₹${topProd.content.match(/Cost Price: ₹([0-9.]+)/)?.[1] || '0.00'}\n\n${meta.currentStock <= 15 ? '⚠️ *Action Recommended:* Stock is at or below reorder threshold. Supplier replenishment PO advised.' : 'Operational stock level is currently healthy.'}`;
      }
    }

    if (qLower.includes('ship') || qLower.includes('deliver') || qLower.includes('transit') || qLower.includes('sla')) {
      const pol = policyMatches.find((p) => p.chunk.id === 'pol-001') || policyMatches[0];
      return `**Shipping & Fulfillment Details:**\n\n${pol ? pol.chunk.content : 'Orders placed before 4:00 PM IST dispatch same-day. Express air delivery takes 24-48 hours across metro cities in India.'}\n\nTracking numbers are sent automatically via SMS and email upon courier pickup.`;
    }

    if (qLower.includes('return') || qLower.includes('warranty') || qLower.includes('damaged') || qLower.includes('replace')) {
      const pol = policyMatches.find((p) => p.chunk.id === 'pol-003') || policyMatches[0];
      return `**Warranty & Returns Policy:**\n\n${pol ? pol.chunk.content : 'All active electronics include a 1-year replacement warranty. Unopened items can be returned within 15 days.'}`;
    }

    if (qLower.includes('discount') || qLower.includes('bulk') || qLower.includes('quotation') || qLower.includes('wholesale')) {
      const pol = policyMatches.find((p) => p.chunk.id === 'pol-002') || policyMatches[0];
      return `**Volume Discount Structure:**\n\n${pol ? pol.chunk.content : 'We offer 5% off for 20+ units, 10% off for 50+ units, and 15% off for 100+ units.'}\n\nAll quotations are valid for 14 calendar days and include itemized GST breakdowns.`;
    }

    if (supplierMatches.length > 0 && (qLower.includes('supplier') || qLower.includes('vendor') || qLower.includes('lead time'))) {
      const s = supplierMatches[0].chunk;
      return `**Supplier Information:**\n\n${s.content}\n\nOur procurement department maintains active contracts with this vendor with guaranteed lead time compliance.`;
    }

    // General fallback synthesising top retrieved context
    return `Based on our real-time warehouse data and operations handbook:\n\n${retrieved.map((r) => `• **${r.chunk.title}:** ${r.chunk.content}`).join('\n\n')}\n\nIf you need additional assistance, our inventory operations desk is available at support@smartstock.in.`;
  }
}

export const ragService = new RAGService();
