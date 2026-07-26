import { supabase } from '../lib/supabase';

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('يجب تسجيل الدخول لاستخدام الميزة');
  }
  return session.access_token;
}

export interface MetaQRCode {
  id: string;
  branch_id: string;
  meta_qr_code_id: string;
  deep_link_url: string;
  prefilled_message: string;
  qr_image_url?: string;
  created_at: string;
}

export interface BranchFAQ {
  id: string;
  branch_id: string;
  question: string;
  answer: string;
  category: string;
  is_active: boolean;
  created_at: string;
}

export interface WhatsAppConversation {
  id: string;
  branch_id: string;
  customer_phone: string;
  customer_name?: string;
  last_message_at: string;
  status: string;
  created_at: string;
}

export interface WhatsAppMessage {
  id: string;
  conversation_id: string;
  sender_type: 'customer' | 'ai' | 'agent';
  message_text: string;
  meta_message_id?: string;
  created_at: string;
}

export interface POSOrderRequest {
  id: string;
  branch_id: string;
  customer_phone: string;
  customer_name?: string;
  order_summary: string;
  items: any[];
  total_price?: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'fulfilled';
  created_at: string;
}

export const whatsappService = {
  // ── Connection Settings ──────────────────────────────────
  async getConnection(branchId: string) {
    const token = await getAuthToken();
    const res = await fetch(`/api/whatsapp/connection?branchId=${branchId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل جلب إعدادات الواتساب');
    }
    return res.json();
  },

  async saveConnection(data: {
    branchId: string;
    whatsappPhoneNumberId: string;
    whatsappAccessToken?: string;
    whatsappNumber: string;
    whatsappEnabled: boolean;
  }) {
    const token = await getAuthToken();
    const res = await fetch('/api/whatsapp/connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل حفظ إعدادات الواتساب');
    }
    return res.json();
  },

  async completeEmbeddedSignup(data: {
    branchId: string;
    authCode?: string;
    wabaId?: string;
    phoneNumberId?: string;
    accessToken?: string;
  }) {
    const token = await getAuthToken();
    const res = await fetch('/api/whatsapp/embedded-signup/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل إكمال الربط عبر Meta Embedded Signup');
    }
    return res.json();
  },

  // ── Meta Official QR Codes ──────────────────────────────
  async getQRCodes(branchId: string): Promise<MetaQRCode[]> {
    const token = await getAuthToken();
    const res = await fetch(`/api/whatsapp/qr-codes?branchId=${branchId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل جلب رموز QR من السيرفر');
    }
    return res.json();
  },

  async generateQRCode(branchId: string, prefilledMessage?: string): Promise<MetaQRCode> {
    const token = await getAuthToken();
    const res = await fetch('/api/whatsapp/generate-qr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ branchId, prefilledMessage })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل توليد رمز QR عبر Meta');
    }
    return res.json();
  },

  async updateQRCode(branchId: string, qrCodeId: string, metaQrCodeId: string, prefilledMessage: string): Promise<MetaQRCode> {
    const token = await getAuthToken();
    const res = await fetch('/api/whatsapp/update-qr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ branchId, qrCodeId, metaQrCodeId, prefilledMessage })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل تحديث الرسالة المسبقة للكود');
    }
    return res.json();
  },

  async deleteQRCode(branchId: string, qrCodeId: string, metaQrCodeId: string): Promise<void> {
    const token = await getAuthToken();
    const res = await fetch('/api/whatsapp/delete-qr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ branchId, qrCodeId, metaQrCodeId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل حذف رمز QR');
    }
  },

  // ── FAQs (Branch Knowledge Base) ────────────────────────
  async getFAQs(branchId: string): Promise<BranchFAQ[]> {
    const { data, error } = await supabase
      .from('pos_branch_faq')
      .select('*')
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async addFAQ(branchId: string, question: string, answer: string, category = 'general'): Promise<BranchFAQ> {
    const { data, error } = await supabase
      .from('pos_branch_faq')
      .insert({ branch_id: branchId, question, answer, category, is_active: true })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateFAQ(faqId: string, question: string, answer: string, category = 'general', isActive = true): Promise<BranchFAQ> {
    const { data, error } = await supabase
      .from('pos_branch_faq')
      .update({ question, answer, category, is_active: isActive })
      .eq('id', faqId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteFAQ(faqId: string): Promise<void> {
    const { error } = await supabase
      .from('pos_branch_faq')
      .delete()
      .eq('id', faqId);
    if (error) throw error;
  },

  // ── Live Conversations & Messages ───────────────────────
  async getConversations(branchId: string): Promise<WhatsAppConversation[]> {
    const { data, error } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('branch_id', branchId)
      .order('last_message_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getMessages(conversationId: string): Promise<WhatsAppMessage[]> {
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // ── Order Requests ──────────────────────────────────────
  async getOrderRequests(branchId: string): Promise<POSOrderRequest[]> {
    const { data, error } = await supabase
      .from('pos_order_requests')
      .select('*')
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async updateOrderRequestStatus(orderRequestId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('pos_order_requests')
      .update({ status })
      .eq('id', orderRequestId);
    if (error) throw error;
  }
};
