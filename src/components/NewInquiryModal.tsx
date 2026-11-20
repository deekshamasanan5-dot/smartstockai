import React, { useState } from 'react';
import { X, MessageSquare, Plus, Send } from 'lucide-react';
import { Product, InquiryType, InquiryPriority } from '../types/inventory.ts';
import { inventoryApi } from '../services/api.ts';

interface NewInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onInquiryCreated: () => void;
}

export const NewInquiryModal: React.FC<NewInquiryModalProps> = ({
  isOpen,
  onClose,
  products,
  onInquiryCreated,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [inquiryType, setInquiryType] = useState<InquiryType>('stock_check');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [requestedQuantity, setRequestedQuantity] = useState(25);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<InquiryPriority>('high');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !email || !subject || !message) {
      alert('Please fill in customer name, email, subject, and message.');
      return;
    }

    const prod = products.find((p) => p.id === selectedProductId);

    setIsSubmitting(true);
    try {
      await inventoryApi.createCustomerInquiry({
        customer_name: customerName,
        email,
        phone,
        company,
        inquiry_type: inquiryType,
        product_id: selectedProductId || undefined,
        product_name: prod ? prod.name : undefined,
        requested_quantity: requestedQuantity,
        subject,
        message,
        priority,
      });

      onInquiryCreated();
      onClose();
      // Reset form
      setCustomerName('');
      setEmail('');
      setPhone('');
      setCompany('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      alert(`Error creating inquiry: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-2xs">
      <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-[#E5E7EB] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-linear-to-r from-white to-[#F8FAFC]">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111827]">
                Submit Inbound Customer Inquiry
              </h3>
              <p className="text-[11px] text-[#6B7280]">
                Simulate a customer lead, quotation request, or stock availability check
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Ramesh Kulkarni"
                className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#4F46E5]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ramesh@company.in"
                className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#4F46E5]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Company / Organization
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Bharat Telematics Ltd"
                className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#4F46E5]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98450 00000"
                className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#4F46E5]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Inquiry Type
              </label>
              <select
                value={inquiryType}
                onChange={(e) => setInquiryType(e.target.value as InquiryType)}
                className="w-full px-2.5 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#4F46E5] bg-white"
              >
                <option value="stock_check">Stock Check</option>
                <option value="bulk_quote">Bulk Quotation</option>
                <option value="order_tracking">Order Tracking</option>
                <option value="returns">Returns / RMA</option>
                <option value="general">General</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as InquiryPriority)}
                className="w-full px-2.5 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#4F46E5] bg-white"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                Requested Qty
              </label>
              <input
                type="number"
                min={1}
                value={requestedQuantity}
                onChange={(e) => setRequestedQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#4F46E5]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#374151] mb-1">
              Related Product / SKU (Optional)
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                const p = products.find((prod) => prod.id === e.target.value);
                if (p && !subject) {
                  setSubject(`Stock & quotation inquiry for ${p.name}`);
                }
              }}
              className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#4F46E5] bg-white"
            >
              <option value="">-- General / No Specific SKU --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Available: {p.current_stock}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#374151] mb-1">
              Subject *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Urgent quotation for 50x ESP32 modules"
              className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#4F46E5]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#374151] mb-1">
              Customer Message / Requirements *
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter customer message details, delivery location, GST request..."
              className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#4F46E5] leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#D1D5DB] rounded-lg text-[#374151] hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg font-semibold shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Inquiry'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
