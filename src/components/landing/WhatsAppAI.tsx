import React from 'react';
import { motion } from 'motion/react';
import { MessageCircle, Calendar, Utensils, Bell } from 'lucide-react';

export const WhatsAppAI = () => {
  return (
    <section className="py-24 bg-surface-2 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10" dir="rtl">
        
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] font-medium text-sm mb-6">
              <MessageCircle size={16} />
              ميزة جديدة
            </div>
            
            <h2 className="text-3xl md:text-5xl font-display font-bold text-text-primary mb-6">
              مساعدك الذكي على <span className="text-[#25D366]">واتساب</span> يعمل على مدار الساعة.
            </h2>
            
            <p className="text-lg text-text-secondary leading-relaxed mb-8">
              الزبائن في الخليج يفضلون واتساب أكثر من أي تطبيق آخر. اربط رقم مطعمك بمنصة VISIONO ودع الذكاء الاصطناعي يرد على الاستفسارات، يتلقى الحجوزات، ويقترح الأطباق بلغة طبيعية تشبه البشر.
            </p>

            <ul className="space-y-6">
              {[
                { icon: <Calendar size={20} />, title: 'حجوزات آلية بالكامل', desc: 'يستقبل الحجز، يتحقق من توفر الطاولات في النظام، ويرسل تأكيد للزبون.' },
                { icon: <Utensils size={20} />, title: 'فهم عميق لقائمتك', desc: 'يستطيع الإجابة على: "هل عندكم أطباق خالية من الجلوتين؟" أو "كم سعرة في البرجر؟"' },
                { icon: <Bell size={20} />, title: 'تنبيهات قائمة الانتظار', desc: 'بمجرد أن تجهز الطاولة، يرسل النظام رسالة واتساب تلقائية للزبون ليتفضل بالدخول.' }
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
              <div className="bg-[#202C33] -mx-4 -mt-4 p-4 flex items-center gap-3 border-b border-white/5">
                <div className="w-10 h-10 bg-surface rounded-full flex items-center justify-center overflow-hidden">
                  <span className="text-xl">🍔</span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">مساعد مطعم برجر ستيشن</h3>
                  <p className="text-[#8696A0] text-xs">متصل الآن</p>
                </div>
              </div>

              {/* WA Chat Area */}
              <div className="flex-1 bg-[#0B141A] -mx-4 p-4 flex flex-col gap-4 overflow-hidden relative">
                {/* Chat bg pattern could go here */}
                
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
                  <p>أهلاً! أبي أحجز طاولة لشخصين اليوم الساعة 8 مساءً. عندكم جلسات خارجية؟</p>
                  <span className="text-[10px] text-white/60 block text-left mt-1">10:42 م</span>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.5 }}
                  viewport={{ once: true }}
                  className="self-start bg-[#202C33] text-white p-3 rounded-2xl rounded-tl-sm max-w-[85%] text-sm shadow-sm"
                >
                  <p>أهلاً بك في برجر ستيشن! 🍔<br/><br/>نعم، لدينا جلسات خارجية متوفرة. تم تأكيد حجزك لطاولة لشخصين في الجلسة الخارجية اليوم الساعة 8:00 مساءً.<br/><br/>رقم الحجز: #1042<br/><br/>هل تود الاطلاع على القائمة ثلاثية الأبعاد قبل وصولك؟</p>
                  <span className="text-[10px] text-white/60 block text-right mt-1">10:42 م</span>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 2.5 }}
                  viewport={{ once: true }}
                  className="self-end bg-[#005C4B] text-white p-3 rounded-2xl rounded-tr-sm max-w-[85%] text-sm shadow-sm"
                >
                  <p>ممتاز، إيه ياليت.</p>
                  <span className="text-[10px] text-white/60 block text-left mt-1">10:43 م</span>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 3.5 }}
                  viewport={{ once: true }}
                  className="self-start bg-[#202C33] text-white p-3 rounded-2xl rounded-tl-sm max-w-[85%] text-sm shadow-sm"
                >
                  <p>تفضل رابط القائمة الذكية:<br/><span className="text-blue-400">visiono.app/m/burger-station</span><br/><br/>نتطلع لزيارتك قريباً! ✨</p>
                  <span className="text-[10px] text-white/60 block text-right mt-1">10:43 م</span>
                </motion.div>

              </div>

              {/* WA Input */}
              <div className="bg-[#202C33] -mx-4 -mb-4 p-3 flex items-center gap-2 border-t border-white/5">
                <div className="flex-1 bg-[#2A3942] rounded-full h-10 px-4 flex items-center text-[#8696A0] text-sm">
                  اكتب رسالة...
                </div>
                <div className="w-10 h-10 rounded-full bg-[#00A884] flex items-center justify-center text-white shrink-0">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
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
