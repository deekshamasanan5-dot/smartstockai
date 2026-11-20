import React, { useState } from 'react';
import { History, Search, ArrowDownRight, ArrowUpRight, Filter } from 'lucide-react';
import { StockMovement, MovementType } from '../types/inventory.ts';

interface AuditLedgerViewProps {
  movements: StockMovement[];
}

export const AuditLedgerView: React.FC<AuditLedgerViewProps> = ({ movements }) => {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = movements.filter((m) => {
    const matchesType = typeFilter === 'all' || m.movement_type === typeFilter;
    const matchesSearch =
      search === '' ||
      (m.product?.name && m.product.name.toLowerCase().includes(search.toLowerCase())) ||
      (m.product?.sku && m.product.sku.toLowerCase().includes(search.toLowerCase())) ||
      (m.reference_number && m.reference_number.toLowerCase().includes(search.toLowerCase())) ||
      (m.reason && m.reason.toLowerCase().includes(search.toLowerCase())) ||
      m.performed_by.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getMovementBadge = (type: MovementType) => {
    switch (type) {
      case 'in':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <ArrowUpRight className="w-3 h-3" />
            <span>IN / Restock</span>
          </span>
        );
      case 'out':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            <ArrowDownRight className="w-3 h-3" />
            <span>OUT / Dispense</span>
          </span>
        );
      case 'adjustment':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <span>Adjustment</span>
          </span>
        );
      case 'return':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <span>Return</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
            <span>{type}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#111827] flex items-center space-x-2">
            <History className="w-5 h-5 text-[#4F46E5]" />
            <span>Immutable Warehouse Audit Ledger</span>
          </h2>
          <p className="text-xs text-[#6B7280]">
            Complete chronological trail of all intake, checkout, and inventory rebalance operations
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail..."
            className="px-3 py-1.5 text-xs border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#4F46E5]"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-[#D1D5DB] rounded-lg bg-white focus:outline-none focus:border-[#4F46E5]"
          >
            <option value="all">All Types</option>
            <option value="in">IN (Restock)</option>
            <option value="out">OUT (Dispense)</option>
            <option value="adjustment">Adjustment</option>
            <option value="return">Return</option>
          </select>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#6B7280] font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Item / SKU</th>
                <th className="py-3 px-4">Operation</th>
                <th className="py-3 px-4">Quantity Change</th>
                <th className="py-3 px-4">Balance (Prev → New)</th>
                <th className="py-3 px-4">Reference / Reason</th>
                <th className="py-3 px-4">Logged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[#9CA3AF]">
                    No audit records match the current filter.
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-3 px-4 text-[#6B7280] whitespace-nowrap text-xs">
                      {new Date(m.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#111827]">{m.product?.name || m.product_id}</div>
                      {m.product?.sku && (
                        <div className="text-[10px] text-[#4F46E5] font-mono">{m.product.sku}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {getMovementBadge(m.movement_type)}
                    </td>
                    <td className="py-3 px-4 font-bold tabular-nums">
                      <span className={m.quantity > 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}>
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity} units
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#374151] tabular-nums font-mono text-xs">
                      {m.previous_stock} → <span className="font-bold">{m.new_stock}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#111827] text-xs">
                        {m.reference_number || 'N/A'}
                      </div>
                      <div className="text-[11px] text-[#6B7280] line-clamp-1">
                        {m.reason || 'Manual ledger entry'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#4B5563] text-xs">
                      {m.performed_by}
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
