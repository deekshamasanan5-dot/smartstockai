import React from 'react';
import {
  LayoutDashboard,
  Package,
  MessageSquare,
  Truck,
  History,
  Settings,
  X,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'inventory' | 'chatbot' | 'customers' | 'suppliers' | 'audit' | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  pendingInquiriesCount: number;
  criticalAlertsCount: number;
  totalSKUs: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  pendingInquiriesCount,
  criticalAlertsCount,
  totalSKUs,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'chatbot' as NavTab,
      label: 'RAG AI Chatbot',
      icon: Sparkles,
      badge: 'RAG',
      badgeColor: 'bg-indigo-100 text-[#4F46E5] font-bold',
    },
    {
      id: 'customers' as NavTab,
      label: 'Customer Response',
      icon: MessageSquare,
      badge: pendingInquiriesCount > 0 ? `${pendingInquiriesCount} new` : null,
      badgeColor: 'bg-amber-100 text-amber-800 font-semibold',
    },
    {
      id: 'inventory' as NavTab,
      label: 'Inventory',
      icon: Package,
      badge: totalSKUs > 0 ? `${totalSKUs}` : null,
      badgeColor: 'bg-gray-100 text-gray-700',
    },
    {
      id: 'suppliers' as NavTab,
      label: 'Suppliers',
      icon: Truck,
      badge: null,
    },
    {
      id: 'audit' as NavTab,
      label: 'Audit Ledger',
      icon: History,
      badge: null,
    },
    {
      id: 'settings' as NavTab,
      label: 'Supabase & Settings',
      icon: Settings,
      badge: criticalAlertsCount > 0 ? `${criticalAlertsCount} alerts` : null,
      badgeColor: 'bg-red-100 text-red-700 font-semibold',
    },
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-[57px] left-0 z-50 lg:z-10 h-screen lg:h-[calc(100vh-57px)] w-64 bg-white border-r border-[#E5E7EB] flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header inside sidebar (on mobile) */}
        <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between lg:hidden">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white font-bold">
              <Package className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-[#111827]">SmartStock AI</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="px-3 py-4 space-y-1 overflow-y-auto flex-1">
          <div className="px-3 pb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Main Operations
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#EEF2FF] text-[#4F46E5] font-semibold shadow-2xs'
                    : 'text-[#4B5563] hover:bg-[#F9FAFB] hover:text-[#111827]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 ${isActive ? 'text-[#4F46E5]' : 'text-gray-400'}`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 text-[10px] rounded-full ${
                      item.badgeColor || 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* AI Inventory Assistant Card in Sidebar */}
        <div className="p-4 border-t border-[#E5E7EB] bg-linear-to-b from-white to-[#F8FAFC]">
          <div className="bg-[#F5F3FF] border border-[#DDD6FE] rounded-lg p-3">
            <div className="flex items-center space-x-2 text-[#6D28D9]">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Smart Assistant</span>
            </div>
            <p className="text-[11px] text-[#5B21B6] mt-1 leading-snug">
              AI restock engine & customer response generator active.
            </p>
            <div className="mt-2.5 pt-2 border-t border-[#DDD6FE]/60 flex items-center justify-between text-[11px] text-[#6D28D9]">
              <span className="font-medium">Accuracy</span>
              <span className="font-bold">98.4%</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
