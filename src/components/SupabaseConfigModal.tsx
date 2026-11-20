import React from 'react';
import { Database, X, CheckCircle2, Info, ExternalLink, Key, ShieldCheck, RefreshCw } from 'lucide-react';
import { SupabaseHealthStatus } from '../types/inventory.ts';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  health: SupabaseHealthStatus | null;
  onRefresh: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  health,
  onRefresh,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full border border-[#E5E7EB] overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-[#4F46E5]" />
            <h3 className="font-semibold text-base text-[#111827]">
              Supabase Integration & Configuration
            </h3>
          </div>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#111827]">
            <X className="w-5 h-5" />
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
            <div className="flex items-center justify-between">
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
              <button
                onClick={onRefresh}
                className="p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-white/60 transition-colors"
                title="Test connection"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
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
                In your Supabase dashboard, navigate to <strong>SQL Editor</strong>, open the project file{' '}
                <code className="bg-[#F3F4F6] text-[#111827] px-1 py-0.5 rounded font-mono">
                  supabase/schema.sql
                </code>
                , and click <strong>Run</strong>.
              </li>
              <li>
                Navigate to <strong>Project Settings → API</strong> and copy your{' '}
                <strong>Project URL</strong>, <strong>anon/public key</strong>, and{' '}
                <strong>service_role key</strong>.
              </li>
              <li>
                Paste the keys into your{' '}
                <code className="bg-[#F3F4F6] text-[#111827] px-1 py-0.5 rounded font-mono">.env</code> file:
              </li>
            </ol>

            <div className="mt-3 p-3 bg-[#1E293B] text-[#E2E8F0] rounded-lg font-mono text-[11px] leading-relaxed overflow-x-auto">
              <span className="text-gray-400"># Supabase Configuration</span>
              <br />
              SUPABASE_URL="https://nnzjviinrlyedbyewozd.supabase.co"
              <br />
              SUPABASE_ANON_KEY="sb_publishable_iw_vzm1SyK2dqI5ic9WnYA_fkPKjyvw"
              <br />
              SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            </div>
          </div>

          {/* Architecture info */}
          <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg p-3 space-y-1">
            <h5 className="font-semibold text-xs text-[#111827] flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
              <span>Built-in Graceful Offline Degradation</span>
            </h5>
            <p className="text-[11px] text-[#6B7280] leading-relaxed">
              If Supabase credentials are not yet configured or the database is paused, SmartStock automatically falls back to memory-synced state without downtime.
            </p>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-[#E5E7EB] bg-[#F9FAFB] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#4F46E5] text-white rounded-lg text-xs font-semibold hover:bg-[#4338CA] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
