import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Sparkles, User, Box, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: Date;
  dishRecommendation?: {
    id: string;
    nameAr: string;
    nameEn: string;
    price: number;
    currency: string;
    imageUrl?: string;
    has3d: boolean;
  };
}

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  branding?: any;
  onViewDish3D?: (dishId: string) => void;
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({ isOpen, onClose, branding, onViewDish3D }) => {
  const { isRtl, t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const primaryColor = branding?.primary_color || '#C9A84C';

  // Initialize with dummy messages when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: '1',
          sender: 'ai',
          text: isRtl 
            ? 'مرحباً بك في مطعمنا! أنا المساعد الذكي، كيف يمكنني مساعدتك في اختيار وجبتك اليوم؟' 
            : 'Welcome to our restaurant! I am your AI waiter, how can I help you choose your meal today?',
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen, messages.length, isRtl]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response after 1.5s
    setTimeout(() => {
      setIsTyping(false);
      const isArabic = isRtl; // Simplification based on UI lang
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: isArabic
          ? 'بناءً على طلبك، أنصحك بشدة بتجربة "ستيك الريب آي المشوي" لدينا. إنه من أكثر الأطباق مبيعاً ويتميز بطراوته وطعمه الغني! يمكنك إلقاء نظرة عليه بتقنية 3D قبل الطلب.'
          : 'Based on what you mentioned, I highly recommend our "Grilled Ribeye Steak". It is a top seller, very tender and rich in flavor! You can view it in 3D right now.',
        timestamp: new Date(),
        dishRecommendation: {
          id: 'mock-dish-1',
          nameAr: 'ستيك ريب آي مشوي',
          nameEn: 'Grilled Ribeye Steak',
          price: 12.500,
          currency: 'OMR',
          has3d: true
        }
      };
      
      setMessages(prev => [...prev, aiResponse]);
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.5 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 z-[101] flex flex-col h-[85vh] max-h-[800px] bg-main rounded-t-3xl border-t border-white/10 shadow-2xl overflow-hidden font-display"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-sidebar relative z-10">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg relative"
                  style={{ backgroundColor: primaryColor + '20' }}
                >
                  <Sparkles size={18} style={{ color: primaryColor }} />
                  <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-sidebar" />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-base flex items-center gap-2">
                    {isRtl ? 'المساعد الذكي' : 'AI Waiter'}
                    <span className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold bg-gradient-to-r from-gold/20 to-gold/10 text-gold border border-gold/20">
                      Beta
                    </span>
                  </h3>
                  <p className="text-text-secondary text-xs">
                    {isRtl ? 'يرد فوراً' : 'Replies instantly'}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-card border border-white/5 text-text-secondary hover:text-text-primary hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-5 space-y-6"
              style={{
                backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.02) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}
            >
              <AnimatePresence initial={false}>
                {messages.map((msg) => {
                  const isAI = msg.sender === 'ai';
                  
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex w-full ${isAI ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`flex gap-3 max-w-[85%] ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
                        {/* Avatar */}
                        <div className="shrink-0 mt-auto">
                          {isAI ? (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gold to-yellow-300 flex items-center justify-center shadow-lg shadow-gold/20">
                              <Sparkles size={14} className="text-black" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-card border border-white/10 flex items-center justify-center">
                              <User size={14} className="text-text-secondary" />
                            </div>
                          )}
                        </div>

                        {/* Bubble */}
                        <div className={`flex flex-col gap-2 ${isAI ? 'items-start' : 'items-end'}`}>
                          <div 
                            className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm
                              ${isAI 
                                ? 'bg-sidebar border border-white/5 text-text-primary rounded-bl-sm' 
                                : 'text-black rounded-br-sm'
                              }`}
                            style={!isAI ? { backgroundColor: primaryColor } : undefined}
                          >
                            {msg.text}
                          </div>

                          {/* Recommendation Card */}
                          {msg.dishRecommendation && (
                            <div className="w-full max-w-sm mt-1 bg-card border border-white/10 rounded-2xl overflow-hidden shadow-lg">
                              <div className="p-4 flex gap-4">
                                <div className="w-16 h-16 rounded-xl bg-sidebar border border-white/5 flex items-center justify-center shrink-0 relative overflow-hidden">
                                  {msg.dishRecommendation.imageUrl ? (
                                    <img src={msg.dishRecommendation.imageUrl} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="text-gold/50"><Box size={24} /></div>
                                  )}
                                  {msg.dishRecommendation.has3d && (
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent py-1 flex justify-center">
                                      <span className="text-[9px] font-bold text-gold tracking-widest">3D</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                  <h4 className="font-bold text-sm text-text-primary mb-1">
                                    {isRtl ? msg.dishRecommendation.nameAr : msg.dishRecommendation.nameEn}
                                  </h4>
                                  <p className="text-gold font-bold text-sm">
                                    {msg.dishRecommendation.price.toFixed(3)} <span className="text-[10px] text-text-secondary">{msg.dishRecommendation.currency}</span>
                                  </p>
                                </div>
                              </div>
                              <button 
                                onClick={() => onViewDish3D && onViewDish3D(msg.dishRecommendation!.id)}
                                className="w-full py-3 bg-white/5 hover:bg-white/10 transition-colors border-t border-white/5 flex items-center justify-center gap-2 text-xs font-bold text-text-primary"
                              >
                                {isRtl ? 'عرض بصيغة 3D' : 'View in 3D'}
                                <ArrowRight size={14} className={isRtl ? 'rotate-180' : ''} />
                              </button>
                            </div>
                          )}
                          
                          <span className="text-[10px] text-text-muted px-1">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex w-full justify-start"
                  >
                    <div className="flex gap-3 max-w-[85%] flex-row items-end">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gold to-yellow-300 flex items-center justify-center shadow-lg shadow-gold/20 shrink-0">
                        <Sparkles size={14} className="text-black" />
                      </div>
                      <div className="p-4 rounded-2xl bg-sidebar border border-white/5 rounded-bl-sm flex items-center gap-1.5 h-[52px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-gold/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-gold/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input Area */}
            <div className="p-4 bg-sidebar border-t border-white/5">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSend();
                  }}
                  placeholder={isRtl ? 'اسأل المساعد الذكي عن أفضل الأطباق...' : 'Ask the AI waiter about the best dishes...'}
                  className="w-full h-14 bg-card border border-white/10 rounded-2xl px-5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all pr-14 rtl:pr-5 rtl:pl-14"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className={`absolute ${isRtl ? 'left-2' : 'right-2'} w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                    inputValue.trim() 
                      ? 'bg-gold text-black shadow-lg shadow-gold/20 scale-100' 
                      : 'bg-white/5 text-text-muted scale-95'
                  }`}
                >
                  <Send size={18} className={isRtl ? 'rotate-180 -ml-0.5' : 'ml-0.5'} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
