import {
  Product,
  Supplier,
  StockMovement,
  ReorderAlert,
  AIForecast,
  DashboardStats,
  SupabaseHealthStatus,
  ApiResponse,
  CustomerInquiry,
  InquiryStatus,
  RAGSourceCitation,
  RAGChatMessage,
} from '../types/inventory.ts';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errMessage = `HTTP Error ${res.status}: ${res.statusText}`;
    try {
      const errorJson = await res.json();
      if (errorJson.error) errMessage = errorJson.error;
    } catch {
      // ignore json parse error
    }
    throw new Error(errMessage);
  }

  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

export const inventoryApi = {
  // System Health & Supabase Status
  async getHealth(): Promise<{ server: string; uptime: number; supabase: SupabaseHealthStatus }> {
    return fetchJson('/health');
  },

  // Products / Inventory
  async getProducts(params?: { search?: string; category?: string; status?: string }): Promise<Product[]> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.status) searchParams.set('status', params.status);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return fetchJson(`/inventory${query}`);
  },

  async getProduct(id: string): Promise<Product> {
    return fetchJson(`/inventory/${id}`);
  },

  async createProduct(product: Partial<Product>): Promise<Product> {
    return fetchJson('/inventory', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    return fetchJson(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteProduct(id: string): Promise<void> {
    return fetchJson(`/inventory/${id}`, {
      method: 'DELETE',
    });
  },

  // Stock Adjustment
  async adjustStock(params: {
    productId: string;
    movementType: 'in' | 'out' | 'adjustment' | 'transfer' | 'return';
    quantity: number;
    reason?: string;
    referenceNumber?: string;
    performedBy?: string;
  }): Promise<{ product: Product; movement: StockMovement }> {
    return fetchJson(`/inventory/${params.productId}/adjust`, {
      method: 'POST',
      body: JSON.stringify({
        movement_type: params.movementType,
        quantity: params.quantity,
        reason: params.reason,
        reference_number: params.referenceNumber,
        performed_by: params.performedBy,
      }),
    });
  },

  // Stock Movements
  async getMovements(productId?: string): Promise<StockMovement[]> {
    const query = productId ? `?productId=${productId}` : '';
    return fetchJson(`/movements${query}`);
  },

  // Reorder Alerts
  async getAlerts(status: string = 'active'): Promise<ReorderAlert[]> {
    return fetchJson(`/alerts?status=${status}`);
  },

  async resolveAlert(id: string, status: 'resolved' | 'dismissed' = 'resolved'): Promise<void> {
    return fetchJson(`/alerts/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    return fetchJson('/suppliers');
  },

  async createSupplier(supplier: Partial<Supplier>): Promise<Supplier> {
    return fetchJson('/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplier),
    });
  },

  // Dashboard Metrics & AI
  async getDashboardStats(): Promise<DashboardStats> {
    return fetchJson('/dashboard/stats');
  },

  async getAIForecasts(): Promise<AIForecast[]> {
    return fetchJson('/dashboard/forecasts');
  },

  // Customer Inquiries & AI Response
  async getCustomerInquiries(params?: { status?: string; priority?: string }): Promise<CustomerInquiry[]> {
    const searchParams = new URLSearchParams();
    if (params?.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params?.priority && params.priority !== 'all') searchParams.set('priority', params.priority);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return fetchJson(`/customer-inquiries${query}`);
  },

  async getCustomerInquiry(id: string): Promise<CustomerInquiry> {
    return fetchJson(`/customer-inquiries/${id}`);
  },

  async createCustomerInquiry(inquiry: Partial<CustomerInquiry>): Promise<CustomerInquiry> {
    return fetchJson('/customer-inquiries', {
      method: 'POST',
      body: JSON.stringify(inquiry),
    });
  },

  async generateAICustomerResponse(
    id: string,
    tone: 'formal' | 'friendly' | 'urgent' = 'formal'
  ): Promise<{
    inquiry: CustomerInquiry;
    suggestedResponse: string;
    stockDetails: {
      availableStock: number;
      canFulfillImmediately: boolean;
      unitPrice: number;
      productName: string;
    };
  }> {
    return fetchJson(`/customer-inquiries/${id}/generate-ai-response`, {
      method: 'POST',
      body: JSON.stringify({ tone }),
    });
  },

  async sendCustomerResponse(id: string, responseText: string): Promise<CustomerInquiry> {
    return fetchJson(`/customer-inquiries/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify({ response: responseText }),
    });
  },

  async updateInquiryStatus(id: string, status: InquiryStatus): Promise<CustomerInquiry> {
    return fetchJson(`/customer-inquiries/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // RAG Chatbot
  async sendRAGChat(params: {
    query: string;
    history?: { role: 'user' | 'assistant'; content: string }[];
    mode?: 'customer' | 'staff';
  }): Promise<{
    answer: string;
    sources: RAGSourceCitation[];
    suggestedActions?: {
      label: string;
      actionType: 'navigate_inventory' | 'adjust_stock' | 'view_supplier' | 'quote';
      payload?: any;
    }[];
  }> {
    return fetchJson('/rag/chat', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async getRAGKnowledgeStats(): Promise<{
    totalChunks: number;
    chunksByType: Record<string, number>;
  }> {
    return fetchJson('/rag/knowledge-base');
  },
};
