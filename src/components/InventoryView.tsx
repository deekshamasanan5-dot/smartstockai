import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  Plus,
  SlidersHorizontal,
  Trash2,
  Edit3,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { Product, StockStatus } from '../types/inventory.ts';

interface InventoryViewProps {
  products: Product[];
  onOpenAddModal: () => void;
  onOpenAdjustModal: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  initialSkuFilter?: string;
}

const formatINR = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val);
};

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  onOpenAddModal,
  onOpenAdjustModal,
  onDeleteProduct,
  initialSkuFilter = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSkuFilter);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['all', ...Array.from(set)];
  }, [products]);

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

  const StatusBadge = ({ status }: { status: StockStatus }) => {
    switch (status) {
      case 'in_stock':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#16A34A]">
            <CheckCircle2 className="w-3 h-3" />
            <span>In Stock</span>
          </span>
        );
      case 'low_stock':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#D97706]">
            <AlertTriangle className="w-3 h-3" />
            <span>Low Stock</span>
          </span>
        );
      case 'out_of_stock':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEE2E2] text-[#DC2626]">
            <XCircle className="w-3 h-3" />
            <span>Out of Stock</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#111827] flex items-center space-x-2">
              <Package className="w-5 h-5 text-[#4F46E5]" />
              <span>Inventory Catalog & Stock Control</span>
            </h2>
            <p className="text-xs text-[#6B7280]">
              Showing {filteredProducts.length} of {products.length} managed items in warehouse
            </p>
          </div>

          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#4F46E5] text-white rounded-lg text-xs font-semibold hover:bg-[#4338CA] transition-colors shadow-xs shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Item</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-[#F3F4F6]">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by SKU, product name, or category..."
              className="w-full pl-9 pr-4 py-2 border border-[#D1D5DB] rounded-lg text-xs sm:text-sm placeholder-[#9CA3AF] focus:outline-none focus:border-[#4F46E5]"
            />
          </div>

          <div className="flex items-center space-x-2">
            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-[#D1D5DB] rounded-lg text-xs bg-white focus:outline-none focus:border-[#4F46E5]"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  Category: {c === 'all' ? 'All Categories' : c}
                </option>
              ))}
            </select>

            {/* Status Dropdown */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-[#D1D5DB] rounded-lg text-xs bg-white focus:outline-none focus:border-[#4F46E5]"
            >
              <option value="all">Status: All</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#6B7280] font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">SKU / Item</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Stock Level</th>
                <th className="py-3 px-4">Unit Pricing (₹)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#9CA3AF] text-xs">
                    No products found matching your search.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F9FAFB] transition-colors">
                    {/* SKU & Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#111827]">{p.name}</div>
                      <div className="text-[11px] text-[#4F46E5] font-mono mt-0.5">{p.sku}</div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 text-[#4B5563]">
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                        {p.category}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 text-[#4B5563] text-xs">
                      {p.location}
                    </td>

                    {/* Current Stock */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#111827] tabular-nums">
                        {p.current_stock} <span className="text-xs font-normal text-gray-500">{p.unit}</span>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        Min: {p.min_reorder_level} | Max: {p.max_stock_level}
                      </div>
                    </td>

                    {/* Pricing */}
                    <td className="py-3.5 px-4 tabular-nums">
                      <div className="font-bold text-[#111827]">{formatINR(p.selling_price)}</div>
                      <div className="text-[10px] text-gray-400">Cost: {formatINR(p.cost_price)}</div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <StatusBadge status={p.status} />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => onOpenAdjustModal(p)}
                        className="px-2.5 py-1 text-xs font-semibold text-[#4F46E5] bg-[#EEF2FF] hover:bg-[#E0E7FF] rounded-md transition-colors"
                      >
                        Adjust
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete ${p.name}?`)) {
                            onDeleteProduct(p.id);
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors inline-block align-middle"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
