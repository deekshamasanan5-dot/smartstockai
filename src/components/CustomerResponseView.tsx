import React, { useState } from 'react';
import {
  MessageSquare,
  Search,
  Sparkles,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Mail,
  Phone,
  Package,
  Copy,
  Check,
  ChevronRight,
  Filter,
  User,
  Plus,
} from 'lucide-react';
import { CustomerInquiry, InquiryStatus, Product } from '../types/inventory.ts';
import { inventoryApi } from '../services/api.ts';

interface CustomerResponseViewProps {
  inquiries: CustomerInquiry[];
  products: Product[];
  onRefresh: () => void;
  onOpenNewInquiry: () => void;
}

export const CustomerResponseView: React.FC<CustomerResponseViewProps> = ({
  inquiries,
  products,
  onRefresh,
  onOpenNewInquiry,
}) => {
  const [selectedInquiryId, setSelectedInquiryId] = useState<string>(
    inquiries.length > 0 ? inquiries[0].id : ''
  );
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTone, setSelectedTone] = useState<'formal' | 'friendly' | 'urgent'>('formal');
  const [draftResponse, setDraftResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Find currently selected inquiry
  const selectedInquiry =
    inquiries.find((i) => i.id === selectedInquiryId) || inquiries[0] || null;

  // Find associated product in inventory
  const associatedProduct = selectedInquiry
    ? products.find(
        (p) =>
          p.id === selectedInquiry.product_id ||
          (selectedInquiry.product_name &&
            p.name.toLowerCase().includes(selectedInquiry.product_name.toLowerCase()))
      )
    : null;

  // Filtered inquiries list
  const filteredInquiries = inquiries.filter((inq) => {
    const matchesStatus = statusFilter === 'all' || inq.status === statusFilter;
    const matchesSearch =
      searchQuery === '' ||
      inq.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inq.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inq.company && inq.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inq.product_name && inq.product_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Sync draft response when selecting an inquiry
  React.useEffect(() => {
    if (selectedInquiry) {
      setDraftResponse(selectedInquiry.final_response || selectedInquiry.ai_draft_response || '');
    }
  }, [selectedInquiryId, selectedInquiry?.ai_draft_response, selectedInquiry?.final_response]);

  const handleGenerateAIResponse = async () => {
    if (!selectedInquiry) return;
    setIsGenerating(true);
    try {
      const res = await inventoryApi.generateAICustomerResponse(selectedInquiry.id, selectedTone);
      setDraftResponse(res.suggestedResponse);
      onRefresh();
    } catch (err: any) {
      alert(`AI generation error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendResponse = async () => {
    if (!selectedInquiry || !draftResponse.trim()) return;
    setIsSubmitting(true);
    try {
      await inventoryApi.sendCustomerResponse(selectedInquiry.id, draftResponse.trim());
      alert('Response successfully sent to customer and inquiry marked as Replied!');
      onRefresh();
    } catch (err: any) {
      alert(`Error sending response: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (status: InquiryStatus) => {
    if (!selectedInquiry) return;
    try {
      await inventoryApi.updateInquiryStatus(selectedInquiry.id, status);
      onRefresh();
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(draftResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded-full">URGENT</span>;
      case 'high':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full">HIGH</span>;
      case 'medium':
        return <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700 rounded-full">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-700 rounded-full">LOW</span>;
    }
  };

  const getStatusBadge = (status: InquiryStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-2.5 h-2.5" />
            <span>Pending</span>
          </span>
        );
      case 'drafted':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Sparkles className="w-2.5 h-2.5" />
            <span>AI Drafted</span>
          </span>
        );
      case 'replied':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Send className="w-2.5 h-2.5" />
            <span>Replied</span>
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>Resolved</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner / Actions Bar */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#111827] flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-[#4F46E5]" />
            <span>Customer Inquiries & Grounded AI Response Hub</span>
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Real-time customer messages with instant stock availability verification and grounded RAG responses
          </p>
        </div>

        <button
          onClick={onOpenNewInquiry}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#4F46E5] text-white rounded-lg text-xs font-semibold hover:bg-[#4338CA] transition-colors shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Simulate New Inquiry</span>
        </button>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left List Pane (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col h-[700px] overflow-hidden">
          {/* Filters & Search */}
          <div className="p-3.5 border-b border-[#E5E7EB] space-y-2.5 bg-[#FAFBFD]">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search inquiries, customer, SKU..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#4F46E5] bg-white placeholder-[#9CA3AF]"
              />
            </div>

            {/* Status Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5">
              {['all', 'pending', 'replied', 'resolved'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap ${
                    statusFilter === st
                      ? 'bg-[#4F46E5] text-white'
                      : 'bg-white text-[#6B7280] border border-[#E5E7EB] hover:bg-gray-50'
                  }`}
                >
                  {st === 'all' ? 'All Inquiries' : st.charAt(0).toUpperCase() + st.slice(1)}
                  {st === 'pending' && (
                    <span className="ml-1 px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">
                      {inquiries.filter((i) => i.status === 'pending').length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Inquiries Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#F3F4F6]">
            {filteredInquiries.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#9CA3AF]">
                No customer inquiries matching this filter.
              </div>
            ) : (
              filteredInquiries.map((inq) => {
                const isSelected = selectedInquiry?.id === inq.id;
                return (
                  <button
                    key={inq.id}
                    onClick={() => setSelectedInquiryId(inq.id)}
                    className={`w-full text-left p-3.5 transition-colors flex flex-col space-y-1.5 ${
                      isSelected ? 'bg-[#EEF2FF] border-l-4 border-l-[#4F46E5]' : 'hover:bg-[#F9FAFB]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#111827] truncate max-w-[180px]">
                        {inq.customer_name}
                      </span>
                      <div className="flex items-center space-x-1.5">
                        {getPriorityBadge(inq.priority)}
                        {getStatusBadge(inq.status)}
                      </div>
                    </div>

                    <div className="text-xs font-semibold text-[#374151] line-clamp-1">
                      {inq.subject}
                    </div>

                    <div className="text-[11px] text-[#6B7280] line-clamp-1">
                      {inq.company || inq.email}
                    </div>

                    {inq.product_name && (
                      <div className="flex items-center space-x-1 text-[11px] text-[#4F46E5] font-medium pt-0.5">
                        <Package className="w-3 h-3" />
                        <span className="truncate">{inq.product_name}</span>
                        {inq.requested_quantity && (
                          <span className="text-[#6B7280]">({inq.requested_quantity} units)</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Detail & AI Response Pane (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col h-[700px] overflow-hidden">
          {selectedInquiry ? (
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Inquiry Header */}
              <div className="border-b border-[#E5E7EB] pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-[#111827]">
                      {selectedInquiry.subject}
                    </h3>
                    {getPriorityBadge(selectedInquiry.priority)}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6B7280] mt-1.5">
                    <span className="flex items-center space-x-1 font-medium text-[#111827]">
                      <User className="w-3.5 h-3.5 text-[#4F46E5]" />
                      <span>{selectedInquiry.customer_name}</span>
                    </span>
                    {selectedInquiry.company && (
                      <span className="flex items-center space-x-1">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{selectedInquiry.company}</span>
                      </span>
                    )}
                    <span className="flex items-center space-x-1">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{selectedInquiry.email}</span>
                    </span>
                    {selectedInquiry.phone && (
                      <span className="flex items-center space-x-1">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{selectedInquiry.phone}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {getStatusBadge(selectedInquiry.status)}
                  {selectedInquiry.status !== 'resolved' ? (
                    <button
                      onClick={() => handleUpdateStatus('resolved')}
                      className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors"
                    >
                      Mark Resolved
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus('pending')}
                      className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-200 transition-colors"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </div>

              {/* Customer's Inbound Message Box */}
              <div className="bg-[#FAFBFD] border border-[#E2E8F0] rounded-xl p-4 space-y-1.5">
                <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  Customer Inbound Request:
                </div>
                <p className="text-xs sm:text-sm text-[#1E293B] leading-relaxed whitespace-pre-wrap">
                  {selectedInquiry.message}
                </p>
                <div className="text-[10px] text-[#94A3B8] pt-1">
                  Received on {new Date(selectedInquiry.created_at).toLocaleString()}
                </div>
              </div>

              {/* Real-time Inventory Grounding Card */}
              <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                    <Package className="w-4 h-4 text-[#4F46E5]" />
                    <span>Real-time Warehouse Stock Grounding</span>
                  </div>
                  <span className="text-[10px] text-[#64748B]">Live Catalog Sync</span>
                </div>

                {associatedProduct ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-[#E2E8F0] text-xs">
                    <div>
                      <span className="text-[10px] text-[#64748B] block">Product / SKU</span>
                      <span className="font-semibold text-[#1E293B] block truncate">
                        {associatedProduct.name}
                      </span>
                      <span className="text-[10px] text-[#4F46E5] font-mono">
                        {associatedProduct.sku}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#64748B] block">Available Units</span>
                      <span className="font-bold text-sm text-[#1E293B]">
                        {associatedProduct.current_stock} {associatedProduct.unit}
                      </span>
                      <span className="text-[10px] text-emerald-600 block">
                        {associatedProduct.current_stock >= (selectedInquiry.requested_quantity || 1)
                          ? '✅ Sufficient Stock'
                          : '⚠️ Shortage for order'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#64748B] block">Unit Price (₹)</span>
                      <span className="font-bold text-sm text-[#1E293B]">
                        ₹{associatedProduct.selling_price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-[#64748B] block">+18% GST</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#64748B] block">Warehouse Bin</span>
                      <span className="font-medium text-[#1E293B] block truncate">
                        {associatedProduct.location}
                      </span>
                      <span className="text-[10px] text-[#4F46E5] block">24h Dispatch</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#64748B]">
                    No direct catalog link found for "{selectedInquiry.product_name || selectedInquiry.subject}". AI will search general policies and related modules.
                  </p>
                )}
              </div>

              {/* AI Grounded Response Drafting Section */}
              <div className="space-y-3 pt-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-[#4F46E5]" />
                    <span className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                      Grounded AI Customer Response
                    </span>
                  </div>

                  {/* Tone selector */}
                  <div className="flex items-center space-x-1 bg-[#F1F5F9] p-0.5 rounded-lg border border-[#E2E8F0] text-xs">
                    {(['formal', 'friendly', 'urgent'] as const).map((tone) => (
                      <button
                        key={tone}
                        onClick={() => setSelectedTone(tone)}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize transition-colors ${
                          selectedTone === tone
                            ? 'bg-white text-[#4F46E5] font-semibold shadow-2xs'
                            : 'text-[#64748B] hover:text-[#1E293B]'
                        }`}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    rows={7}
                    value={draftResponse}
                    onChange={(e) => setDraftResponse(e.target.value)}
                    placeholder="Click 'Generate AI Response' or write a custom grounded email reply..."
                    className="w-full p-3 text-xs sm:text-sm font-sans border border-[#D1D5DB] rounded-xl focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] leading-relaxed placeholder-[#9CA3AF]"
                  />
                  {draftResponse && (
                    <button
                      onClick={handleCopy}
                      className="absolute right-3 top-3 p-1.5 bg-white/90 hover:bg-white rounded-md border border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] shadow-2xs"
                      title="Copy response"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                {/* Bottom Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <button
                    onClick={handleGenerateAIResponse}
                    disabled={isGenerating}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4F46E5] border border-[#C7D2FE] rounded-lg text-xs font-semibold transition-colors shadow-2xs disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                    <span>{isGenerating ? 'Generating Grounded Reply...' : '✨ Generate AI Response'}</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSendResponse}
                      disabled={isSubmitting || !draftResponse.trim()}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg text-xs font-semibold transition-colors shadow-xs disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? 'Sending...' : 'Send Customer Response'}</span>
                    </button>
                  </div>
                </div>

                {selectedInquiry.responded_at && (
                  <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Customer response dispatched on {new Date(selectedInquiry.responded_at).toLocaleString()}.
                    </span>
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#9CA3AF]">
              <MessageSquare className="w-12 h-12 text-[#CBD5E1] mb-2" />
              <p className="text-sm font-semibold text-[#64748B]">No inquiry selected</p>
              <p className="text-xs text-[#94A3B8] mt-1">Select an inquiry from the left to view details and generate a response.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
