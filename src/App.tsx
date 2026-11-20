import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  Plus,
  Search,
  RefreshCw,
  Database,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  X,
  ExternalLink,
  History,
  Info
} from 'lucide-react';
import { inventoryApi } from './services/api.ts';
import {
  Product,
  StockMovement,
  ReorderAlert,
  DashboardStats,
  SupabaseHealthStatus,
  Supplier,
  StockStatus,
  MovementType
} from './types/inventory.ts';

// Helper to format currency in Indian Rupees
const formatINR = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val);
};

export default function App() {
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [alerts, setAlerts] = useState<ReorderAlert[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [health, setHealth] = useState<SupabaseHealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals & Drawers
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [adjustModalProduct, setAdjustModalProduct] = useState<Product | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAuditDrawer, setShowAuditDrawer] = useState(false);

  // Adjustment Form
  const [adjustType, setAdjustType] = useState<MovementType>('in');
  const [adjustQty, setAdjustQty] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  // New Product Form
  const [newProduct, setNewProduct] = useState({
    sku: '',
    name: '',
    category: 'Microcontrollers',
    unit: 'Units',
    cost_price: 100,
    selling_price: 180,
    current_stock: 25,
    min_reorder_level: 10,
    max_stock_level: 100,
    reorder_quantity: 30,
    location: 'Warehouse A - Bay 01',
    supplier_id: '',
  });

  // Load Data
  const loadAllData = async () => {
    setIsRefreshing(true);
    try {
      // 1. Health check
      try {
        const healthRes = await inventoryApi.getHealth();
        setHealth(healthRes.supabase);
      } catch (e) {
        setHealth({
          isConfigured: false,
          isConnected: false,
          mode: 'fallback_mock',
          message: 'Backend server starting or offline. Operating via local mock state.',
        });
      }

      // 2. Fetch parallel entities
      const [prodsData, alertsData, statsData, supsData, movsData] = await Promise.allSettled([
        inventoryApi.getProducts(),
        inventoryApi.getAlerts('active'),
        inventoryApi.getDashboardStats(),
        inventoryApi.getSuppliers(),
        inventoryApi.getMovements(),
      ]);

      if (prodsData.status === 'fulfilled') setProducts(prodsData.value);
      if (alertsData.status === 'fulfilled') setAlerts(alertsData.value);
      if (statsData.status === 'fulfilled') setStats(statsData.value);
      if (supsData.status === 'fulfilled') setSuppliers(supsData.value);
      if (movsData.status === 'fulfilled') setMovements(movsData.value);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['all', ...Array.from(set)];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        searchQuery === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || p.status === selectedStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchQuery, selectedCategory, selectedStatus]);

  // Handle Stock Adjustment Submit
  const handleStockAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalProduct || adjustQty <= 0) return;
    setAdjustSubmitting(true);
    try {
      await inventoryApi.adjustStock({
        productId: adjustModalProduct.id,
        movementType: adjustType,
        quantity: Number(adjustQty),
        reason: adjustReason || `Manual ${adjustType} adjustment`,
        performedBy: 'Lead Inventory Controller',
      });
      setAdjustModalProduct(null);
      setAdjustReason('');
      setAdjustQty(10);
      await loadAllData();
    } catch (err: any) {
      alert(`Adjustment error: ${err.message}`);
    } finally {
      setAdjustSubmitting(false);
    }
  };

  // Handle Add Product Submit
  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inventoryApi.createProduct(newProduct);
      setShowAddProductModal(false);
      setNewProduct({
        sku: '',
        name: '',
        category: 'Microcontrollers',
        unit: 'Units',
        cost_price: 100,
        selling_price: 180,
        current_stock: 25,
        min_reorder_level: 10,
        max_stock_level: 100,
        reorder_quantity: 30,
        location: 'Warehouse A - Bay 01',
        supplier_id: '',
      });
      await loadAllData();
    } catch (err: any) {
      alert(`Error creating product: ${err.message}`);
    }
  };

  // Status Badge Component
  const StatusBadge = ({ status }: { status: StockStatus }) => {
    switch (status) {
      case 'in_stock':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#DCFCE7] text-[#16A34A]">
            In Stock
          </span>
        );
      case 'low_stock':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FEF3C7] text-[#D97706]">
            Low Stock
          </span>
        );
      case 'out_of_stock':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FEE2E2] text-[#DC2626]">
            Out of Stock
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] flex flex-col font-sans antialiased">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white font-bold shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-[#111827]">
                SmartStock<span className="text-[#4F46E5]">AI</span>
              </span>
              <span className="ml-2 text-xs text-[#6B7280] font-medium hidden sm:inline-block">
                Precision Inventory Control
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-[#E5E7EB] hidden md:block" />

          {/* Supabase Status Pill */}
          <button
            onClick={() => setShowConfigModal(true)}
            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer border transition-colors ${
              health?.isConnected
                ? 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0] hover:bg-[#BBF7D0]'
                : 'bg-[#EEF2FF] text-[#4F46E5] border-[#C7D2FE] hover:bg-[#E0E7FF]'
            }`}
            title="Click to view Supabase Connection & Configuration Details"
          >
            <Database className="w-3.5 h-3.5" />
            <span>
              {health?.isConnected ? 'Supabase: Connected' : 'Supabase: Mock Mode (Click to Config)'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                health?.isConnected ? 'bg-[#16A34A] animate-pulse' : 'bg-[#4F46E5]'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadAllData}
            disabled={isRefreshing}
            className="p-2 text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-lg transition-colors border border-[#E5E7EB]"
            title="Refresh inventory"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#4F46E5]' : ''}`} />
          </button>

          <button
            onClick={() => setShowAuditDrawer(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-[#E5E7EB] bg-white text-[#374151] rounded-lg text-xs font-medium hover:bg-[#F9FAFB] transition-colors shadow-xs"
          >
            <History className="w-3.5 h-3.5 text-[#6B7280]" />
            <span className="hidden sm:inline">Audit Ledger</span>
          </button>

          <button
            onClick={() => setShowAddProductModal(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#4F46E5] text-white rounded-lg text-xs font-semibold hover:bg-[#4338CA] transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Supabase Connection Alert Banner (if in fallback mode) */}
        {!health?.isConnected && (
          <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-lg p-4 flex items-start justify-between shadow-xs">
            <div className="flex items-start space-x-3">
              <div className="p-1.5 bg-white rounded-md text-[#4F46E5] shadow-xs">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#1E1B4B]">
                  Supabase Backend Configuration
                </h4>
                <p className="text-xs text-[#4338CA] mt-0.5 leading-relaxed">
                  The backend is currently serving high-fidelity local mock data. To link your live
                  Supabase PostgreSQL database, execute <code className="bg-white/80 px-1 py-0.5 rounded font-mono text-[11px]">supabase/schema.sql</code> in the Supabase SQL editor and update your <code className="bg-white/80 px-1 py-0.5 rounded font-mono text-[11px]">.env</code> keys.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowConfigModal(true)}
              className="text-xs font-semibold px-3 py-1.5 bg-[#4F46E5] text-white rounded-md hover:bg-[#4338CA] whitespace-nowrap shadow-xs ml-4"
            >
              Setup Guide
            </button>
          </div>
        )}

        {/* High-Level Metric Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Valuation */}
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-5 shadow-xs flex flex-col justify-between">
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

          {/* Card 2: Active SKUs */}
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-5 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                Managed SKUs
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

          {/* Card 3: Critical Alerts */}
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-5 shadow-xs flex flex-col justify-between">
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

          {/* Card 4: Inventory Turnover */}
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-5 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                Monthly Turnover Rate
              </span>
              <div className="text-2xl font-bold text-[#111827] mt-1 tabular-nums">
                {stats?.monthlyTurnoverRate || 4.2}x
              </div>
            </div>
            <div className="text-xs text-[#4F46E5] mt-3 font-medium flex items-center space-x-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Optimal operational range</span>
            </div>
          </div>
        </section>

        {/* AI Predictive Restock Banner */}
        {alerts.length > 0 && (
          <section className="bg-white border-l-4 border-l-[#F59E0B] border border-[#E5E7EB] rounded-lg p-4 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-[#FEF3C7] text-[#D97706] rounded-md">
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
                      setAdjustModalProduct(targetProd);
                      setAdjustType('in');
                      setAdjustQty(alerts[0].suggested_quantity);
                      setAdjustReason(`Restock per AI alert recommendation`);
                    }
                  }}
                  className="px-3 py-1.5 bg-[#4F46E5] text-white rounded-md text-xs font-semibold hover:bg-[#4338CA] transition-colors shadow-xs"
                >
                  Restock ({alerts[0].suggested_quantity} Units)
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Filter and Control Bar */}
        <section className="bg-white rounded-lg border border-[#E5E7EB] p-4 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by SKU, product name, or category..."
                className="w-full pl-9 pr-4 py-2 border border-[#D1D5DB] rounded-lg text-sm placeholder-[#9CA3AF] focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-[#D1D5DB] rounded-lg text-xs font-medium text-[#374151] bg-white focus:outline-none focus:border-[#4F46E5]"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'all' ? 'All Categories' : c}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-[#D1D5DB] rounded-lg text-xs font-medium text-[#374151] bg-white focus:outline-none focus:border-[#4F46E5]"
              >
                <option value="all">All Statuses</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
          </div>
        </section>

        {/* Inventory Table */}
        <section className="bg-white rounded-lg border border-[#E5E7EB] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-xs">
              <thead className="bg-[#F9FAFB] uppercase font-semibold text-[#6B7280] tracking-wider text-[11px]">
                <tr>
                  <th scope="col" className="px-5 py-3">SKU & Item Name</th>
                  <th scope="col" className="px-4 py-3">Category</th>
                  <th scope="col" className="px-4 py-3 text-right">Cost (₹)</th>
                  <th scope="col" className="px-4 py-3 text-right">Selling (₹)</th>
                  <th scope="col" className="px-4 py-3 text-center">Stock Level</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Warehouse Location</th>
                  <th scope="col" className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-[#6B7280]">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#4F46E5] mb-2" />
                      Loading inventory records...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-[#6B7280]">
                      No inventory items match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-[#F8FAFC] transition-colors">
                      {/* SKU & Name */}
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-[#111827] text-sm">{p.name}</div>
                        <div className="font-mono text-[11px] text-[#6B7280] tracking-tight">
                          {p.sku}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5 text-[#4B5563]">
                        <span className="inline-block px-2 py-0.5 bg-[#F3F4F6] rounded text-[11px]">
                          {p.category}
                        </span>
                      </td>

                      {/* Cost Price */}
                      <td className="px-4 py-3.5 text-right font-medium tabular-nums text-[#374151]">
                        {formatINR(p.cost_price)}
                      </td>

                      {/* Selling Price */}
                      <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-[#111827]">
                        {formatINR(p.selling_price)}
                      </td>

                      {/* Current Stock vs Buffer */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="font-bold text-sm tabular-nums text-[#111827]">
                          {p.current_stock}
                        </span>
                        <span className="text-[11px] text-[#9CA3AF] ml-1">
                          / min {p.min_reorder_level}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <StatusBadge status={p.status} />
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3.5 text-[#4B5563] text-xs">
                        {p.location}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right space-x-2">
                        <button
                          onClick={() => {
                            setAdjustModalProduct(p);
                            setAdjustType('in');
                            setAdjustQty(10);
                            setAdjustReason('');
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-[#4F46E5] bg-[#EEF2FF] hover:bg-[#E0E7FF] rounded border border-[#C7D2FE] transition-colors cursor-pointer"
                        >
                          Adjust Stock
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between text-xs text-[#6B7280]">
            <span>Showing {filteredProducts.length} of {products.length} catalog items</span>
            <span className="font-medium">Currencies in Indian Rupee (₹)</span>
          </div>
        </section>
      </main>

      {/* Stock Adjustment Modal */}
      {adjustModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-[#E5E7EB] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
              <div>
                <h3 className="font-semibold text-sm text-[#111827]">Adjust Inventory Level</h3>
                <p className="text-xs text-[#6B7280]">{adjustModalProduct.name} ({adjustModalProduct.sku})</p>
              </div>
              <button
                onClick={() => setAdjustModalProduct(null)}
                className="text-[#9CA3AF] hover:text-[#111827]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStockAdjustSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">
                  Movement Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['in', 'out', 'adjustment'] as MovementType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAdjustType(t)}
                      className={`py-2 text-xs font-semibold rounded-lg border capitalize ${
                        adjustType === t
                          ? 'bg-[#4F46E5] text-white border-[#4F46E5]'
                          : 'bg-white text-[#374151] border-[#D1D5DB] hover:bg-[#F9FAFB]'
                      }`}
                    >
                      {t === 'in' ? 'Stock In (+)' : t === 'out' ? 'Stock Out (-)' : 'Audit Set'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">
                  Quantity ({adjustModalProduct.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:border-[#4F46E5]"
                />
                <span className="text-[11px] text-[#6B7280] mt-1 block">
                  Current stock: <strong className="text-[#111827]">{adjustModalProduct.current_stock}</strong>. Projected new stock:{' '}
                  <strong className="text-[#4F46E5]">
                    {adjustType === 'in'
                      ? adjustModalProduct.current_stock + adjustQty
                      : adjustType === 'out'
                      ? Math.max(0, adjustModalProduct.current_stock - adjustQty)
                      : adjustQty}
                  </strong>
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">
                  Reason / Reference Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Inbound shipment PO-882, damaged goods, physical count"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:border-[#4F46E5]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalProduct(null)}
                  className="px-4 py-2 border border-[#D1D5DB] text-[#374151] rounded-lg text-xs font-semibold hover:bg-[#F9FAFB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustSubmitting}
                  className="px-4 py-2 bg-[#4F46E5] text-white rounded-lg text-xs font-semibold hover:bg-[#4338CA] transition-colors"
                >
                  {adjustSubmitting ? 'Recording...' : 'Confirm Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-[#E5E7EB] overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
              <h3 className="font-semibold text-sm text-[#111827]">Add New Inventory Product</h3>
              <button
                onClick={() => setShowAddProductModal(false)}
                className="text-[#9CA3AF] hover:text-[#111827]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="SKU-ESP-001"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#D1D5DB] rounded-lg text-xs focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    placeholder="Microcontrollers"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#D1D5DB] rounded-lg text-xs focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="ESP32 Development Board"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full px-3 py-1.5 border border-[#D1D5DB] rounded-lg text-xs focus:outline-none focus:border-[#4F46E5]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newProduct.cost_price}
                    onChange={(e) => setNewProduct({ ...newProduct, cost_price: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-[#D1D5DB] rounded-lg text-xs focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newProduct.selling_price}
                    onChange={(e) => setNewProduct({ ...newProduct, selling_price: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-[#D1D5DB] rounded-lg text-xs focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={newProduct.current_stock}
                    onChange={(e) => setNewProduct({ ...newProduct, current_stock: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-[#D1D5DB] rounded-lg text-xs focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Min Reorder Level</label>
                  <input
                    type="number"
                    min="1"
                    value={newProduct.min_reorder_level}
                    onChange={(e) => setNewProduct({ ...newProduct, min_reorder_level: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-[#D1D5DB] rounded-lg text-xs focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Warehouse Location</label>
                  <input
                    type="text"
                    placeholder="Warehouse A - Bay 01"
                    value={newProduct.location}
                    onChange={(e) => setNewProduct({ ...newProduct, location: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#D1D5DB] rounded-lg text-xs focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 border border-[#D1D5DB] text-[#374151] rounded-lg text-xs font-semibold hover:bg-[#F9FAFB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4F46E5] text-white rounded-lg text-xs font-semibold hover:bg-[#4338CA] transition-colors"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Ledger Drawer */}
      {showAuditDrawer && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col border-l border-[#E5E7EB]">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-[#4F46E5]" />
                <h3 className="font-semibold text-base text-[#111827]">Stock Movement Audit Ledger</h3>
              </div>
              <button
                onClick={() => setShowAuditDrawer(false)}
                className="text-[#9CA3AF] hover:text-[#111827]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-3">
              {movements.length === 0 ? (
                <p className="text-xs text-[#6B7280] text-center py-10">No movements recorded yet.</p>
              ) : (
                movements.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 bg-white border border-[#E5E7EB] rounded-lg shadow-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                          m.movement_type === 'in'
                            ? 'bg-[#DCFCE7] text-[#16A34A]'
                            : m.movement_type === 'out'
                            ? 'bg-[#FEE2E2] text-[#DC2626]'
                            : 'bg-[#EEF2FF] text-[#4F46E5]'
                        }`}
                      >
                        {m.movement_type} {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </span>
                      <span className="text-[11px] text-[#9CA3AF]">
                        {new Date(m.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-[#111827]">
                      {m.product?.name || `Product ID: ${m.product_id}`}
                    </div>
                    <div className="text-xs text-[#4B5563]">{m.reason}</div>
                    <div className="text-[11px] text-[#6B7280] flex items-center justify-between pt-1 border-t border-[#F3F4F6]">
                      <span>By: {m.performed_by}</span>
                      <span>Stock: {m.previous_stock} → <strong>{m.new_stock}</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Supabase Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full border border-[#E5E7EB] overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-[#4F46E5]" />
                <h3 className="font-semibold text-base text-[#111827]">
                  Supabase Integration & Configuration
                </h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-[#9CA3AF] hover:text-[#111827]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#374151]">
              {/* Status Header */}
              <div
                className={`p-4 rounded-lg border ${
                  health?.isConnected
                    ? 'bg-[#DCFCE7]/60 border-[#BBF7D0]'
                    : 'bg-[#EEF2FF] border-[#C7D2FE]'
                }`}
              >
                <div className="flex items-center space-x-2 font-bold text-sm">
                  {health?.isConnected ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
                      <span className="text-[#166534]">Connected to Supabase PostgreSQL</span>
                    </>
                  ) : (
                    <>
                      <Info className="w-5 h-5 text-[#4F46E5]" />
                      <span className="text-[#1E1B4B]">Running in Offline Mock Fallback Mode</span>
                    </>
                  )}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#4B5563]">{health?.message}</p>
                {health?.databaseStats && (
                  <div className="mt-2 text-[11px] font-mono text-[#374151] bg-white/80 p-2 rounded">
                    Synced Records: {health.databaseStats.productsCount} products,{' '}
                    {health.databaseStats.suppliersCount} suppliers,{' '}
                    {health.databaseStats.alertsCount} active alerts.
                  </div>
                )}
              </div>

              {/* Step-by-Step Instructions */}
              <div>
                <h4 className="font-bold text-sm text-[#111827] mb-2">
                  How to link your live Supabase project:
                </h4>
                <ol className="list-decimal list-inside space-y-2.5 text-[#4B5563] leading-relaxed">
                  <li>
                    Create a free Supabase project at{' '}
                    <a
                      href="https://supabase.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#4F46E5] underline inline-flex items-center"
                    >
                      supabase.com <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                    .
                  </li>
                  <li>
                    In your Supabase dashboard, navigate to <strong>SQL Editor</strong>, open the project file <code className="bg-[#F3F4F6] text-[#111827] px-1 py-0.5 rounded font-mono">supabase/schema.sql</code>, and click <strong>Run</strong>.
                  </li>
                  <li>
                    Navigate to <strong>Project Settings → API</strong> and copy your <strong>Project URL</strong>, <strong>anon/public key</strong>, and <strong>service_role key</strong>.
                  </li>
                  <li>
                    Paste the keys into your <code className="bg-[#F3F4F6] text-[#111827] px-1 py-0.5 rounded font-mono">.env</code> file:
                  </li>
                </ol>

                <div className="mt-3 p-3 bg-[#1E293B] text-[#E2E8F0] rounded-lg font-mono text-[11px] leading-relaxed overflow-x-auto">
                  <p className="text-[#94A3B8]"># .env configuration</p>
                  <p>SUPABASE_URL="https://your-project.supabase.co"</p>
                  <p>SUPABASE_ANON_KEY="eyJhbGciOi..."</p>
                  <p>SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."</p>
                  <p>VITE_SUPABASE_URL="https://your-project.supabase.co"</p>
                  <p>VITE_SUPABASE_ANON_KEY="eyJhbGciOi..."</p>
                  <p>PORT=3001</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-[#E5E7EB] bg-[#F9FAFB] flex justify-end">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 bg-[#4F46E5] text-white rounded-lg text-xs font-semibold hover:bg-[#4338CA]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
