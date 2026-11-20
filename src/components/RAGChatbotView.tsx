import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  User,
  Send,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Package,
  Truck,
  ShieldCheck,
  Tag,
  ArrowRight,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import { RAGChatMessage, RAGSourceCitation, Product } from '../types/inventory.ts';
import { inventoryApi } from '../services/api.ts';

interface RAGChatbotViewProps {
  products: Product[];
  onNavigateToProduct?: (sku: string) => void;
  onOpenAdjustModal?: (productId: string) => void;
}

export const RAGChatbotView: React.FC<RAGChatbotViewProps> = ({
  products,
  onNavigateToProduct,
  onOpenAdjustModal,
}) => {
  const [messages, setMessages] = useState<RAGChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content:
        'Hello! I am **SmartStock RAG Assistant**, connected directly to your live warehouse inventory, supplier records, and operational policies.\n\nAsk me anything about product availability, unit pricing (₹ INR), supplier lead times, delivery SLAs, bulk discount tiers, or stockout alerts!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sources: [
        {
          title: 'Warehouse Knowledge Base',
          type: 'policy',
          snippet: 'Connected to live PostgreSQL database & operational handbook.',
          score: 1.0,
        },
      ],
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState<'customer' | 'staff'>('customer');
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const quickPrompts = [
    { label: '📦 Check ESP32 Stock & Price', query: 'Do you have ESP32 Wi-Fi microcontroller in stock, what is the price and how many are available?' },
    { label: '⚠️ What items are out of stock?', query: 'List all items that are currently out of stock or low stock in the warehouse.' },
    { label: '🚚 Shipping SLAs & Delivery Time', query: 'What is our domestic shipping cutoff time and courier delivery lead time to metro cities?' },
    { label: '💰 Bulk Order Discounts', query: 'What are the volume discount tiers for bulk orders?' },
    { label: '⭐ Sahyadri Sensors Lead Time', query: 'What is the lead time, contact person, and rating for Sahyadri Precision Sensors?' },
  ];

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: RAGChatMessage = {
      id: userMsgId,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputQuery('');
    setIsLoading(true);

    try {
      // Build lightweight conversation history
      const history = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await inventoryApi.sendRAGChat({
        query: textToSend.trim(),
        history,
        mode: chatMode,
      });

      const botMsgId = `bot-${Date.now()}`;
      const botMsg: RAGChatMessage = {
        id: botMsgId,
        role: 'assistant',
        content: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: res.sources,
        suggestedActions: res.suggestedActions,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: RAGChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `I encountered an issue querying the knowledge base: ${err.message}. Please try again or check your backend connection.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSources = (msgId: string) => {
    setExpandedSources((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderSourceBadge = (type: string) => {
    switch (type) {
      case 'product':
        return (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Package className="w-2.5 h-2.5" />
            <span>Product</span>
          </span>
        );
      case 'supplier':
        return (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Truck className="w-2.5 h-2.5" />
            <span>Supplier</span>
          </span>
        );
      case 'policy':
        return (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <ShieldCheck className="w-2.5 h-2.5" />
            <span>Policy</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-50 text-gray-700 border border-gray-200">
            <Tag className="w-2.5 h-2.5" />
            <span>Source</span>
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[550px] bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
      {/* Chatbot Top Bar */}
      <div className="px-5 py-3.5 border-b border-[#E5E7EB] bg-linear-to-r from-white via-[#F8FAFC] to-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-linear-to-tr from-[#4F46E5] to-[#7C3AED] flex items-center justify-center text-white shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-[#111827]">
                SmartStock RAG Chatbot
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#DCFCE7] text-[#16A34A] rounded-full flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
                <span>RAG Grounded</span>
              </span>
            </div>
            <p className="text-xs text-[#6B7280]">
              Retrieval-Augmented Generation over live inventory & warehouse policies
            </p>
          </div>
        </div>

        {/* Mode Selector Toggle */}
        <div className="flex items-center bg-[#F1F5F9] p-1 rounded-lg border border-[#E2E8F0]">
          <button
            onClick={() => setChatMode('customer')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              chatMode === 'customer'
                ? 'bg-white text-[#4F46E5] shadow-xs'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            Customer Facing
          </button>
          <button
            onClick={() => setChatMode('staff')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              chatMode === 'staff'
                ? 'bg-white text-[#4F46E5] shadow-xs'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            Staff & Warehouse
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#FAFBFD]">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const hasSources = msg.sources && msg.sources.length > 0;
          const isExpanded = !!expandedSources[msg.id];

          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-semibold shadow-xs ${
                  isUser ? 'bg-[#4B5563]' : 'bg-[#4F46E5]'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble Container */}
              <div className={`max-w-[85%] sm:max-w-[75%] space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
                {/* Bubble */}
                <div
                  className={`rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                    isUser
                      ? 'bg-[#4F46E5] text-white rounded-tr-none'
                      : 'bg-white text-[#1F2937] border border-[#E5E7EB] rounded-tl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>

                {/* Metadata & Actions */}
                <div
                  className={`flex items-center space-x-2 text-[11px] text-[#9CA3AF] px-1 ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {!isUser && (
                    <>
                      <span>•</span>
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="hover:text-[#4F46E5] flex items-center space-x-1 transition-colors"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-medium">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>

                {/* RAG Retrieved Sources Citation Accordion */}
                {!isUser && hasSources && (
                  <div className="mt-2 bg-white rounded-lg border border-[#E5E7EB] p-2.5 shadow-2xs">
                    <button
                      onClick={() => toggleSources(msg.id)}
                      className="w-full flex items-center justify-between text-left text-xs font-medium text-[#4B5563] hover:text-[#111827]"
                    >
                      <div className="flex items-center space-x-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-[#4F46E5]" />
                        <span className="font-semibold text-[#374151]">
                          Retrieved Grounding Sources ({msg.sources!.length})
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-[#6B7280]" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-[#6B7280]" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-2.5 pt-2 border-t border-[#F3F4F6] space-y-2">
                        {msg.sources!.map((s, idx) => (
                          <div
                            key={idx}
                            className="bg-[#F8FAFC] rounded border border-[#E2E8F0] p-2 text-xs"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center space-x-1.5 font-semibold text-[#1E293B]">
                                {renderSourceBadge(s.type)}
                                <span className="truncate max-w-[200px] sm:max-w-xs">{s.title}</span>
                              </div>
                              <span className="text-[10px] text-[#64748B] font-mono">
                                Rel: {Math.round(s.score * 100)}%
                              </span>
                            </div>
                            <p className="text-[11px] text-[#475569] leading-relaxed line-clamp-2">
                              {s.snippet}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Suggested Action Chips */}
                {!isUser && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.suggestedActions.map((act, aIdx) => (
                      <button
                        key={aIdx}
                        onClick={() => {
                          if (act.actionType === 'navigate_inventory' && act.payload?.sku && onNavigateToProduct) {
                            onNavigateToProduct(act.payload.sku);
                          } else if (act.actionType === 'adjust_stock' && act.payload?.productId && onOpenAdjustModal) {
                            onOpenAdjustModal(act.payload.productId);
                          }
                        }}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium bg-[#EEF2FF] text-[#4F46E5] hover:bg-[#E0E7FF] border border-[#C7D2FE] transition-colors shadow-2xs"
                      >
                        <span>{act.label}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#4F46E5] flex items-center justify-center text-white text-xs shadow-xs shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-none border border-[#E5E7EB] px-4 py-3 shadow-2xs flex items-center space-x-2 text-xs text-[#6B7280]">
              <Sparkles className="w-3.5 h-3.5 text-[#4F46E5] animate-pulse" />
              <span>Retrieving inventory facts & formulating response...</span>
              <div className="flex space-x-1 pl-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-4 py-2 border-t border-[#E5E7EB] bg-[#F8FAFC] overflow-x-auto flex items-center space-x-2 shrink-0">
        <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider shrink-0 flex items-center space-x-1">
          <Sparkles className="w-3 h-3 text-[#4F46E5]" />
          <span>Quick Prompts:</span>
        </span>
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(qp.query)}
            disabled={isLoading}
            className="px-2.5 py-1 text-xs font-medium bg-white hover:bg-[#EEF2FF] text-[#374151] hover:text-[#4F46E5] rounded-full border border-[#D1D5DB] hover:border-[#C7D2FE] transition-colors whitespace-nowrap shadow-2xs shrink-0 disabled:opacity-50"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Input Form Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 sm:p-4 border-t border-[#E5E7EB] bg-white flex items-center space-x-3 shrink-0"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={
              chatMode === 'customer'
                ? 'Ask about item availability, ₹ price, shipping lead time, or bulk quotation...'
                : 'Ask about safety stock, warehouse bin locations, supplier ratings, or replenishment...'
            }
            disabled={isLoading}
            className="w-full px-4 py-2.5 text-xs sm:text-sm border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] disabled:bg-gray-50 placeholder-[#9CA3AF]"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !inputQuery.trim()}
          className="px-4 py-2.5 bg-[#4F46E5] text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-[#4338CA] transition-colors shadow-xs flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <span>Send</span>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
