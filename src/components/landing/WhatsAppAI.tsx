import React from 'react';
import { motion } from 'motion/react';
import { MessageCircle, Calendar, Utensils, Bell } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const WhatsAppAI = () => {
  const { isRtl } = useLanguage();

  return (
    <section className="py-24 bg-surface-2 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10" dir={isRtl ? "rtl" : "ltr"}>
        
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] font-medium text-sm mb-6">
              <MessageCircle size={16} />
              {isRtl ? 'موظف مبيعات بالذكاء الاصطناعي عبر واتساب' : 'AI WhatsApp Sales Agent'}
            </div>
            
            <h2 className="text-3xl md:text-5xl font-display font-bold text-text-primary mb-6">
              {isRtl 
                ? <>مساعدك الذكي على <span className="text-[#25D366]">واتساب</span> يعمل على مدار الساعة.</>
                : <>Your smart assistant on <span className="text-[#25D366]">WhatsApp</span> working around the clock.</>
              }
            </h2>
            
            <p className="text-xl font-medium text-text-primary leading-relaxed mb-8 border-l-4 border-[#25D366] pl-4 rtl:border-l-0 rtl:border-r-4 rtl:pl-0 rtl:pr-4 py-2 bg-[#25D366]/5 rounded-r-lg rtl:rounded-l-lg rtl:rounded-r-none">
              {isRtl 
                ? "وظّف مساعد مبيعات ذكي يرد على عملائك 24/7 عبر واتساب — يجاوب، يقترح، ويأخذ الطلب، بدون ما يغيب عن الشغل ولا يتأخر بالرد أبداً."
                : "Hire a smart sales assistant that replies to your customers 24/7 via WhatsApp — answers questions, makes suggestions, and takes orders, never missing a shift or delaying a response."
              }
            </p>

            <ul className="space-y-6">
              {[
                { 
                  icon: <MessageCircle size={20} />, 
                  title: isRtl ? 'رد فوري وطبيعي' : 'Instant & Natural Responses', 
                  desc: isRtl ? 'يتحدث مع الزبون كأنه موظف حقيقي، يفهم اللهجات ويرد في ثوانٍ.' : 'Chats with guests like a real human, understands dialects, and replies in seconds.' 
                },
                { 
                  icon: <Utensils size={20} />, 
                  title: isRtl ? 'فهم عميق لقائمتك' : 'Deep Menu Understanding', 
                  desc: isRtl ? 'يستطيع الإجابة على: "هل عندكم أطباق خالية من الجلوتين؟" أو "كم سعرة في البرجر؟"' : 'Answers questions like: "Do you have gluten-free dishes?" or "How many calories in the burger?"' 
                },
                { 
                  icon: <Calendar size={20} />, 
                  title: isRtl ? 'استقبال الطلبات المباشرة' : 'Direct Order Taking', 
                  desc: isRtl ? 'يجمع الطلب من العميل ويحوله مباشرة إلى نظام المحاسبة (POS) بدون تدخل بشري.' : 'Takes the order from the customer and pushes it directly to the POS system without human intervention.' 
                }
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center shrink-0">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-text-primary mb-1">{feature.title}</h4>
                    <p className="text-sm text-text-secondary leading-relaxed">{feature.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Visual: WhatsApp Chat UI Mockup */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative mx-auto w-full max-w-sm"
          >
            <div className="bg-[#0B141A] rounded-[3rem] border-8 border-surface p-4 shadow-2xl relative overflow-hidden h-[600px] flex flex-col">
              
              {/* WA Header */}
              <div className="bg-[#202C33] -mx-4 -mt-4 p-4 flex items-center gap-3 border-b border-white/5" dir="rtl">
                <div className="w-10 h-10 bg-surface rounded-full flex items-center justify-center overflow-hidden">
                  <span className="text-xl">🍔</span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">مساعد مطعم برجر ستيشن</h3>
                  <p className="text-[#8696A0] text-xs">متصل الآن</p>
                </div>
              </div>

              {/* WA Chat Area */}
              <div className="flex-1 bg-[#0B141A] -mx-4 p-4 flex flex-col gap-4 overflow-hidden relative" dir="rtl">
                
                <div className="self-center bg-[#182229] text-[#8696A0] text-[10px] px-3 py-1 rounded-lg">
                  اليوم
                </div>

                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  viewport={{ once: true }}
                  className="self-end bg-[#005C4B] text-white p-3 rounded-2xl rounded-tr-sm max-w-[85%] text-sm shadow-sm"
                >
                  <p>أهلاً! أبي أطلب 2 برجر كلاسيك، بس واحد منهم بدون طماطم وصوص خارجي.</p>
                  <span className="text-[10px] text-white/60 block text-left mt-1">10:42 م</span>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.5 }}
                  viewport={{ once: true }}
                  className="self-start bg-[#202C33] text-white p-3 rounded-2xl rounded-tl-sm max-w-[85%] text-sm shadow-sm"
                >
                  <p>أهلاً بك في برجر ستيشن! 🍔<br/><br/>تم تسجيل طلبك:<br/>- 1x برجر كلاسيك (عادي)<br/>- 1x برجر كلاسيك (بدون طماطم، صوص خارجي)<br/><br/>الإجمالي: 78 ريال.<br/>هل أؤكد الطلب وأرسل رابط الدفع؟</p>
                  <span className="text-[10px] text-white/60 block text-right mt-1">10:42 م</span>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 2.5 }}
                  viewport={{ once: true }}
                  className="self-end bg-[#005C4B] text-white p-3 rounded-2xl rounded-tr-sm max-w-[85%] text-sm shadow-sm"
                >
                  <p>إيه توكل على الله.</p>
                  <span className="text-[10px] text-white/60 block text-left mt-1">10:43 م</span>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 3.5 }}
                  viewport={{ once: true }}
                  className="self-start bg-[#202C33] text-white p-3 rounded-2xl rounded-tl-sm max-w-[85%] text-sm shadow-sm"
                >
                  <p>تم استلام طلبك وبدأ تحضيره في المطبخ! 🔥<br/><br/>رابط الدفع الآمن:<br/><span className="text-blue-400">pay.visiono.app/1042</span><br/><br/>تقدر تستلم طلبك خلال 15 دقيقة.</p>
                  <span className="text-[10px] text-white/60 block text-right mt-1">10:43 م</span>
                </motion.div>

              </div>

              {/* WA Input */}
              <div className="bg-[#202C33] -mx-4 -mb-4 p-3 flex items-center gap-2 border-t border-white/5" dir="rtl">
                <div className="flex-1 bg-[#2A3942] rounded-full h-10 px-4 flex items-center text-[#8696A0] text-sm">
                  اكتب رسالة...
                </div>
                <div className="w-10 h-10 rounded-full bg-[#00A884] flex items-center justify-center text-white shrink-0">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="mr-1">
                    <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"></path>
                  </svg>
                </div>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
