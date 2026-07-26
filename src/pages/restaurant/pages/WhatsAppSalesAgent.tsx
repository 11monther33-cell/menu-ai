import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { usePOSStore } from '../../../store/posStore';
import { getOrCreateBranch } from '../../../services/posService';
import { useAuth } from '../../../hooks/useAuth';
import {
  whatsappService,
  MetaQRCode,
  BranchFAQ,
  WhatsAppConversation,
  WhatsAppMessage,
  POSOrderRequest
} from '../../../services/whatsappService';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import {
  Bot,
  QrCode,
  MessageSquare,
  Settings,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  Download,
  Copy,
  ExternalLink,
  CheckCircle2,
  HelpCircle,
  ShoppingBag,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  Smartphone,
  Info,
  Check,
  AlertCircle
} from 'lucide-react';

export const WhatsAppSalesAgent = () => {
  const { isRtl } = useLanguage();
  const { user } = useAuth();
  const { currentBranch, setBranch } = usePOSStore();

  const [activeTab, setActiveTab] = useState<'connection' | 'qr' | 'monitor'>('connection');
  const [monitorSubTab, setMonitorSubTab] = useState<'conversations' | 'orders' | 'faqs'>('conversations');

  // Connection State
  const [whatsappPhoneNumberId, setWhatsappPhoneNumberId] = useState('');
  const [whatsappAccessToken, setWhatsappAccessToken] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [savingConnection, setSavingConnection] = useState(false);
  const [loadingConnection, setLoadingConnection] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Meta QR Codes State
  const [qrCodes, setQrCodes] = useState<MetaQRCode[]>([]);
  const [loadingQrs, setLoadingQrs] = useState(false);
  const [showCreateQrModal, setShowCreateQrModal] = useState(false);
  const [showEditQrModal, setShowEditQrModal] = useState<MetaQRCode | null>(null);
  const [prefilledMsg, setPrefilledMsg] = useState('مرحباً! أود الطلب من قائمة الطعام');
  const [submittingQr, setSubmittingQr] = useState(false);

  // Monitor State
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(false);

  // Orders State
  const [orderRequests, setOrderRequests] = useState<POSOrderRequest[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // FAQs State
  const [faqs, setFaqs] = useState<BranchFAQ[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<BranchFAQ | null>(null);
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqCategory, setFaqCategory] = useState('عام');
  const [submittingFaq, setSubmittingFaq] = useState(false);

  // Initialize Branch Context
  useEffect(() => {
    const init = async () => {
      if (!currentBranch && user?.restaurantId) {
        try {
          const branch = await getOrCreateBranch(user.restaurantId);
          if (branch) setBranch(branch);
        } catch (e) {
          console.error('Failed to get branch:', e);
        }
      }
    };
    init();
  }, [user?.restaurantId, currentBranch, setBranch]);

  // Load Data on Branch Change
  useEffect(() => {
    if (currentBranch?.id) {
      loadConnectionData();
      loadQRCodes();
      loadConversations();
      loadOrderRequests();
      loadFAQs();
    }
  }, [currentBranch?.id]);

  const loadConnectionData = async () => {
    if (!currentBranch?.id) return;
    setLoadingConnection(true);
    try {
      const data = await whatsappService.getConnection(currentBranch.id);
      setWhatsappPhoneNumberId(data.whatsappPhoneNumberId || '');
      setWhatsappNumber(data.whatsappNumber || '');
      setWhatsappEnabled(data.whatsappEnabled || false);
      setHasToken(data.hasToken || false);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingConnection(false);
    }
  };

  const loadQRCodes = async () => {
    if (!currentBranch?.id) return;
    setLoadingQrs(true);
    try {
      const list = await whatsappService.getQRCodes(currentBranch.id);
      setQrCodes(list);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingQrs(false);
    }
  };

  const loadConversations = async () => {
    if (!currentBranch?.id) return;
    setLoadingConvs(true);
    try {
      const list = await whatsappService.getConversations(currentBranch.id);
      setConversations(list);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingConvs(false);
    }
  };

  const loadOrderRequests = async () => {
    if (!currentBranch?.id) return;
    setLoadingOrders(true);
    try {
      const list = await whatsappService.getOrderRequests(currentBranch.id);
      setOrderRequests(list);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadFAQs = async () => {
    if (!currentBranch?.id) return;
    setLoadingFaqs(true);
    try {
      const list = await whatsappService.getFAQs(currentBranch.id);
      setFaqs(list);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingFaqs(false);
    }
  };

  // Connection Handler
  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBranch?.id) return;
    setSavingConnection(true);
    try {
      const res = await whatsappService.saveConnection({
        branchId: currentBranch.id,
        whatsappPhoneNumberId,
        whatsappAccessToken: whatsappAccessToken || undefined,
        whatsappNumber,
        whatsappEnabled,
      });
      toast.success(isRtl ? 'تم حفظ إعدادات الربط بنجاح' : 'WhatsApp Connection Saved');
      setHasToken(res.branch.hasToken);
      setWhatsappAccessToken('');
      setShowTokenInput(false);
    } catch (err: any) {
      toast.error(err.message || 'فشل حفظ البيانات');
    } finally {
      setSavingConnection(false);
    }
  };

  // Meta QR Handlers
  const handleGenerateQR = async () => {
    if (!currentBranch?.id) return;
    setSubmittingQr(true);
    try {
      const newQr = await whatsappService.generateQRCode(currentBranch.id, prefilledMsg);
      toast.success(isRtl ? 'تم توليد كود الـ QR بنجاح عبر Meta' : 'Meta QR Code Generated');
      setQrCodes(prev => [newQr, ...prev]);
      setShowCreateQrModal(false);
      setPrefilledMsg('مرحباً! أود الطلب من قائمة الطعام');
    } catch (err: any) {
      toast.error(err.message || 'فشل توليد رمز الـ QR');
    } finally {
      setSubmittingQr(false);
    }
  };

  const handleUpdateQR = async () => {
    if (!currentBranch?.id || !showEditQrModal) return;
    setSubmittingQr(true);
    try {
      const updated = await whatsappService.updateQRCode(
        currentBranch.id,
        showEditQrModal.id,
        showEditQrModal.meta_qr_code_id,
        prefilledMsg
      );
      toast.success(isRtl ? 'تم تحديث الرسالة المسبقة للكود' : 'QR Prefilled Message Updated');
      setQrCodes(prev => prev.map(q => q.id === updated.id ? updated : q));
      setShowEditQrModal(null);
    } catch (err: any) {
      toast.error(err.message || 'فشل تحديث رمز الـ QR');
    } finally {
      setSubmittingQr(false);
    }
  };

  const handleDeleteQR = async (qr: MetaQRCode) => {
    if (!confirm(isRtl ? 'هل أنت تأكد من حذف رمز الـ QR هذا؟' : 'Delete this Meta QR Code?')) return;
    if (!currentBranch?.id) return;
    try {
      await whatsappService.deleteQRCode(currentBranch.id, qr.id, qr.meta_qr_code_id);
      toast.success(isRtl ? 'تم حذف الكود' : 'QR Code Deleted');
      setQrCodes(prev => prev.filter(q => q.id !== qr.id));
    } catch (err: any) {
      toast.error(err.message || 'فشل الحذف');
    }
  };

  // FAQ Handlers
  const handleSaveFAQ = async () => {
    if (!currentBranch?.id || !faqQuestion || !faqAnswer) return;
    setSubmittingFaq(true);
    try {
      if (editingFaq) {
        const updated = await whatsappService.updateFAQ(editingFaq.id, faqQuestion, faqAnswer, faqCategory);
        setFaqs(prev => prev.map(f => f.id === updated.id ? updated : f));
        toast.success(isRtl ? 'تم تعديل السؤال الشائع' : 'FAQ Updated');
      } else {
        const created = await whatsappService.addFAQ(currentBranch.id, faqQuestion, faqAnswer, faqCategory);
        setFaqs(prev => [created, ...prev]);
        toast.success(isRtl ? 'تمت إضافة السؤال الشائع' : 'FAQ Added');
      }
      setShowFaqModal(false);
      setEditingFaq(null);
      setFaqQuestion('');
      setFaqAnswer('');
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ');
    } finally {
      setSubmittingFaq(false);
    }
  };

  const handleDeleteFAQ = async (id: string) => {
    if (!confirm(isRtl ? 'حذف هذا السؤال الشائع؟' : 'Delete FAQ?')) return;
    try {
      await whatsappService.deleteFAQ(id);
      setFaqs(prev => prev.filter(f => f.id !== id));
      toast.success(isRtl ? 'تم الحذف' : 'Deleted');
    } catch (err: any) {
      toast.error('فشل الحذف');
    }
  };

  // Load Messages for Modal
  const handleSelectConv = async (conv: WhatsAppConversation) => {
    setSelectedConversation(conv);
    setLoadingMessages(true);
    try {
      const msgs = await whatsappService.getMessages(conv.id);
      setMessages(msgs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Copy Deep Link
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(isRtl ? 'تم النسخ للحافظة' : 'Copied to clipboard');
  };

  return (
    <div className="space-y-8 p-4 lg:p-8 max-w-7xl mx-auto selection:bg-gold/30">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-surface-2 via-surface-2 to-surface border border-white/10 rounded-3xl p-6 lg:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl -z-10" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="p-3 bg-gold/10 border border-gold/30 text-gold rounded-2xl">
                <Bot size={28} />
              </span>
              <div>
                <h1 className="text-2xl lg:text-3xl font-display font-bold text-text flex items-center gap-2">
                  {isRtl ? 'موظف مبيعات واتساب' : 'WhatsApp AI Sales Agent'}
                  <Sparkles size={20} className="text-gold animate-pulse" />
                </h1>
                <p className="text-muted text-sm mt-1">
                  {isRtl
                    ? 'ردود آلية ذكية، توليد رموز QR رسمية من Meta، ومتابعة فورية للطلبيات'
                    : 'Intelligent grounded AI responses, official Meta QR codes, and live order tracking'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-surface-2/80 backdrop-blur-md p-2 rounded-2xl border border-white/5">
            <span className={`w-3 h-3 rounded-full ${whatsappEnabled ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
            <span className="text-xs font-semibold text-text px-2">
              {whatsappEnabled
                ? (isRtl ? 'الذكاء الاصطناعي نشط' : 'AI Agent Active')
                : (isRtl ? 'الخدمة غير مفعّلة' : 'AI Agent Inactive')}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-white/5">
          <button
            onClick={() => setActiveTab('connection')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'connection'
                ? 'bg-gold text-main shadow-lg shadow-gold/20 font-bold'
                : 'bg-white/5 text-muted hover:text-text hover:bg-white/10'
            }`}
          >
            <Settings size={18} />
            <span>{isRtl ? '1. ربط الحساب والإعدادات' : '1. Connection Setup'}</span>
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'qr'
                ? 'bg-gold text-main shadow-lg shadow-gold/20 font-bold'
                : 'bg-white/5 text-muted hover:text-text hover:bg-white/10'
            }`}
          >
            <QrCode size={18} />
            <span>{isRtl ? '2. أكواد QR الرسمية من Meta' : '2. Meta Official QR Codes'}</span>
          </button>

          <button
            onClick={() => setActiveTab('monitor')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'monitor'
                ? 'bg-gold text-main shadow-lg shadow-gold/20 font-bold'
                : 'bg-white/5 text-muted hover:text-text hover:bg-white/10'
            }`}
          >
            <MessageSquare size={18} />
            <span>{isRtl ? '3. المراقبة المباشرة والأسئلة الشائعة' : '3. Live Oversight & FAQs'}</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <AnimatePresence mode="wait">
        {/* SCREEN 1: CONNECTION SETUP */}
        {activeTab === 'connection' && (
          <motion.div
            key="tab-connection"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 bg-surface-2 border border-white/5 rounded-3xl p-6 lg:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h2 className="text-xl font-bold text-text flex items-center gap-2">
                  <Smartphone size={22} className="text-gold" />
                  {isRtl ? 'بيانات الربط مع Meta WhatsApp API' : 'Meta API Connection Credentials'}
                </h2>
                <button
                  onClick={() => setShowGuideModal(true)}
                  className="text-xs text-gold hover:underline flex items-center gap-1 font-semibold"
                >
                  <HelpCircle size={16} />
                  {isRtl ? 'دليل إعداد حساب Meta WABA' : 'WABA Setup Checklist'}
                </button>
              </div>

              <form onSubmit={handleSaveConnection} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-2 uppercase tracking-wider">
                    {isRtl ? 'رقم الواتساب الخاص بالمطعم' : 'Restaurant WhatsApp Phone Number'}
                  </label>
                  <input
                    type="text"
                    value={whatsappNumber}
                    onChange={e => setWhatsappNumber(e.target.value)}
                    placeholder="+96890000000 / +966500000000"
                    className="w-full bg-main border border-white/10 rounded-2xl px-4 py-3.5 text-text focus:border-gold outline-none dir-ltr font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted mb-2 uppercase tracking-wider">
                    {isRtl ? 'معرّف رقم الهاتف (WhatsApp Phone Number ID)' : 'WhatsApp Phone Number ID'}
                  </label>
                  <input
                    type="text"
                    value={whatsappPhoneNumberId}
                    onChange={e => setWhatsappPhoneNumberId(e.target.value)}
                    placeholder="e.g. 104820492849204"
                    className="w-full bg-main border border-white/10 rounded-2xl px-4 py-3.5 text-text focus:border-gold outline-none dir-ltr font-mono text-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider">
                      {isRtl ? 'رمز الوصول (Permanent Access Token)' : 'Permanent Access Token'}
                    </label>
                    {hasToken && (
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                        <ShieldCheck size={12} />
                        {isRtl ? 'التوكن مخزن ومشرّف بأمان (AES-256)' : 'Encrypted & Stored (AES-256)'}
                      </span>
                    )}
                  </div>

                  {!showTokenInput && hasToken ? (
                    <div className="flex items-center justify-between bg-main border border-white/10 rounded-2xl p-4">
                      <span className="text-xs text-muted font-mono tracking-widest">••••••••••••••••••••••••••••••••</span>
                      <button
                        type="button"
                        onClick={() => setShowTokenInput(true)}
                        className="text-xs text-gold font-bold hover:underline"
                      >
                        {isRtl ? 'تحديث التوكن' : 'Update Token'}
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="password"
                        value={whatsappAccessToken}
                        onChange={e => setWhatsappAccessToken(e.target.value)}
                        placeholder="EAAG..."
                        className="w-full bg-main border border-white/10 rounded-2xl px-4 py-3.5 text-text focus:border-gold outline-none dir-ltr font-mono text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* AI Activation Toggle */}
                <div className="bg-main/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-sm font-bold text-text block">
                      {isRtl ? 'تفعيل موظف المبيعات والرد الآلي' : 'Enable AI Sales Agent'}
                    </span>
                    <span className="text-xs text-muted block">
                      {isRtl
                        ? 'عند التفعيل، سيرد الذكاء الاصطناعي فوراً على رسائل العائلات والزبائن بالمنيو الحقيقي'
                        : 'AI will answer incoming WhatsApp queries using menu and FAQ knowledge base'}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={whatsappEnabled}
                      onChange={e => setWhatsappEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold"></div>
                  </label>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingConnection}
                    className="px-8 py-3.5 bg-gold text-main font-bold rounded-2xl hover:bg-gold-light transition-all shadow-lg shadow-gold/20 flex items-center gap-2 disabled:opacity-50"
                  >
                    {savingConnection && <RefreshCw size={16} className="animate-spin" />}
                    {isRtl ? 'حفظ إعدادات الربط' : 'Save Connection Credentials'}
                  </button>
                </div>
              </form>
            </div>

            {/* Sidebar Security & Webhook Info */}
            <div className="space-y-6">
              <div className="bg-surface-2 border border-white/5 rounded-3xl p-6 space-y-4">
                <h3 className="text-base font-bold text-text flex items-center gap-2">
                  <ShieldCheck className="text-emerald-400" size={20} />
                  {isRtl ? 'الأمان والتشفير المحمي' : 'Enterprise Security'}
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  {isRtl
                    ? 'يتم تشفير رمز الوصول (Access Token) بسيرفر النظام عبر خوارزمية AES-256-GCM قبل حفظه في قاعدة البيانات، ولا يتم طباعته أو إظهاره كنسخ نصية أبداً.'
                    : 'Access tokens are encrypted at rest using AES-256-GCM server-side cryptography. Never logged or exposed in plaintext.'}
                </p>
              </div>

              <div className="bg-surface-2 border border-white/5 rounded-3xl p-6 space-y-4">
                <h3 className="text-base font-bold text-text flex items-center gap-2">
                  <ExternalLink className="text-gold" size={20} />
                  {isRtl ? 'رابط الـ Webhook الخاص بك' : 'Your Webhook Endpoint'}
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  {isRtl
                    ? 'ضع هذا الرابط في إعدادات Webhook في Meta Developers Console:'
                    : 'Configure this URL in Meta Developers Console -> Webhook Settings:'}
                </p>
                <div className="bg-main border border-white/10 p-3 rounded-xl flex items-center justify-between">
                  <code className="text-[11px] text-gold dir-ltr truncate font-mono">
                    https://visiono.vercel.app/api/whatsapp/webhook
                  </code>
                  <button
                    onClick={() => copyToClipboard('https://visiono.vercel.app/api/whatsapp/webhook')}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-muted hover:text-text transition-colors"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SCREEN 2: META OFFICIAL QR CODE MANAGEMENT */}
        {activeTab === 'qr' && (
          <motion.div
            key="tab-qr"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface-2 border border-white/5 rounded-3xl p-6">
              <div>
                <h2 className="text-xl font-bold text-text flex items-center gap-2">
                  <QrCode size={24} className="text-gold" />
                  {isRtl ? 'إدارة أكواد QR الرسمية من Meta' : 'Meta Official QR Codes Management'}
                </h2>
                <p className="text-xs text-muted mt-1">
                  {isRtl
                    ? 'توليد رموز QR رسمية مستضافة بواسطة Meta بدون انتهاء صلاحية للطباعة والمواقف'
                    : 'Generate official Meta-hosted QR codes for print signage. Codes never expire.'}
                </p>
              </div>

              <button
                onClick={() => {
                  setPrefilledMsg('مرحباً! أود الطلب من قائمة الطعام');
                  setShowCreateQrModal(true);
                }}
                className="px-6 py-3.5 bg-gold text-main font-bold rounded-2xl hover:bg-gold-light transition-all shadow-lg shadow-gold/20 flex items-center gap-2"
              >
                <Plus size={18} />
                {isRtl ? 'توليد رمز QR جديد من Meta' : 'Generate Meta QR Code'}
              </button>
            </div>

            {loadingQrs ? (
              <div className="py-20 text-center">
                <RefreshCw size={32} className="animate-spin text-gold mx-auto mb-3" />
                <p className="text-xs text-muted">{isRtl ? 'جاري تحميل الرموز...' : 'Loading QR Codes...'}</p>
              </div>
            ) : qrCodes.length === 0 ? (
              <div className="bg-surface-2 border border-dashed border-white/10 rounded-3xl p-12 text-center space-y-4">
                <QrCode size={48} className="text-muted mx-auto" />
                <h3 className="text-lg font-bold text-text">
                  {isRtl ? 'لا توجد رموز QR رسمية مولدة بعد' : 'No Official Meta QR Codes Generated'}
                </h3>
                <p className="text-xs text-muted max-w-md mx-auto">
                  {isRtl
                    ? 'قم بتوليد أول رمز QR رسمي من Meta ليتمكن الزبائن من مسحه للطلب والاستفسار الفوري عبر الواتساب'
                    : 'Create your first Meta official QR code for customers to scan and chat with the AI Sales Agent.'}
                </p>
                <button
                  onClick={() => setShowCreateQrModal(true)}
                  className="px-6 py-3 bg-gold text-main font-bold rounded-xl hover:bg-gold-light transition-all"
                >
                  {isRtl ? 'توليد كود الآن' : 'Generate Now'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {qrCodes.map(qr => (
                  <div
                    key={qr.id}
                    className="bg-surface-2 border border-white/5 rounded-3xl p-6 space-y-5 flex flex-col justify-between hover:border-gold/30 transition-all shadow-xl"
                  >
                    <div className="space-y-4">
                      {/* Meta QR Image Display */}
                      <div className="bg-white p-4 rounded-2xl flex items-center justify-center border border-gray-200">
                        {qr.qr_image_url ? (
                          <img src={qr.qr_image_url} alt="Meta QR" className="w-48 h-48 object-contain" />
                        ) : (
                          <div className="w-48 h-48 bg-gray-50 flex items-center justify-center rounded-xl text-gray-400 text-center p-4">
                            <span className="text-xs font-mono text-gray-600">
                              Official Meta Code:<br/>{qr.meta_qr_code_id}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] text-gold font-semibold uppercase tracking-wider block">
                          {isRtl ? 'الرسالة المسبقة المحمّلة' : 'Prefilled Message'}
                        </span>
                        <p className="text-xs text-text bg-main border border-white/5 p-3 rounded-xl font-medium">
                          "{qr.prefilled_message || 'مرحباً'}"
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-muted font-semibold uppercase tracking-wider block">
                          {isRtl ? 'رابط الواتساب المباشر' : 'Deep Link URL'}
                        </span>
                        <div className="flex items-center gap-2 bg-main border border-white/5 p-2 px-3 rounded-xl">
                          <span className="text-[11px] text-muted dir-ltr truncate flex-1 font-mono">
                            {qr.deep_link_url}
                          </span>
                          <button
                            onClick={() => copyToClipboard(qr.deep_link_url)}
                            className="p-1 text-gold hover:text-gold-light"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                      <button
                        onClick={() => {
                          setShowEditQrModal(qr);
                          setPrefilledMsg(qr.prefilled_message || '');
                        }}
                        className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-text rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <Edit2 size={14} />
                        {isRtl ? 'تعديل النص' : 'Edit Text'}
                      </button>

                      {qr.qr_image_url && (
                        <a
                          href={qr.qr_image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download="meta-whatsapp-qr.svg"
                          className="p-2.5 bg-gold/10 text-gold hover:bg-gold/20 rounded-xl transition-all"
                          title={isRtl ? 'تنزيل الكود للطباعة' : 'Download SVG for Print'}
                        >
                          <Download size={16} />
                        </a>
                      )}

                      <button
                        onClick={() => handleDeleteQR(qr)}
                        className="p-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-all"
                        title={isRtl ? 'حذف الكود' : 'Delete Code'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* SCREEN 3: LIVE MONITOR & FAQS */}
        {activeTab === 'monitor' && (
          <motion.div
            key="tab-monitor"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Sub tab navigation */}
            <div className="flex gap-2 border-b border-white/5 pb-4">
              <button
                onClick={() => setMonitorSubTab('conversations')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                  monitorSubTab === 'conversations'
                    ? 'bg-gold text-main shadow-md'
                    : 'bg-surface-2 text-muted hover:text-text'
                }`}
              >
                <MessageSquare size={16} />
                {isRtl ? 'المحادثات المباشرة' : 'Live Conversations Feed'}
              </button>

              <button
                onClick={() => setMonitorSubTab('orders')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                  monitorSubTab === 'orders'
                    ? 'bg-gold text-main shadow-md'
                    : 'bg-surface-2 text-muted hover:text-text'
                }`}
              >
                <ShoppingBag size={16} />
                {isRtl ? 'طلبات الواتساب الواردة' : 'WhatsApp Order Requests'}
              </button>

              <button
                onClick={() => setMonitorSubTab('faqs')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                  monitorSubTab === 'faqs'
                    ? 'bg-gold text-main shadow-md'
                    : 'bg-surface-2 text-muted hover:text-text'
                }`}
              >
                <HelpCircle size={16} />
                {isRtl ? 'الأسئلة الشائعة وتدريب الـ AI' : 'Branch FAQs Grounding'}
              </button>
            </div>

            {/* Subtab 1: Live Conversations */}
            {monitorSubTab === 'conversations' && (
              <div className="bg-surface-2 border border-white/5 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-text">
                    {isRtl ? 'سجل المحادثات الواردة من الزبائن' : 'Recent Customer Conversations Log'}
                  </h3>
                  <button
                    onClick={loadConversations}
                    className="p-2 text-gold hover:bg-white/5 rounded-xl"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>

                {loadingConvs ? (
                  <div className="py-12 text-center text-xs text-muted">
                    <RefreshCw size={24} className="animate-spin text-gold mx-auto mb-2" />
                    {isRtl ? 'جاري التحميل...' : 'Loading...'}
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted">
                    {isRtl ? 'لا توجد محادثات مسجلة بعد' : 'No recorded conversations yet'}
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {conversations.map(conv => (
                      <div
                        key={conv.id}
                        onClick={() => handleSelectConv(conv)}
                        className="py-4 flex items-center justify-between hover:bg-white/5 px-4 rounded-2xl cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gold/10 text-gold flex items-center justify-center font-bold text-xs">
                            {conv.customer_name?.slice(0, 2) || 'WA'}
                          </div>
                          <div>
                            <span className="text-sm font-bold text-text block">
                              {conv.customer_name || conv.customer_phone}
                            </span>
                            <span className="text-xs text-muted dir-ltr block font-mono">
                              {conv.customer_phone}
                            </span>
                          </div>
                        </div>

                        <div className="text-end">
                          <span className="text-[10px] text-muted block">
                            {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-xs text-gold font-semibold hover:underline">
                            {isRtl ? 'عرض المحادثة الكاملة' : 'View Transcript'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Subtab 2: Order Requests */}
            {monitorSubTab === 'orders' && (
              <div className="bg-surface-2 border border-white/5 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-text">
                    {isRtl ? 'طلبيات الشراء المستخلصة عبر الواتساب' : 'WhatsApp AI Captured Orders'}
                  </h3>
                  <button onClick={loadOrderRequests} className="p-2 text-gold hover:bg-white/5 rounded-xl">
                    <RefreshCw size={16} />
                  </button>
                </div>

                {loadingOrders ? (
                  <div className="py-12 text-center text-xs text-muted">
                    <RefreshCw size={24} className="animate-spin text-gold mx-auto mb-2" />
                    {isRtl ? 'جاري التحميل...' : 'Loading...'}
                  </div>
                ) : orderRequests.length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted">
                    {isRtl ? 'لا توجد طلبات واردة من الواتساب بعد' : 'No WhatsApp order requests captured yet'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {orderRequests.map(order => (
                      <div key={order.id} className="bg-main border border-white/5 p-5 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gold dir-ltr font-mono">
                            {order.customer_phone}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            order.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' :
                            order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {order.status}
                          </span>
                        </div>

                        <p className="text-xs text-text bg-surface-2 p-3 rounded-xl">
                          "{order.order_summary}"
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-muted pt-2 border-t border-white/5">
                          <span>{new Date(order.created_at).toLocaleString()}</span>
                          {order.total_price && <span className="font-bold text-gold">{order.total_price} OMR</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Subtab 3: FAQs */}
            {monitorSubTab === 'faqs' && (
              <div className="bg-surface-2 border border-white/5 rounded-3xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-text">
                      {isRtl ? 'الأسئلة الشائعة والمعلومات التدريبية للـ AI' : 'Branch FAQ Knowledge Base'}
                    </h3>
                    <p className="text-xs text-muted mt-1">
                      {isRtl
                        ? 'أضف مواعيد العمل، فروع التوصيل، والأسئلة الشائعة ليجيب عنها الذكاء الاصطناعي بدقة'
                        : 'Train the AI agent on store hours, delivery options, and branch policies'}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setEditingFaq(null);
                      setFaqQuestion('');
                      setFaqAnswer('');
                      setShowFaqModal(true);
                    }}
                    className="px-5 py-2.5 bg-gold text-main font-bold rounded-xl text-xs flex items-center gap-1.5"
                  >
                    <Plus size={16} />
                    {isRtl ? 'إضافة سؤال شائع' : 'Add FAQ'}
                  </button>
                </div>

                {loadingFaqs ? (
                  <div className="py-12 text-center text-xs text-muted">
                    <RefreshCw size={24} className="animate-spin text-gold mx-auto mb-2" />
                    {isRtl ? 'جاري التحميل...' : 'Loading...'}
                  </div>
                ) : faqs.length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted">
                    {isRtl ? 'لا توجد أسئلة شائعة مضافة' : 'No FAQs added yet'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {faqs.map(faq => (
                      <div key={faq.id} className="bg-main border border-white/5 p-5 rounded-2xl space-y-3 flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="text-[10px] text-gold font-bold uppercase tracking-wider block">
                            {faq.category}
                          </span>
                          <h4 className="text-sm font-bold text-text">س: {faq.question}</h4>
                          <p className="text-xs text-muted bg-surface-2 p-3 rounded-xl leading-relaxed">
                            ج: {faq.answer}
                          </p>
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                          <button
                            onClick={() => {
                              setEditingFaq(faq);
                              setFaqQuestion(faq.question);
                              setFaqAnswer(faq.answer);
                              setFaqCategory(faq.category);
                              setShowFaqModal(true);
                            }}
                            className="p-1.5 text-muted hover:text-gold"
                          >
                            <Edit2 size={16} />
                          </button>

                          <button
                            onClick={() => handleDeleteFAQ(faq.id)}
                            className="p-1.5 text-muted hover:text-red-400"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE META QR MODAL */}
      {showCreateQrModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-surface-2 border border-white/10 rounded-3xl p-6 lg:p-8 max-w-lg w-full space-y-6">
            <h3 className="text-xl font-bold text-text flex items-center gap-2">
              <QrCode size={24} className="text-gold" />
              {isRtl ? 'توليد رمز QR جديد عبر Meta API' : 'Generate Official Meta QR Code'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted mb-2 uppercase">
                  {isRtl ? 'الرسالة المسبقة التي سيكتبها الزبون عند فتح الكود (حد أقصى 140 حرف)' : 'Prefilled Message (Max 140 chars)'}
                </label>
                <textarea
                  value={prefilledMsg}
                  onChange={e => setPrefilledMsg(e.target.value.slice(0, 140))}
                  rows={3}
                  className="w-full bg-main border border-white/10 rounded-2xl p-4 text-sm text-text focus:border-gold outline-none resize-none"
                  placeholder="مرحباً! أود الاستفسار عن قائمتكم والطلب"
                />
                <span className="text-[10px] text-muted float-left mt-1">{prefilledMsg.length}/140</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button
                onClick={() => setShowCreateQrModal(false)}
                className="px-6 py-2.5 text-xs text-muted hover:text-text"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                onClick={handleGenerateQR}
                disabled={submittingQr}
                className="px-6 py-2.5 bg-gold text-main font-bold rounded-xl text-xs hover:bg-gold-light transition-all flex items-center gap-1.5"
              >
                {submittingQr && <RefreshCw size={14} className="animate-spin" />}
                {isRtl ? 'توليد الكود الرسمي' : 'Generate Official QR'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT META QR MODAL */}
      {showEditQrModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-surface-2 border border-white/10 rounded-3xl p-6 lg:p-8 max-w-lg w-full space-y-6">
            <h3 className="text-xl font-bold text-text flex items-center gap-2">
              <Edit2 size={22} className="text-gold" />
              {isRtl ? 'تعديل الرسالة المسبقة للكود' : 'Update QR Prefilled Message'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted mb-2 uppercase">
                  {isRtl ? 'الرسالة المسبقة الجديدة' : 'New Prefilled Message'}
                </label>
                <textarea
                  value={prefilledMsg}
                  onChange={e => setPrefilledMsg(e.target.value.slice(0, 140))}
                  rows={3}
                  className="w-full bg-main border border-white/10 rounded-2xl p-4 text-sm text-text focus:border-gold outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button
                onClick={() => setShowEditQrModal(null)}
                className="px-6 py-2.5 text-xs text-muted hover:text-text"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                onClick={handleUpdateQR}
                disabled={submittingQr}
                className="px-6 py-2.5 bg-gold text-main font-bold rounded-xl text-xs hover:bg-gold-light transition-all flex items-center gap-1.5"
              >
                {submittingQr && <RefreshCw size={14} className="animate-spin" />}
                {isRtl ? 'تحديث الكود' : 'Update Code'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ MODAL */}
      {showFaqModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-surface-2 border border-white/10 rounded-3xl p-6 lg:p-8 max-w-lg w-full space-y-6">
            <h3 className="text-xl font-bold text-text flex items-center gap-2">
              <HelpCircle size={24} className="text-gold" />
              {editingFaq ? (isRtl ? 'تعديل سؤال شائع' : 'Edit FAQ') : (isRtl ? 'إضافة سؤال شائع جديد' : 'Add New FAQ')}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted mb-2">
                  {isRtl ? 'السؤال متوقع من الزبون' : 'Customer Expected Question'}
                </label>
                <input
                  type="text"
                  value={faqQuestion}
                  onChange={e => setFaqQuestion(e.target.value)}
                  placeholder="ما هي أوقات العمل في فرعكم؟"
                  className="w-full bg-main border border-white/10 rounded-2xl p-3.5 text-sm text-text focus:border-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-2">
                  {isRtl ? 'الإجابة الدقيقة من المطعم' : 'Accurate Restaurant Answer'}
                </label>
                <textarea
                  value={faqAnswer}
                  onChange={e => setFaqAnswer(e.target.value)}
                  rows={3}
                  placeholder="نعمل يومياً من الساعة 12 ظهراً وحتى 12 منتصف الليل."
                  className="w-full bg-main border border-white/10 rounded-2xl p-4 text-sm text-text focus:border-gold outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-2">
                  {isRtl ? 'التصنيف' : 'Category'}
                </label>
                <select
                  value={faqCategory}
                  onChange={e => setFaqCategory(e.target.value)}
                  className="w-full bg-main border border-white/10 rounded-2xl p-3.5 text-sm text-text focus:border-gold outline-none"
                >
                  <option value="عام">عام</option>
                  <option value="أوقات العمل">أوقات العمل</option>
                  <option value="التوصيل والطلبات">التوصيل والطلبات</option>
                  <option value="الموقع والفرع">الموقع والفرع</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button
                onClick={() => setShowFaqModal(false)}
                className="px-6 py-2.5 text-xs text-muted hover:text-text"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                onClick={handleSaveFAQ}
                disabled={submittingFaq}
                className="px-6 py-2.5 bg-gold text-main font-bold rounded-xl text-xs hover:bg-gold-light transition-all flex items-center gap-1.5"
              >
                {submittingFaq && <RefreshCw size={14} className="animate-spin" />}
                {isRtl ? 'حفظ السؤال' : 'Save FAQ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONVERSATION TRANSCRIPT MODAL */}
      {selectedConversation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-surface-2 border border-white/10 rounded-3xl p-6 max-w-2xl w-full space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div>
                <h3 className="text-base font-bold text-text">
                  {selectedConversation.customer_name || selectedConversation.customer_phone}
                </h3>
                <span className="text-xs text-muted dir-ltr block font-mono">
                  {selectedConversation.customer_phone}
                </span>
              </div>
              <button
                onClick={() => setSelectedConversation(null)}
                className="p-2 text-muted hover:text-text"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-main rounded-2xl border border-white/5 custom-scrollbar">
              {loadingMessages ? (
                <div className="py-8 text-center text-xs text-muted">
                  <RefreshCw size={20} className="animate-spin text-gold mx-auto mb-2" />
                  {isRtl ? 'جاري تحميل الرسائل...' : 'Loading messages...'}
                </div>
              ) : messages.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted">
                  {isRtl ? 'لا توجد رسائل مسجلة' : 'No messages found'}
                </div>
              ) : (
                messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender_type === 'customer' ? 'items-start' : 'items-end'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                        msg.sender_type === 'customer'
                          ? 'bg-surface-2 text-text border border-white/5 rounded-tr-none'
                          : 'bg-gold text-main font-semibold rounded-tl-none'
                      }`}
                    >
                      {msg.message_text}
                    </div>
                    <span className="text-[9px] text-muted mt-1 px-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* META WABA GUIDE CHECKLIST MODAL */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-surface-2 border border-white/10 rounded-3xl p-6 lg:p-8 max-w-2xl w-full space-y-6 max-h-[85vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-text flex items-center gap-2">
              <Info size={24} className="text-gold" />
              {isRtl ? 'دليل خطوة بخطوة لربط حساب Meta WABA' : 'Meta WABA Connection Guide'}
            </h3>

            <div className="space-y-4 text-xs text-muted leading-relaxed">
              <div className="p-4 bg-main border border-white/5 rounded-2xl space-y-2">
                <span className="font-bold text-gold block text-sm">1. إنشاء حساب Meta Developer</span>
                <p>قم بالدخول إلى developers.facebook.com وإنشاء حساب مطور واختيار نوع التطبيق Business.</p>
              </div>

              <div className="p-4 bg-main border border-white/5 rounded-2xl space-y-2">
                <span className="font-bold text-gold block text-sm">2. إعداد منتج WhatsApp</span>
                <p>أضف منتج WhatsApp للتطبيق واقرن رقم هاتفك الخاص بالمطعم لتوليد Phone Number ID.</p>
              </div>

              <div className="p-4 bg-main border border-white/5 rounded-2xl space-y-2">
                <span className="font-bold text-gold block text-sm">3. إنشاء التوكن الدائم (System User Token)</span>
                <p>في Meta Business Settings، أنشئ System User وامنحه صلاحيات whatsapp_business_messaging وتوليد Permanent Access Token.</p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-6 py-2.5 bg-gold text-main font-bold rounded-xl text-xs"
              >
                {isRtl ? 'فهمت، إغلاق' : 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
