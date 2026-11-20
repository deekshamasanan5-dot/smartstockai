import React, { useState, useEffect } from 'react';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  Plus,
  X,
  RefreshCw,
  SlidersHorizontal,
  Bot,
  MessageSquare,
} from 'lucide-react';
import { inventoryApi } from './services/api.ts';
import {
  Product,
  StockMovement,
  ReorderAlert,
  DashboardStats,
  SupabaseHealthStatus,
  Supplier,
  MovementType,
  CustomerInquiry,
} from './types/inventory.ts';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar, NavTab } from './components/Sidebar.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { InventoryView } from './components/InventoryView.tsx';
import { CustomerResponseView } from './components/CustomerResponseView.tsx';
import { RAGChatbotView } from './components/RAGChatbotView.tsx';
import { SuppliersView } from './components/SuppliersView.tsx';
import { AuditLedgerView } from './components/AuditLedgerView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { SupabaseConfigModal } from './components/SupabaseConfigModal.tsx';
import { NewInquiryModal } from './components/NewInquiryModal.tsx';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Entities Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [alerts, setAlerts] = useState<ReorderAlert[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inquiries, setInquiries] = useState<CustomerInquiry[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [health, setHealth] = useState<SupabaseHealthStatus | null>(null);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showNewInquiryModal, setShowNewInquiryModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [adjustModalProduct, setAdjustModalProduct] = useState<Product | null>(null);
  const [initialSkuForInventory, setInitialSkuForInventory] = useState('');

  // Stock Adjustment Form
  const [adjustType, setAdjustType] = useState<MovementType>('in');
  const [adjustQty, setAdjustQty] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  // Add Product Form
  const [newProduct, setNewProduct] = useState({
    sku: '',
    name: '',
    category: 'Microcontrollers',
    unit: 'Units',
    cost_price: 150,
    selling_price: 260,
    current_stock: 30,
    min_reorder_level: 15,
    max_stock_level: 120,
    reorder_quantity: 40,
    location: 'Warehouse A - Bay 02',
    supplier_id: '',
  });

  // Load All System Entities
  const loadAllData = async () => {
    setIsRefreshing(true);
    try {
      // 1. Health check
      try {
        const healthRes = await inventoryApi.getHealth();
        setHealth(healthRes.supabase);
      } catch {
        setHealth({
          isConfigured: false,
          isConnected: false,
          mode: 'fallback_mock',
          message: 'Operating via reliable local fallback mock store.',
        });
      }

      // 2. Fetch parallel entities
      const [prodsData, alertsData, statsData, supsData, movsData, inqsData] =
        await Promise.allSettled([
          inventoryApi.getProducts(),
          inventoryApi.getAlerts('active'),
          inventoryApi.getDashboardStats(),
          inventoryApi.getSuppliers(),
          inventoryApi.getMovements(),
          inventoryApi.getCustomerInquiries(),
        ]);

      if (prodsData.status === 'fulfilled') setProducts(prodsData.value);
      if (alertsData.status === 'fulfilled') setAlerts(alertsData.value);
      if (statsData.status === 'fulfilled') setStats(statsData.value);
      if (supsData.status === 'fulfilled') setSuppliers(supsData.value);
      if (movsData.status === 'fulfilled') setMovements(movsData.value);
      if (inqsData.status === 'fulfilled') setInquiries(inqsData.value);
    } catch (err) {
      console.error('Error fetching system data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Stock Adjustment Submit
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

  // Add Product Submit
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
        cost_price: 150,
        selling_price: 260,
        current_stock: 30,
        min_reorder_level: 15,
        max_stock_level: 120,
        reorder_quantity: 40,
        location: 'Warehouse A - Bay 02',
        supplier_id: '',
      });
      await loadAllData();
    } catch (err: any) {
      alert(`Error creating product: ${err.message}`);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string) => {
    try {
      await inventoryApi.deleteProduct(id);
      await loadAllData();
    } catch (err: any) {
      alert(`Error deleting product: ${err.message}`);
    }
  };

  const pendingInquiriesCount = inquiries.filter((i) => i.status === 'pending').length;
  const criticalAlertsCount = alerts.filter((a) => a.severity === 'critical').length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] flex flex-col font-sans antialiased">
      {/* Top Navigation Bar */}
      <Navbar
        health={health}
        isRefreshing={isRefreshing}
        onRefresh={loadAllData}
        onOpenConfig={() => setShowConfigModal(true)}
        onOpenAddProduct={() => setShowAddProductModal(true)}
        onOpenNewInquiry={() => setShowNewInquiryModal(true)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      {/* Main Layout: Sidebar + Viewport */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          pendingInquiriesCount={pendingInquiriesCount}
          criticalAlertsCount={criticalAlertsCount}
          totalSKUs={products.length}
        />

        {/* Dynamic View Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              alerts={alerts}
              movements={movements}
              products={products}
              inquiries={inquiries}
              health={health}
              onNavigate={setActiveTab}
              onOpenConfig={() => setShowConfigModal(true)}
              onOpenAddProduct={() => setShowAddProductModal(true)}
              onSelectProductForAdjust={(prod, qty, reason) => {
                setAdjustModalProduct(prod);
                setAdjustType('in');
                setAdjustQty(qty);
                setAdjustReason(reason);
              }}
            />
          )}

          {activeTab === 'chatbot' && (
            <RAGChatbotView
              products={products}
              onNavigateToProduct={(sku) => {
                setInitialSkuForInventory(sku);
                setActiveTab('inventory');
              }}
              onOpenAdjustModal={(productId) => {
                const prod = products.find((p) => p.id === productId);
                if (prod) {
                  setAdjustModalProduct(prod);
                  setAdjustType('in');
                  setAdjustQty(25);
                }
              }}
            />
          )}

          {activeTab === 'customers' && (
            <CustomerResponseView
              inquiries={inquiries}
              products={products}
              onRefresh={loadAllData}
              onOpenNewInquiry={() => setShowNewInquiryModal(true)}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              products={products}
              initialSkuFilter={initialSkuForInventory}
              onOpenAddModal={() => setShowAddProductModal(true)}
              onOpenAdjustModal={(prod) => {
                setAdjustModalProduct(prod);
                setAdjustType('in');
                setAdjustQty(10);
              }}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {activeTab === 'suppliers' && <SuppliersView suppliers={suppliers} />}

          {activeTab === 'audit' && <AuditLedgerView movements={movements} />}

          {activeTab === 'settings' && (
            <SettingsView
              health={health}
              onRefreshHealth={loadAllData}
              onOpenConfigModal={() => setShowConfigModal(true)}
              totalProducts={products.length}
              totalSuppliers={suppliers.length}
              totalInquiries={inquiries.length}
            />
          )}
        </main>
      </div>

      {/* Stock Adjustment Modal */}
      {adjustModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-[#E5E7EB] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-linear-to-r from-white to-[#F8FAFC]">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4 text-[#4F46E5]" />
                <h3 className="font-semibold text-sm text-[#111827]">
                  Stock Adjustment: {adjustModalProduct.sku}
                </h3>
              </div>
              <button onClick={() => setAdjustModalProduct(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStockAdjustSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <span className="font-bold text-sm text-[#111827] block">{adjustModalProduct.name}</span>
                <span className="text-[11px] text-[#6B7280]">
                  Current Stock: <strong className="text-[#111827]">{adjustModalProduct.current_stock}</strong> {adjustModalProduct.unit}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Adjustment Type</label>
                  <select
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value as MovementType)}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg bg-white focus:outline-none focus:border-[#4F46E5]"
                  >
                    <option value="in">IN (Restock / Intake)</option>
                    <option value="out">OUT (Dispense / Sale)</option>
                    <option value="adjustment">Rebalance / Correction</option>
                    <option value="return">Return to Stock</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">Reason / Reference</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Received PO-102, or Client Dispatch"
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#4F46E5]"
                />
              </div>

              <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalProduct(null)}
                  className="px-3 py-1.5 border border-[#D1D5DB] rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustSubmitting}
                  className="px-4 py-1.5 bg-[#4F46E5] text-white rounded-lg font-semibold hover:bg-[#4338CA] shadow-xs disabled:opacity-50"
                >
                  {adjustSubmitting ? 'Saving...' : 'Apply Stock Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-[#E5E7EB] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-[#4F46E5]" />
                <h3 className="font-semibold text-sm text-[#111827]">Add New Inventory Item</h3>
              </div>
              <button onClick={() => setShowAddProductModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    placeholder="e.g. SKU-MCU-01"
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="e.g. Raspberry Pi Pico W"
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#4F46E5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={newProduct.cost_price}
                    onChange={(e) => setNewProduct({ ...newProduct, cost_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={newProduct.selling_price}
                    onChange={(e) => setNewProduct({ ...newProduct, selling_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Initial Stock</label>
                  <input
                    type="number"
                    min={0}
                    value={newProduct.current_stock}
                    onChange={(e) => setNewProduct({ ...newProduct, current_stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Min Reorder Level</label>
                  <input
                    type="number"
                    min={1}
                    value={newProduct.min_reorder_level}
                    onChange={(e) => setNewProduct({ ...newProduct, min_reorder_level: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">Warehouse Location</label>
                <input
                  type="text"
                  value={newProduct.location}
                  onChange={(e) => setNewProduct({ ...newProduct, location: e.target.value })}
                  placeholder="e.g. Warehouse A - Bay 04"
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#4F46E5]"
                />
              </div>

              <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-3 py-1.5 border border-[#D1D5DB] rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#4F46E5] text-white rounded-lg font-semibold hover:bg-[#4338CA] shadow-xs"
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Inquiry Modal */}
      <NewInquiryModal
        isOpen={showNewInquiryModal}
        onClose={() => setShowNewInquiryModal(false)}
        products={products}
        onInquiryCreated={loadAllData}
      />

      {/* Supabase Integration Modal */}
      <SupabaseConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        health={health}
        onRefresh={loadAllData}
      />
    </div>
  );
}
