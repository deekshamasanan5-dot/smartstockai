import React from 'react';
import {
  Settings,
  Database,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Bot,
  Key,
  Layers,
  Sparkles,
} from 'lucide-react';
import { SupabaseHealthStatus } from '../types/inventory.ts';

interface SettingsViewProps {
  health: SupabaseHealthStatus | null;
  onRefreshHealth: () => void;
  onOpenConfigModal: () => void;
  totalProducts: number;
  totalSuppliers: number;
  totalInquiries: number;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  health,
  onRefreshHealth,
  onOpenConfigModal,
  totalProducts,
  totalSuppliers,
  totalInquiries,
}) => {
  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-xs">
        <h2 className="text-base font-bold text-[#111827] flex items-center space-x-2">
          <Settings className="w-5 h-5 text-[#4F46E5]" />
          <span>System Settings & Database Architecture</span>
        </h2>
        <p className="text-xs text-[#6B7280] mt-0.5">
          Manage Supabase PostgreSQL connectivity, Gemini RAG engine parameters, and operational data stores
        </p>
      </div>

      {/* Supabase Status Card */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-[#EEF2FF] rounded-lg text-[#4F46E5]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111827]">
                Supabase PostgreSQL Backend
              </h3>
              <p className="text-xs text-[#6B7280]">
                Primary data persistence layer with RLS security policies
              </p>
            </div>
          </div>

          <button
            onClick={onRefreshHealth}
            className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-gray-50 text-gray-600 transition-colors"
            title="Re-test Supabase connection"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Live Status Pill & Stats */}
        <div
          className={`p-4 rounded-xl border ${
            health?.isConnected
              ? 'bg-[#DCFCE7]/60 border-[#BBF7D0]'
              : 'bg-[#EEF2FF] border-[#C7D2FE]'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                health?.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-[#4F46E5]'
              }`}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-[#111827]">
              {health?.isConnected ? 'Live PostgreSQL Connected' : 'High-Fidelity Mock Mode Active'}
            </span>
          </div>

          <p className="text-xs text-[#4B5563] mt-1.5 leading-relaxed">
            {health?.message || 'Database status verified.'}
          </p>

          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-black/5 text-xs">
            <div>
              <span className="text-[10px] text-gray-500 block">Catalog Products</span>
              <span className="font-bold text-[#111827]">{totalProducts} SKUs</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 block">Suppliers</span>
              <span className="font-bold text-[#111827]">{totalSuppliers} Vendors</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 block">Customer Inquiries</span>
              <span className="font-bold text-[#111827]">{totalInquiries} Messages</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 block">Failover Protection</span>
              <span className="font-bold text-emerald-600">Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            onClick={onOpenConfigModal}
            className="px-3.5 py-2 bg-[#4F46E5] text-white rounded-lg text-xs font-semibold hover:bg-[#4338CA] transition-colors shadow-xs"
          >
            Open Supabase Connection Setup Guide
          </button>
        </div>
      </div>

      {/* RAG & AI Configuration Card */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs space-y-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#111827]">
              Retrieval-Augmented Generation (RAG) Engine
            </h3>
            <p className="text-xs text-[#6B7280]">
              Dual-layer intelligence: Google GenAI + Deterministic Grounding Fallback
            </p>
          </div>
        </div>

        <div className="bg-[#FAFBFD] p-3.5 rounded-lg border border-[#E2E8F0] space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Active LLM Model:</span>
            <span className="font-mono font-semibold text-[#4F46E5]">gemini-2.5-flash / Grounded Engine</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Grounding Corpus:</span>
            <span className="font-semibold text-gray-900">Live Inventory DB + Warehouse Policies + SLAs</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Fact Attribution:</span>
            <span className="text-emerald-700 font-semibold flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Full Citation Scoring Enabled</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
