import React from 'react';
import {
  Package,
  Database,
  RefreshCw,
  Plus,
  MessageSquarePlus,
  Menu,
} from 'lucide-react';
import { SupabaseHealthStatus } from '../types/inventory.ts';

interface NavbarProps {
  health: SupabaseHealthStatus | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenConfig: () => void;
  onOpenAddProduct: () => void;
  onOpenNewInquiry: () => void;
  onToggleMobileSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  health,
  isRefreshing,
  onRefresh,
  onOpenConfig,
  onOpenAddProduct,
  onOpenNewInquiry,
  onToggleMobileSidebar,
}) => {
  return (
    <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
      <div className="flex items-center space-x-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-lg transition-colors border border-[#E5E7EB]"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand identity on mobile/header */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white font-bold shadow-xs">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-[#111827]">
              SmartStock<span className="text-[#4F46E5]">AI</span>
            </span>
            <span className="ml-2 text-xs text-[#6B7280] font-medium hidden sm:inline-block">
              Precision Operations
            </span>
          </div>
        </div>

        <div className="h-5 w-px bg-[#E5E7EB] hidden md:block" />

        {/* Supabase Status Pill */}
        <button
          onClick={onOpenConfig}
          className={`hidden sm:inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer border transition-colors ${
            health?.isConnected
              ? 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0] hover:bg-[#BBF7D0]'
              : 'bg-[#EEF2FF] text-[#4F46E5] border-[#C7D2FE] hover:bg-[#E0E7FF]'
          }`}
          title="Click to view Supabase Connection & Configuration Details"
        >
          <Database className="w-3.5 h-3.5" />
          <span>
            {health?.isConnected ? 'Supabase: Connected' : 'Supabase: Mock Mode'}
          </span>
          <span
            className={`w-2 h-2 rounded-full ${
              health?.isConnected ? 'bg-[#16A34A] animate-pulse' : 'bg-[#4F46E5]'
            }`}
          />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-lg transition-colors border border-[#E5E7EB]"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#4F46E5]' : ''}`} />
        </button>

        <button
          onClick={onOpenNewInquiry}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-[#C7D2FE] bg-[#EEF2FF] text-[#4F46E5] rounded-lg text-xs font-semibold hover:bg-[#E0E7FF] transition-colors shadow-xs"
          title="Submit new customer inquiry"
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
          <span className="hidden md:inline">New Inquiry</span>
        </button>

        <button
          onClick={onOpenAddProduct}
          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#4F46E5] text-white rounded-lg text-xs font-semibold hover:bg-[#4338CA] transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Item</span>
        </button>
      </div>
    </header>
  );
};
