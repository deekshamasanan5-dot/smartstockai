import React from 'react';
import {
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  Package,
  MessageSquare,
  Bot,
  Truck,
  History,
  CheckCircle2,
  Database,
  ArrowRight,
} from 'lucide-react';
import {
  DashboardStats,
  ReorderAlert,
  StockMovement,
  Product,
  CustomerInquiry,
  SupabaseHealthStatus,
} from '../types/inventory.ts';
import { NavTab } from './Sidebar.tsx';

interface DashboardViewProps {
  stats: DashboardStats | null;
  alerts: ReorderAlert[];
  movements: StockMovement[];
  products: Product[];
  inquiries: CustomerInquiry[];
  health: SupabaseHealthStatus | null;
  onNavigate: (tab: NavTab) => void;
  onOpenConfig: () => void;
  onOpenAddProduct: () => void;
  onSelectProductForAdjust: (prod: Product, qty: number, reason: string) => void;
}

const formatINR = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val);
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  alerts,
  movements,
  products,
  inquiries,
  health,
  onNavigate,
  onOpenConfig,
  onOpenAddProduct,
  onSelectProductForAdjust,
}) => {
  const pendingInquiries = inquiries.filter((i) => i.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Supabase Connection Alert Banner (if in fallback mode) */}
      {!health?.isConnected && (
        <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-white rounded-lg text-[#4F46E5] shadow-xs shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#1E1B4B]">
                Operating via High-Fidelity Local Mock & Fallback State
              </h4>
              <p className="text-xs text-[#4338CA] mt-0.5 leading-relaxed">
                Connect your live Supabase PostgreSQL database to persist inventory records and real-time stock sync.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenConfig}
            className="text-xs font-semibold px-3 py-1.5 bg-[#4F46E5] text-white rounded-lg hover:bg-[#4338CA] whitespace-nowrap shadow-xs shrink-0"
          >
            Supabase Setup Guide
          </button>
        </div>
      )}

      {/* High-Level Metric Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Valuation */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">
              Total Inventory Valuation
            </span>
            <div className="text-2xl font-bold text-[#111827] mt-1 tabular-nums">
              {stats ? formatINR(stats.totalInventoryValue) : '₹0.00'}
            </div>
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-[#16A34A] mt-3 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+12.4% vs last audit</span>
          </div>
        </div>

        {/* Card 2: Managed SKUs */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">
              Active Managed SKUs
            </span>
            <div className="text-2xl font-bold text-[#111827] mt-1 tabular-nums">
              {stats?.totalSKUs || products.length}
            </div>
          </div>
          <div className="text-xs text-[#6B7280] mt-3">
            <span className="text-[#16A34A] font-semibold">{stats?.inStockCount ?? 0} In Stock</span> •{' '}
            <span className="text-[#D97706] font-semibold">{stats?.lowStockCount ?? 0} Low</span>
          </div>
        </div>

        {/* Card 3: Stockout & Buffer Alerts */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">
              Stockout & Buffer Alerts
            </span>
            <div className="text-2xl font-bold text-[#DC2626] mt-1 tabular-nums">
              {alerts.length}
            </div>
          </div>
          <div className="text-xs text-[#DC2626] mt-3 font-medium flex items-center space-x-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{stats?.outOfStockCount || 0} zero-stock items require PO</span>
          </div>
        </div>

        {/* Card 4: Inbound Customer Inquiries */}
        <div
          onClick={() => onNavigate('customers')}
          className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col justify-between cursor-pointer hover:border-[#C7D2FE] transition-colors group"
        >
          <div>
            <span className="text-xs font-medium text-[#6B7280] uppercase tracking-wider flex items-center justify-between">
              <span>Customer Inquiries</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#4F46E5] transition-colors" />
            </span>
            <div className="text-2xl font-bold text-[#4F46E5] mt-1 tabular-nums">
              {inquiries.length}
            </div>
          </div>
          <div className="text-xs text-[#6B7280] mt-3 font-medium">
            <span className="text-[#D97706] font-bold">{pendingInquiries.length} Pending Reply</span> •{' '}
            <span className="text-emerald-600 font-semibold">{inquiries.filter((i) => i.status === 'replied').length} Replied</span>
          </div>
        </div>
      </section>

      {/* AI Predictive Restock Banner */}
      {alerts.length > 0 && (
        <section className="bg-white border-l-4 border-l-[#F59E0B] border border-[#E5E7EB] rounded-xl p-4 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-[#FEF3C7] text-[#D97706] rounded-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#D97706]">
                    AI Restock Recommendation
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#FEF3C7] text-[#D97706] rounded-full">
                    {alerts[0].severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#111827] mt-0.5">
                  {alerts[0].product?.name || 'Critical SKU depletion'}
                </p>
                <p className="text-xs text-[#4B5563] mt-0.5">
                  {alerts[0].ai_prediction ||
                    `Current stock (${alerts[0].current_stock}) is below safety threshold (${alerts[0].threshold}). Suggested order quantity: ${alerts[0].suggested_quantity} units.`}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 self-end md:self-auto">
              <button
                onClick={() => {
                  const targetProd = products.find((p) => p.id === alerts[0].product_id);
                  if (targetProd) {
                    onSelectProductForAdjust(
                      targetProd,
                      alerts[0].suggested_quantity,
                      `Restock per AI alert recommendation`
                    );
                  }
                }}
                className="px-3.5 py-1.5 bg-[#4F46E5] text-white rounded-lg text-xs font-semibold hover:bg-[#4338CA] transition-colors shadow-xs"
              >
                Restock ({alerts[0].suggested_quantity} Units)
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Split Section: RAG Chatbot Hero & Recent Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: RAG Chatbot Feature Card (7 cols) */}
        <div className="lg:col-span-7 bg-linear-to-br from-[#4F46E5] to-[#4338CA] rounded-2xl p-6 text-white shadow-md flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold text-white/90">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>RAG Knowledge Retrieval System Active</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
              Instant Answers Grounded in Live Warehouse & Customer Data
            </h3>

            <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed max-w-xl">
              Ask questions about real-time stock levels, pricing in ₹ INR, supplier lead times, delivery SLAs, or generate customized customer quotation responses with 100% factual citations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('chatbot')}
              className="px-4 py-2.5 bg-white text-[#4F46E5] rounded-xl text-xs sm:text-sm font-bold hover:bg-indigo-50 transition-colors shadow-xs flex items-center space-x-2"
            >
              <Bot className="w-4 h-4" />
              <span>Open RAG AI Chatbot</span>
            </button>

            <button
              onClick={() => onNavigate('customers')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors border border-white/20 flex items-center space-x-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Respond to Inquiries ({pendingInquiries.length})</span>
            </button>
          </div>
        </div>

        {/* Right: Quick Activity / Movements Stream (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 text-[#4F46E5]" />
              <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                Recent Stock Movements
              </h4>
            </div>
            <button
              onClick={() => onNavigate('audit')}
              className="text-xs text-[#4F46E5] hover:text-[#4338CA] font-semibold"
            >
              View All
            </button>
          </div>

          <div className="divide-y divide-[#F3F4F6] overflow-y-auto max-h-56 my-2 space-y-1">
            {movements.slice(0, 4).map((m) => (
              <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-[#111827] block truncate max-w-[180px]">
                    {m.product?.name || m.product_id}
                  </span>
                  <span className="text-[10px] text-[#6B7280]">
                    {m.reason || `${m.movement_type.toUpperCase()} adjustment`}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`font-bold tabular-nums ${
                      m.quantity > 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                    }`}
                  >
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity} units
                  </span>
                  <span className="text-[10px] text-[#9CA3AF] block">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[#F3F4F6] flex items-center justify-between text-[11px] text-[#6B7280]">
            <span>Audit Ledger Active</span>
            <span className="font-semibold text-[#111827]">{movements.length} logged entries</span>
          </div>
        </div>
      </div>
    </div>
  );
};
