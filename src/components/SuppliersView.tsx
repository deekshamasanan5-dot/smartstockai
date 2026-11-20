import React from 'react';
import { Truck, Star, Phone, Mail, MapPin, Clock, Building2, CheckCircle2 } from 'lucide-react';
import { Supplier } from '../types/inventory.ts';

interface SuppliersViewProps {
  suppliers: Supplier[];
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({ suppliers }) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-xs">
        <h2 className="text-base font-bold text-[#111827] flex items-center space-x-2">
          <Truck className="w-5 h-5 text-[#4F46E5]" />
          <span>Procurement Suppliers & Vendor Directory</span>
        </h2>
        <p className="text-xs text-[#6B7280] mt-0.5">
          Audited industrial suppliers with verified lead times and quality ratings
        </p>
      </div>

      {/* Grid of Suppliers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suppliers.map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#C7D2FE] transition-colors"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-[#4F46E5] bg-[#EEF2FF] px-2 py-0.5 rounded">
                      {s.code}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        s.status === 'preferred'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#111827] mt-1.5">{s.name}</h3>
                </div>

                <div className="flex items-center space-x-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-md text-xs font-bold border border-amber-200 shrink-0">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{s.rating.toFixed(2)}</span>
                </div>
              </div>

              {s.notes && (
                <p className="text-xs text-[#4B5563] mt-2 leading-relaxed bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
                  {s.notes}
                </p>
              )}
            </div>

            <div className="space-y-2 border-t border-[#F3F4F6] pt-3 text-xs text-[#6B7280]">
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#4F46E5]" />
                  <span>Procurement Lead Time:</span>
                </span>
                <span className="font-bold text-[#111827]">{s.lead_time_days} business days</span>
              </div>

              {s.contact_person && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                    <span>Contact Person:</span>
                  </span>
                  <span className="font-medium text-[#111827]">{s.contact_person}</span>
                </div>
              )}

              {s.email && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span>Email:</span>
                  </span>
                  <a href={`mailto:${s.email}`} className="text-[#4F46E5] hover:underline font-mono text-[11px]">
                    {s.email}
                  </a>
                </div>
              )}

              {s.phone && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>Phone:</span>
                  </span>
                  <span className="font-mono text-[11px] text-[#111827]">{s.phone}</span>
                </div>
              )}

              {s.city && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>Location:</span>
                  </span>
                  <span className="text-[#111827]">{s.city}, {s.state}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
