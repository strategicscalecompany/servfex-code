import React, { useState } from 'react';
import {
  Inbox,
  Search,
  Plus,
  Send,
  MessageSquare,
  AlertCircle,
  Clock,
  CheckCircle2,
  User,
  ShieldAlert,
  Headphones,
  RefreshCw,
  Phone,
  Mail,
  ChevronRight,
  Sparkles,
  Tag,
  Paperclip,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';

interface TicketMessage {
  id: string;
  sender: 'Customer' | 'Vendor' | 'Super Admin Support';
  senderName: string;
  message: string;
  timestamp: string;
  isInternalNote?: boolean;
}

interface SupportTicket {
  id: string;
  ticketNumber: string;
  requesterName: string;
  requesterRole: 'CUSTOMER' | 'VENDOR';
  requesterPhone: string;
  requesterEmail: string;
  subject: string;
  category: 'Booking & Dispatch' | 'Payment & Refund' | 'Technician Behavior' | 'App Glitch' | 'Partner Onboarding';
  priority: 'Urgent' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved';
  bookingId?: string;
  assignedAgent: string;
  createdAt: string;
  messages: TicketMessage[];
}

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'TCK-001',
    ticketNumber: 'SF-9481',
    requesterName: 'Kavita Sundaram',
    requesterRole: 'CUSTOMER',
    requesterPhone: '+91 98450 12345',
    requesterEmail: 'kavita.s@gmail.com',
    subject: 'Technician has not arrived for Deep Cleaning AC service',
    category: 'Booking & Dispatch',
    priority: 'Urgent',
    status: 'Open',
    bookingId: 'BK-8902',
    assignedAgent: 'Unassigned',
    createdAt: '14 mins ago',
    messages: [
      {
        id: 'M1',
        sender: 'Customer',
        senderName: 'Kavita Sundaram',
        message:
          'Hello, my AC deep cleaning was scheduled for 11:30 AM today. The app shows technician assigned but they have not arrived and are not picking up the call.',
        timestamp: '11:45 AM',
      },
    ],
  },
  {
    id: 'TCK-002',
    ticketNumber: 'SF-9478',
    requesterName: 'Rajesh Cooling Works (Vendor)',
    requesterRole: 'VENDOR',
    requesterPhone: '+91 97200 45678',
    requesterEmail: 'rajesh.cooling@partner.servfex.com',
    subject: 'Instant UPI payout pending for completed job #BK-8891',
    category: 'Payment & Refund',
    priority: 'High',
    status: 'In Progress',
    bookingId: 'BK-8891',
    assignedAgent: 'Aditi (Support Lead)',
    createdAt: '35 mins ago',
    messages: [
      {
        id: 'M2',
        sender: 'Vendor',
        senderName: 'Rajesh Sharma',
        message:
          'Customer verified QR code at 10:15 AM and confirmed completion. The payout of ₹1,450 has not hit our bank account yet.',
        timestamp: '10:30 AM',
      },
      {
        id: 'M3',
        sender: 'Super Admin Support',
        senderName: 'Aditi (Support Lead)',
        message:
          'Hi Rajesh, checking gateway payout reference with the banking partner. Your payment batch is queued and processing.',
        timestamp: '10:42 AM',
      },
    ],
  },
  {
    id: 'TCK-003',
    ticketNumber: 'SF-9472',
    requesterName: 'Naveen Kumar',
    requesterRole: 'CUSTOMER',
    requesterPhone: '+91 99100 88221',
    requesterEmail: 'naveen.k@outlook.com',
    subject: 'Double charged on credit card during checkout',
    category: 'Payment & Refund',
    priority: 'Urgent',
    status: 'In Progress',
    bookingId: 'BK-8865',
    assignedAgent: 'Rohit (Finance)',
    createdAt: '1 hour ago',
    messages: [
      {
        id: 'M4',
        sender: 'Customer',
        senderName: 'Naveen Kumar',
        message:
          'I booked plumbing repair this morning and my credit card was debited twice: ₹850 and ₹850. Please initiate a reversal immediately.',
        timestamp: '09:50 AM',
      },
      {
        id: 'M5',
        sender: 'Super Admin Support',
        senderName: 'Rohit (Finance)',
        message:
          'We have detected the duplicate payment gateway authorization. A full refund of ₹850 has been triggered (Ref: RFND-44910).',
        timestamp: '10:15 AM',
      },
    ],
  },
  {
    id: 'TCK-004',
    ticketNumber: 'SF-9465',
    requesterName: 'Anita Roy',
    requesterRole: 'CUSTOMER',
    requesterPhone: '+91 98860 33441',
    requesterEmail: 'anita.roy@gmail.com',
    subject: 'Requesting invoice with GST breakdown',
    category: 'Booking & Dispatch',
    priority: 'Low',
    status: 'Resolved',
    bookingId: 'BK-8812',
    assignedAgent: 'Deepak Support',
    createdAt: '3 hours ago',
    messages: [
      {
        id: 'M6',
        sender: 'Customer',
        senderName: 'Anita Roy',
        message: 'Could you please email the formal GST tax invoice for booking BK-8812 for reimbursement?',
        timestamp: '08:20 AM',
      },
      {
        id: 'M7',
        sender: 'Super Admin Support',
        senderName: 'Deepak Support',
        message: 'Tax invoice generated and sent to anita.roy@gmail.com. Thank you!',
        timestamp: '08:45 AM',
      },
    ],
  },
  {
    id: 'TCK-005',
    ticketNumber: 'SF-9459',
    requesterName: 'Apex Electricals (Partner)',
    requesterRole: 'VENDOR',
    requesterPhone: '+91 93450 77112',
    requesterEmail: 'apex.electric@partner.servfex.com',
    subject: 'KYC Document Trade License re-upload verification',
    category: 'Partner Onboarding',
    priority: 'Medium',
    status: 'Open',
    assignedAgent: 'Unassigned',
    createdAt: '4 hours ago',
    messages: [
      {
        id: 'M8',
        sender: 'Vendor',
        senderName: 'Sanjay Gupta',
        message: 'We have updated our municipal trade license certificate. Please review and activate our vendor profile.',
        timestamp: '07:15 AM',
      },
    ],
  },
];

export const SupportInbox: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [activeTab, setActiveTab] = useState<'ALL' | 'Open' | 'In Progress' | 'Urgent' | 'Resolved'>('ALL');
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(INITIAL_TICKETS[0]);
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);

  const [newTicketForm, setNewTicketForm] = useState({
    requesterName: '',
    requesterRole: 'CUSTOMER' as SupportTicket['requesterRole'],
    requesterPhone: '',
    requesterEmail: '',
    subject: '',
    category: 'Booking & Dispatch' as SupportTicket['category'],
    priority: 'Medium' as SupportTicket['priority'],
    message: '',
  });

  const filteredTickets = tickets.filter((t) => {
    const matchesTab =
      activeTab === 'ALL'
        ? true
        : activeTab === 'Urgent'
        ? t.priority === 'Urgent'
        : t.status === activeTab;

    const matchesSearch =
      t.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.requesterName.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      (t.bookingId && t.bookingId.toLowerCase().includes(search.toLowerCase()));

    return matchesTab && matchesSearch;
  });

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    const newMsg: TicketMessage = {
      id: `M-${Date.now()}`,
      sender: 'Super Admin Support',
      senderName: 'Super Admin',
      message: replyText,
      timestamp: 'Just now',
      isInternalNote: isInternalNote,
    };

    const updated = tickets.map((t) => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          status: t.status === 'Open' ? ('In Progress' as const) : t.status,
          messages: [...t.messages, newMsg],
        };
      }
      return t;
    });

    setTickets(updated);
    setSelectedTicket({
      ...selectedTicket,
      status: selectedTicket.status === 'Open' ? 'In Progress' : selectedTicket.status,
      messages: [...selectedTicket.messages, newMsg],
    });
    setReplyText('');
    setIsInternalNote(false);
  };

  const handleStatusChange = (newStatus: SupportTicket['status']) => {
    if (!selectedTicket) return;
    const updated = tickets.map((t) => (t.id === selectedTicket.id ? { ...t, status: newStatus } : t));
    setTickets(updated);
    setSelectedTicket({ ...selectedTicket, status: newStatus });
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const newTck: SupportTicket = {
      id: `TCK-${Math.floor(100 + Math.random() * 900)}`,
      ticketNumber: `SF-${Math.floor(9500 + Math.random() * 500)}`,
      requesterName: newTicketForm.requesterName,
      requesterRole: newTicketForm.requesterRole,
      requesterPhone: newTicketForm.requesterPhone,
      requesterEmail: newTicketForm.requesterEmail,
      subject: newTicketForm.subject,
      category: newTicketForm.category,
      priority: newTicketForm.priority,
      status: 'Open',
      assignedAgent: 'Unassigned',
      createdAt: 'Just now',
      messages: [
        {
          id: `M-${Date.now()}`,
          sender: newTicketForm.requesterRole === 'CUSTOMER' ? 'Customer' : 'Vendor',
          senderName: newTicketForm.requesterName,
          message: newTicketForm.message,
          timestamp: 'Just now',
        },
      ],
    };

    setTickets([newTck, ...tickets]);
    setSelectedTicket(newTck);
    setIsNewTicketOpen(false);
    setNewTicketForm({
      requesterName: '',
      requesterRole: 'CUSTOMER',
      requesterPhone: '',
      requesterEmail: '',
      subject: '',
      category: 'Booking & Dispatch',
      priority: 'Medium',
      message: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-sm">
              <Inbox className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Support Inbox</h1>
              <p className="text-xs text-slate-500">
                Omnichannel customer care, partner inquiries, emergency escalations, and resolution desk.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsNewTicketOpen(true)}
          className="px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log New Ticket</span>
        </button>
      </div>

      {/* KPI Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Open Inquiries</span>
            <Inbox className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {tickets.filter((t) => t.status === 'Open').length}
          </div>
          <p className="text-xs text-slate-500 mt-1">Requiring agent assignment</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Urgent Escalations</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600">
            {tickets.filter((t) => t.priority === 'Urgent').length}
          </div>
          <p className="text-xs text-rose-600 font-semibold mt-1">High SLA priority</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Avg First Response</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">3m 42s</div>
          <p className="text-xs text-emerald-600 font-semibold mt-1">Fast resolution speed</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Resolution Rate</span>
            <CheckCircle2 className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">96.8%</div>
          <p className="text-xs text-slate-500 mt-1">Customer satisfaction index</p>
        </div>
      </div>

      {/* Main Dual-Pane Inbox Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left Pane: Ticket List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 p-2 gap-1 overflow-x-auto text-xs font-bold">
            {(['ALL', 'Open', 'In Progress', 'Urgent', 'Resolved'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab}
                {tab === 'Urgent' && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px]">
                    {tickets.filter((t) => t.priority === 'Urgent').length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ticket #, customer, or booking..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-slate-900"
              />
            </div>
          </div>

          {/* Scrollable Ticket List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No tickets found in this view.</div>
            ) : (
              filteredTickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-4 cursor-pointer transition text-xs ${
                    selectedTicket?.id === t.id ? 'bg-indigo-50/50 border-l-4 border-l-slate-900' : 'hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900">{t.ticketNumber}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.requesterRole === 'CUSTOMER'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}
                      >
                        {t.requesterRole}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">{t.createdAt}</span>
                  </div>

                  <h4 className="font-bold text-slate-800 line-clamp-1 mb-1">{t.subject}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mb-2">
                    {t.messages[t.messages.length - 1]?.message}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-600 font-medium">{t.requesterName}</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.priority === 'Urgent'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : t.priority === 'High'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {t.priority}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === 'Open'
                            ? 'bg-emerald-50 text-emerald-700'
                            : t.status === 'In Progress'
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Pane: Conversation Thread & Actions (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden">
          {selectedTicket ? (
            <>
              {/* Ticket Details Bar */}
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold text-slate-900">{selectedTicket.ticketNumber}</span>
                    <span className="text-xs text-slate-500">({selectedTicket.category})</span>
                    {selectedTicket.bookingId && (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] font-bold">
                        {selectedTicket.bookingId}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 mt-0.5">{selectedTicket.subject}</h3>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                    <span>Requester: {selectedTicket.requesterName}</span>
                    <span>•</span>
                    <span>{selectedTicket.requesterPhone}</span>
                  </div>
                </div>

                {/* Status Switcher */}
                <div className="flex items-center gap-2">
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(e.target.value as any)}
                    className="p-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-slate-900"
                  >
                    <option value="Open">Status: Open</option>
                    <option value="In Progress">Status: In Progress</option>
                    <option value="Resolved">Status: Resolved</option>
                  </select>
                </div>
              </div>

              {/* Chat Thread Messages */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/30">
                {selectedTicket.messages.map((m) => {
                  const isStaff = m.sender === 'Super Admin Support';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isStaff ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-[11px] font-bold text-slate-600">{m.senderName}</span>
                        <span className="text-[10px] text-slate-400">{m.timestamp}</span>
                        {m.isInternalNote && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                            Internal Note
                          </span>
                        )}
                      </div>
                      <div
                        className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                          m.isInternalNote
                            ? 'bg-amber-50 border border-amber-200 text-amber-900'
                            : isStaff
                            ? 'bg-slate-900 text-white rounded-br-xs'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                        }`}
                      >
                        {m.message}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Form */}
              <div className="p-4 border-t border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="internalNote"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-slate-900 focus:ring-slate-900"
                    />
                    <label htmlFor="internalNote" className="text-[11px] font-semibold text-slate-600">
                      Private Internal Staff Note (hidden from customer/vendor)
                    </label>
                  </div>

                  {/* Canned responses dropdown */}
                  <div className="flex items-center gap-1 text-[11px] text-indigo-600 font-semibold cursor-pointer">
                    <Sparkles className="w-3 h-3" />
                    <select
                      onChange={(e) => {
                        if (e.target.value) setReplyText(e.target.value);
                      }}
                      className="bg-transparent border-none text-[11px] text-indigo-600 font-semibold outline-none cursor-pointer"
                    >
                      <option value="">Quick canned response...</option>
                      <option value="Technician has been contacted and is arriving at your doorstep in 10 minutes.">
                        Technician arriving in 10 mins
                      </option>
                      <option value="We have authorized an immediate full refund for this booking to your original payment method.">
                        Immediate refund initiated
                      </option>
                      <option value="Your verified trade license KYC has been approved and your profile is now active.">
                        KYC Approved
                      </option>
                    </select>
                  </div>
                </div>

                <form onSubmit={handleSendReply} className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={
                      isInternalNote ? 'Write internal memo for team...' : 'Reply to customer/partner...'
                    }
                    className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-slate-900"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition inline-flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
              <Headphones className="w-10 h-10 mb-2 stroke-[1.5]" />
              <p className="text-sm font-semibold">Select an inquiry ticket from the left panel</p>
            </div>
          )}
        </div>
      </div>

      {/* Log New Ticket Modal */}
      <Modal isOpen={isNewTicketOpen} onClose={() => setIsNewTicketOpen(false)} title="Log Customer / Partner Ticket" maxWidth="lg">
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Requester Role</label>
              <select
                value={newTicketForm.requesterRole}
                onChange={(e) => setNewTicketForm({ ...newTicketForm, requesterRole: e.target.value as any })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
              >
                <option value="CUSTOMER">Customer</option>
                <option value="VENDOR">Partner Vendor / Employee</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Requester Name</label>
              <input
                type="text"
                required
                value={newTicketForm.requesterName}
                onChange={(e) => setNewTicketForm({ ...newTicketForm, requesterName: e.target.value })}
                placeholder="e.g. Rahul Sharma"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Phone Number</label>
              <input
                type="tel"
                required
                value={newTicketForm.requesterPhone}
                onChange={(e) => setNewTicketForm({ ...newTicketForm, requesterPhone: e.target.value })}
                placeholder="+91 98000 00000"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={newTicketForm.requesterEmail}
                onChange={(e) => setNewTicketForm({ ...newTicketForm, requesterEmail: e.target.value })}
                placeholder="user@example.com"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Category</label>
              <select
                value={newTicketForm.category}
                onChange={(e) => setNewTicketForm({ ...newTicketForm, category: e.target.value as any })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
              >
                <option value="Booking & Dispatch">Booking & Dispatch</option>
                <option value="Payment & Refund">Payment & Refund</option>
                <option value="Technician Behavior">Technician Behavior</option>
                <option value="App Glitch">App Glitch</option>
                <option value="Partner Onboarding">Partner Onboarding</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Priority</label>
              <select
                value={newTicketForm.priority}
                onChange={(e) => setNewTicketForm({ ...newTicketForm, priority: e.target.value as any })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
              >
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Subject</label>
            <input
              type="text"
              required
              value={newTicketForm.subject}
              onChange={(e) => setNewTicketForm({ ...newTicketForm, subject: e.target.value })}
              placeholder="Summary of inquiry or dispute..."
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Detailed Description</label>
            <textarea
              required
              rows={3}
              value={newTicketForm.message}
              onChange={(e) => setNewTicketForm({ ...newTicketForm, message: e.target.value })}
              placeholder="Enter full complaint or issue details..."
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewTicketOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition"
            >
              Open Support Ticket
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
