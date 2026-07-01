import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Check, X, Play } from "lucide-react";
import { useLocation } from "wouter";

const LOGO_URL = "/logo.png";

export default function Home() {
  const [, navigate] = useLocation();
  const [billAmount, setBillAmount] = useState(50);
  const [tablesPerDay, setTablesPerDay] = useState(10);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [pricingMode, setPricingMode] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    const handleScroll = () => {
      const reveals = document.querySelectorAll(".reveal");
      reveals.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight - 100) {
          el.classList.add("in");
        }
      });
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const dailyIncrease = Math.round((billAmount * tablesPerDay * 20) / 100);
  const monthlyIncrease = dailyIncrease * 30;
  const yearlyIncrease = monthlyIncrease * 12;

  const faqItems = [
    {
      q: "هل أحتاج خبرة تقنية لإعداد النظام؟",
      a: "لا. النظام مصمم ليكون جاهزاً في 30 دقيقة. فريقنا يرافقك خطوة بخطوة حتى تشغيله الكامل.",
    },
    {
      q: "هل يعمل مع مطعمي الحالي دون تغييرات؟",
      a: "نعم تماماً. لا يحتاج أجهزة إضافية. يعمل على أي هاتف أو تابلت أو شاشة.",
    },
    {
      q: "ماذا يحدث بعد انتهاء الأيام الثلاثة المجانية؟",
      a: "تختار الخطة التي تناسبك وتكمل بسلاسة — أو تلغي بضغطة واحدة بدون أي رسوم.",
    },
    {
      q: "هل المنيو يدعم اللغة العربية بالكامل؟",
      a: "بالكامل — عربي وإنجليزي في نفس الوقت. الطلب بالصوت أيضاً متاح باللغة العربية.",
    },
    {
      q: "هل يمكنني إدارة أكثر من فرع؟",
      a: "نعم — خطة المؤسسي تدعم فروعاً غير محدودة من لوحة تحكم واحدة.",
    },
    {
      q: "كيف يختلف VISIONO عن تطبيقات المنيو العادية؟",
      a: "تطبيقات المنيو تعرض — VISIONO يبيع. الفرق في الذكاء الاصطناعي، التجربة ثلاثية الأبعاد، وتحليلات الأداء التي تحوّل بيانات مطعمك إلى قرارات.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans" dir="rtl">
      {/* SECTION 1 - الـ Header */}
      <div className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur-md">
        <div className="container py-3 flex flex-col items-center justify-center gap-1">
          <img src={LOGO_URL} alt="VISIONO" className="h-10 w-auto" />
          <p className="text-sm text-gold font-bold tracking-wider">المنصة الذكية للمطاعم</p>
        </div>
      </div>

      {/* SECTION 2 - الـ Hero */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="radial-glow absolute inset-0 opacity-60 pointer-events-none" />
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6 reveal">
            <p className="text-gold text-sm md:text-base font-bold tracking-wider">
              ⚠️ إذا كان مطعمك لا يصنع لحظات — فهو يصنع خسائر
            </p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              مطعمك يخسر آلاف الدولارات كل شهر
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-semibold">
              من طاولاتك الفاضية — وأنت لا تعرف من أين
            </p>
            <div className="pt-4 space-y-2">
              <p className="text-lg md:text-xl leading-relaxed text-foreground/90">
                اكتشف كيف يحوّل VISIONO كل طاولة إلى تجربة لا تُنسى —
              </p>
              <p className="text-lg md:text-xl leading-relaxed text-foreground/90">
                تزيد الطلبات، ترفع الأرباح، وتُعيد الزبون مراراً وتكراراً
              </p>
            </div>
            
            <div className="pt-8 space-y-4 max-w-2xl mx-auto">
              <p className="text-gold font-semibold text-lg">▶ شاهد الفيديو كاملاً — الأهم في الدقيقة الأخيرة</p>
              <div className="bg-card/50 border hairline rounded-xl aspect-video flex items-center justify-center hover:border-gold/50 transition-colors cursor-pointer group shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent z-0" />
                <Play className="w-20 h-20 text-gold/80 group-hover:text-gold transition-colors z-10 drop-shadow-lg group-hover:scale-110 duration-300" />
              </div>
            </div>
            
            <div className="pt-10">
              <Button onClick={() => navigate("/subscribe")} className="bg-gold hover:bg-gold-soft text-background font-bold text-lg px-8 py-7 md:text-xl md:px-12 btn-press animate-pulse-glow rounded-xl shadow-xl shadow-gold/20">
                🟡 ابدأ تجربتك المجانية ٣ أيام — بدون بطاقة بنكية
              </Button>
              <p className="text-sm md:text-base text-muted-foreground mt-4 font-medium">
                لا عقود. لا التزامات. ألغِ في أي لحظة.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 - الصدمة بالأرقام */}
      <section className="py-20 md:py-32 bg-card/40 border-y border-border/40 relative">
        <div className="container space-y-16 reveal">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">كم تخسر فعلاً كل شهر؟</h2>
            <p className="text-xl text-muted-foreground">لنكن صادقَين — الأرقام لا تكذب:</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-full lg:px-10 mx-auto">
            <div className="space-y-4 p-8 bg-background border hairline rounded-xl hover:border-ember/40 transition-colors relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-ember/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-ember/20 transition-colors" />
              <p className="text-lg text-foreground/90 font-medium relative z-10 leading-relaxed">
                كل طاولة عندك تستطيع أن تطلب <span className="text-gold font-bold text-xl mx-1">20% أكثر</span><br/>
                <span className="text-ember font-bold mt-2 inline-block">— لكنها لا تفعل.</span>
              </p>
            </div>
            
            <div className="space-y-4 p-8 bg-background border hairline rounded-xl hover:border-ember/40 transition-colors relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-ember/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-ember/20 transition-colors" />
              <p className="text-lg text-foreground/90 font-medium relative z-10 leading-relaxed">
                كل زبون يخرج راضياً يستطيع أن يرجع <span className="text-gold font-bold text-xl mx-1">مرتين</span><br/>
                <span className="text-ember font-bold mt-2 inline-block">— لكنه لا يرجع.</span>
              </p>
            </div>
            
            <div className="space-y-4 p-8 bg-background border hairline rounded-xl hover:border-ember/40 transition-colors relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-ember/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-ember/20 transition-colors" />
              <p className="text-lg text-foreground/90 font-medium relative z-10 leading-relaxed">
                كل وجبة لم تُصوَّر وتُنشر<br/>
                <span className="text-ember font-bold mt-2 inline-block">= إعلان مجاني ضاع للأبد.</span>
              </p>
            </div>
          </div>

          <div className="max-w-5xl mx-auto p-8 md:p-10 bg-background border hairline rounded-2xl space-y-6 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-ember/5 pointer-events-none" />
            <p className="text-xl text-foreground/90 font-display" dir="ltr">
              10 طاولات يومياً × 20% زيادة في الطلب × 30 يوماً
            </p>
            <p className="text-3xl md:text-4xl font-bold text-ember leading-tight">
              = مئات الدولارات تتركها على الطاولة كل شهر
            </p>
            <p className="text-xl text-muted-foreground font-semibold">بلا سبب.</p>
            
            <div className="pt-6 border-t border-border/50">
              <p className="text-xl md:text-2xl font-bold text-foreground leading-relaxed">
                أنت لا تخسر أرباحاً فقط —<br/>
                <span className="text-gold">أنت تخسر مطعماً كاملاً موازياً لمطعمك،<br/>كل يوم، بصمت.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 - المرآة (اجعله يرى نفسه) */}
      <section className="py-20 md:py-32 relative">
        <div className="container space-y-16 reveal">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold">هل هذا ما تعيشه الآن؟</h2>
          </div>

          <div className="max-w-2xl mx-auto space-y-4">
            {[
              "طاولات تجلس دون أن تطلب بما يكفي",
              "زبائن يأتون مرة واحدة — ولا يعودون أبداً",
              "منيو ورقي أو صورة جامدة لا تبيع ولا تُقنع",
              "منافس جديد يفتح بجانبك كل شهر",
              "تصرف على إعلانات — ولا ترى نتيجة واضحة",
              "زبائن يبحثون عن مطعمك أونلاين ولا يجدون ما يجذبهم لدخوله",
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-5 p-5 bg-card border hairline rounded-xl hover:border-ember/40 hover:bg-card/80 transition-all duration-300"
              >
                <div className="w-8 h-8 rounded-full bg-ember/10 flex items-center justify-center flex-shrink-0">
                  <X className="w-5 h-5 text-ember" strokeWidth={3} />
                </div>
                <p className="text-lg text-foreground/90 font-medium">{item}</p>
              </div>
            ))}
          </div>

          <div className="max-w-5xl mx-auto p-10 bg-gold/10 border border-gold/30 rounded-2xl text-center space-y-4 shadow-xl shadow-gold/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-50" />
            <p className="text-2xl relative z-10">إذا قلت <span className="font-bold">"نعم"</span> لأي واحدة منها —</p>
            <p className="text-3xl md:text-4xl font-bold text-gold relative z-10">فأنت بالضبط من صنعنا VISIONO من أجله.</p>
          </div>
        </div>
      </section>

      {/* SECTION 5 - كسر المقاومة */}
      <section className="py-20 md:py-32 bg-card/40 border-y border-border/40">
        <div className="container space-y-12 reveal">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold">"تطبيق ثانٍ لن يغير شيئاً"</h2>
            <p className="text-2xl text-muted-foreground font-medium">أعرف أنك تفكر بهذا — وأنت محق... <span className="text-gold">لو كان تطبيقاً عادياً</span></p>

            <div className="space-y-8 pt-8 max-w-2xl mx-auto text-right">
              <p className="text-xl text-foreground/90 leading-relaxed font-medium">
                المنيو الورقي اخترعوه قبل 150 سنة.<br/>
                لم يتغير — بينما تغيّر كل شيء من حوله.
              </p>
              <p className="text-xl text-foreground/90 leading-relaxed font-medium">
                الجيل الجديد اليوم لا يختار مطعمه في الشارع —<br/>
                يختاره على هاتفه، قبل أن يخرج من البيت،<br/>
                بناءً على ما يراه.
              </p>
              
              <div className="p-8 bg-background border hairline rounded-2xl shadow-xl mt-12 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-2 h-full bg-gold" />
                <p className="text-2xl font-bold text-foreground">والسؤال الذي يجب أن تسأله الآن:</p>
                <p className="text-3xl md:text-4xl font-bold text-gold mt-6 leading-tight">ماذا يرون عندما يبحثون عن مطعمك؟</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 - تقديم VISIONO */}
      <section className="py-20 md:py-32">
        <div className="container space-y-20 reveal">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-4xl md:text-6xl font-bold leading-tight">
              VISIONO — ليس تطبيقاً<br/>
              <span className="text-gold mt-4 inline-block">إنه النظام الذي يجعل مطعمك يبيع بدلاً عنك</span>
            </h2>
            <p className="text-2xl text-muted-foreground pt-6 font-medium">
              ثلاثة محاور. نتيجة واحدة: مطعم لا يُنسى.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-full lg:px-10 mx-auto">
            {/* المحور الأول */}
            <div className="p-8 bg-card border hairline rounded-2xl hover:border-gold/50 transition-all duration-300 space-y-6 group hover:-translate-y-2 shadow-lg">
              <div className="w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center border border-gold/20 group-hover:scale-110 transition-transform">
                <span className="text-2xl text-gold font-bold">⬡</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">المنيو الذكي ثلاثي الأبعاد</h3>
              <div className="space-y-4 text-foreground/80 leading-relaxed text-lg">
                <p>الزبون يرى طبقه قبل أن يطلبه —<br/>بشكل واقعي، ثلاثي الأبعاد، يشتهيه بعيونه.</p>
                <p>لا يتردد. لا يسأل. فقط يطلب.<br/>ويطلب أكثر.</p>
                <p className="font-semibold text-gold pt-2">والأهم: يصوّره — ويشاركه.<br/>كل صورة تُنشر = إعلان مجاني وصل لـ 300 شخص.</p>
              </div>
            </div>

            {/* المحور الثاني */}
            <div className="p-8 bg-card border hairline rounded-2xl hover:border-gold/50 transition-all duration-300 space-y-6 group hover:-translate-y-2 shadow-lg">
              <div className="w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center border border-gold/20 group-hover:scale-110 transition-transform">
                <span className="text-2xl text-gold font-bold">⬡</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">الطلب الذكي بالذكاء الاصطناعي</h3>
              <div className="space-y-4 text-foreground/80 leading-relaxed text-lg">
                <p>نظام يفهم ذوق كل زبون —<br/>ويقترح الإضافات، المشروبات، والوجبات المكملة تلقائياً، في اللحظة المناسبة.</p>
                <p className="font-semibold text-gold pt-2 border-t border-border/50">النتيجة؟<br/>متوسط كل فاتورة يرتفع — بدون أي جهد من موظفيك.</p>
              </div>
            </div>

            {/* المحور الثالث */}
            <div className="p-8 bg-card border hairline rounded-2xl hover:border-gold/50 transition-all duration-300 space-y-6 group hover:-translate-y-2 shadow-lg">
              <div className="w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center border border-gold/20 group-hover:scale-110 transition-transform">
                <span className="text-2xl text-gold font-bold">⬡</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">تجربة تصنع الولاء</h3>
              <div className="space-y-4 text-foreground/80 leading-relaxed text-lg">
                <p>الزبون الذي يعيش لحظة لا ينساها — يرجع.<br/>الزبون الذي يرجع — لا يحتاج إعلاناً.<br/>لا يقارن أسعارك. لا يفكر في المنافس.</p>
                <p className="font-semibold text-gold pt-2 border-t border-border/50">يرجع لأن عندك شيئاً لا يجده في أي مكان آخر.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7 - حاسبة الربح */}
      <section id="calculator" className="py-20 md:py-32 bg-card/40 border-y border-border/40">
        <div className="container space-y-16 reveal">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold">احسب كم ستربح إضافياً مع VISIONO</h2>
          </div>

          <div className="max-w-3xl mx-auto p-8 md:p-12 bg-background border hairline rounded-2xl shadow-2xl relative">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-50" />
            
            <div className="space-y-8">
              {/* Inputs */}
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border/50 hover:border-gold/30 transition-colors">
                  <span className="text-lg font-medium text-foreground">متوسط فاتورة طاولتك الآن</span>
                  <div className="flex items-center gap-4 w-full md:w-1/2">
                    <input
                      type="range"
                      min="20"
                      max="200"
                      step="5"
                      value={billAmount}
                      onChange={(e) => setBillAmount(Number(e.target.value))}
                      className="flex-1 accent-gold"
                    />
                    <div className="bg-background border hairline px-4 py-2 rounded-lg min-w-[80px] text-center">
                      <span className="text-xl font-bold text-gold font-display">${billAmount}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border/50 hover:border-gold/30 transition-colors">
                  <span className="text-lg font-medium text-foreground">عدد الطاولات يومياً</span>
                  <div className="flex items-center gap-4 w-full md:w-1/2">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={tablesPerDay}
                      onChange={(e) => setTablesPerDay(Number(e.target.value))}
                      className="flex-1 accent-gold"
                    />
                    <div className="bg-background border hairline px-4 py-2 rounded-lg min-w-[80px] text-center">
                      <span className="text-xl font-bold text-gold font-display">{tablesPerDay}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-xl bg-card/50 border border-border/30 opacity-80">
                  <span className="text-lg font-medium text-muted-foreground">زيادة متوقعة في الطلب</span>
                  <span className="text-xl font-bold text-muted-foreground font-display">20%</span>
                </div>
              </div>

              <div className="h-px bg-border/60 w-full" />

              {/* Results */}
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center text-xl">
                  <span className="text-foreground font-medium">ربح إضافي يومي</span>
                  <span className="text-gold font-bold font-display">${dailyIncrease.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xl">
                  <span className="text-foreground font-medium">ربح إضافي شهري</span>
                  <span className="text-gold font-bold font-display">${monthlyIncrease.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-3xl font-bold pt-6 border-t border-gold/20 mt-2">
                  <span className="text-gold">ربح إضافي سنوي</span>
                  <span className="text-gold font-display">${yearlyIncrease.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mt-12 p-6 bg-gold/10 border border-gold/30 rounded-xl text-center space-y-2">
              <p className="text-lg text-foreground/90 font-medium">هذا الرقم الذي أمامك الآن —</p>
              <p className="text-2xl font-bold text-gold">هو ما يتركه مطعمك على الطاولة كل عام.<br/>بلا سبب.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8 - المميزات الكاملة */}
      <section id="features" className="py-20 md:py-32 relative">
        <div className="radial-glow absolute inset-0 opacity-20 pointer-events-none" />
        <div className="container space-y-16 reveal relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold">كل ما يحتاجه مطعمك — في مكان واحد</h2>
          </div>

          <div className="max-w-full lg:px-10 mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            {[
              "منيو رقمي ثلاثي الأبعاد مع AR",
              "طلب ذكي بالـ QR بدون تطبيق إضافي",
              "Taste DNA — الذكاء الاصطناعي يعرف ذوق زبونك",
              "Mood Menu — توصيات حسب المزاج والوقت",
              "3D Snap — صور تفاعلية لكل طبق",
              "Kitchen Pulse — تواصل مباشر بين الطلب والمطبخ",
              "تحليلات حية — اعرف ما يُطلب وما لا يُطلب",
              "تحديث المنيو في الوقت الفعلي",
              "دعم ثنائي اللغة عربي/إنجليزي",
              "هوية بصرية للمطعم داخل النظام",
              "Custom Domain لمطعمك",
              "API كامل للتكامل مع أنظمتك",
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-card/40 border border-border/40 hover:bg-card hover:border-gold/30 transition-all duration-300 shadow-sm">
                <span className="text-gold text-xl">✦</span>
                <span className="text-lg text-foreground/90 font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 9 - الأسعار */}
      <section id="pricing" className="py-20 md:py-32 bg-card/40 border-y border-border/40">
        <div className="container space-y-16 reveal">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              استثمار بحجم فنجان قهوة يومياً —<br/>
              <span className="text-gold">عائده يغيّر مطعمك كاملاً</span>
            </h2>
          </div>

          <div className="flex justify-center gap-4 mb-4">
            <button
              onClick={() => setPricingMode("monthly")}
              className={`px-8 py-3 rounded-xl font-bold text-lg transition-all duration-300 ${
                pricingMode === "monthly"
                  ? "bg-gold text-background shadow-lg shadow-gold/20"
                  : "bg-card border hairline text-foreground hover:border-gold/50"
              }`}
            >
              شهري
            </button>
            <button
              onClick={() => setPricingMode("yearly")}
              className={`px-8 py-3 rounded-xl font-bold text-lg transition-all duration-300 flex items-center gap-2 ${
                pricingMode === "yearly"
                  ? "bg-gold text-background shadow-lg shadow-gold/20"
                  : "bg-card border hairline text-foreground hover:border-gold/50"
              }`}
            >
              سنوي — وفّر 20%
            </button>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-full lg:px-10 mx-auto items-start">
            {/* خطة البداية */}
            <div className="p-8 rounded-2xl border bg-background border-border/50 hover:border-gold/40 transition-all shadow-lg flex flex-col h-full">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-foreground">البداية</h3>
                <p className="text-lg text-muted-foreground font-display">Starter</p>
              </div>
              <div className="mb-8">
                <p className="text-4xl font-bold text-gold font-display">
                  ${pricingMode === "monthly" ? "29" : "278"}
                </p>
                <p className="text-sm text-muted-foreground mt-2 font-medium">
                  / {pricingMode === "monthly" ? "شهرياً" : "سنوياً"}
                </p>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {[
                  "حق 50 طبق",
                  "باركود غير محدود",
                  "منيو رقمي ثنائي اللغة",
                  "تحديث فوري للمنيو",
                  "Kitchen Pulse أساسي",
                  "هوية بصرية",
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" strokeWidth={3} />
                    <span className="text-foreground/90 font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button onClick={() => navigate("/subscribe")} className="w-full h-14 bg-card border hairline hover:bg-gold hover:border-gold text-foreground hover:text-background font-bold text-lg transition-all rounded-xl mt-auto">
                ابدأ مجاناً 3 أيام
              </Button>
            </div>

            {/* خطة الاحتراف */}
            <div className="p-8 rounded-2xl border bg-gold/5 border-gold/50 ring-4 ring-gold/20 scale-105 transition-all shadow-2xl flex flex-col h-full relative z-10">
              <div className="absolute -top-4 inset-x-0 flex justify-center">
                <span className="bg-gold text-background text-sm font-bold px-4 py-1.5 rounded-full shadow-md">
                  ⭐ الأكثر طلباً
                </span>
              </div>
              <div className="mb-6 mt-2">
                <h3 className="text-2xl font-bold text-foreground">الاحتراف</h3>
                <p className="text-lg text-gold font-display">Pro</p>
              </div>
              <div className="mb-8">
                <p className="text-5xl font-bold text-gold font-display drop-shadow-sm">
                  ${pricingMode === "monthly" ? "79" : "758"}
                </p>
                <p className="text-sm text-foreground/70 mt-2 font-medium">
                  / {pricingMode === "monthly" ? "شهرياً" : "سنوياً"}
                </p>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {[
                  "كل شيء في Starter",
                  "أطباق غير محدودة",
                  "نماذج 3D للأطباق",
                  "3D Snap",
                  "Taste DNA AI",
                  "Mood Menu",
                  "طلب بالصوت عربي",
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" strokeWidth={3} />
                    <span className="text-foreground/90 font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button onClick={() => navigate("/subscribe")} className="w-full h-14 bg-gold hover:bg-gold-soft text-background font-bold text-lg btn-press animate-pulse-glow shadow-xl shadow-gold/20 rounded-xl mt-auto">
                ابدأ مجاناً 3 أيام
              </Button>
            </div>

            {/* خطة المؤسسي */}
            <div className="p-8 rounded-2xl border bg-background border-border/50 hover:border-gold/40 transition-all shadow-lg flex flex-col h-full">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-foreground">المؤسسي</h3>
                <p className="text-lg text-muted-foreground font-display">Enterprise</p>
              </div>
              <div className="mb-8">
                <p className="text-4xl font-bold text-gold font-display">
                  ${pricingMode === "monthly" ? "199" : "1,910"}
                </p>
                <p className="text-sm text-muted-foreground mt-2 font-medium">
                  / {pricingMode === "monthly" ? "شهرياً" : "سنوياً"}
                </p>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {[
                  "كل شيء في Pro",
                  "فروع غير محدودة",
                  "نمذجة 3D من فريقنا",
                  "Custom Domain",
                  "API كامل",
                  "تحليلات سنة كاملة",
                  "مدير حساب مخصص",
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" strokeWidth={3} />
                    <span className="text-foreground/90 font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button onClick={() => navigate("/subscribe")} className="w-full h-14 bg-card border hairline hover:bg-gold hover:border-gold text-foreground hover:text-background font-bold text-lg transition-all rounded-xl mt-auto">
                ابدأ مجاناً 3 أيام
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 10 - الضمان وإزالة المخاطرة */}
      <section className="py-20 md:py-32 relative">
        <div className="container space-y-16 reveal">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold">لا مخاطرة. لا ضغط. لا تندم.</h2>
          </div>

          <div className="max-w-5xl mx-auto p-8 md:p-12 bg-card border hairline rounded-3xl space-y-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl" />
            
            <div className="space-y-6 relative z-10 text-center md:text-right">
              <p className="text-2xl md:text-3xl font-bold text-gold">٣ أيام مجانية — بدون بطاقة بنكية.</p>
              <div className="space-y-4 text-xl text-foreground/90 leading-relaxed font-medium">
                <p>افتح VISIONO في مطعمك الليلة.<br/>دع زبائنك يتفاعلون معه.<br/>شوف الفرق بعيونك.</p>
                <p>إذا لم تعجبك النتيجة — ألغِ بضغطة واحدة.<br/>لا رسوم. لا أسئلة. لا إجراءات معقدة.</p>
                <div className="p-6 bg-background rounded-xl border border-border/50 mt-6">
                  <p className="font-bold text-2xl text-foreground">
                    لكن أنت وأنا نعرف —<br/>
                    <span className="text-gold mt-2 inline-block">بعد ثلاثة أيام، لن تتخيل مطعمك بدونه.</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 pt-8 border-t border-border/50 relative z-10">
              {[
                "بدون بطاقة بنكية للتجربة",
                "إلغاء فوري في أي وقت",
                "إعداد كامل في أقل من 30 دقيقة",
                "دعم فني بالعربي على مدار الساعة",
                "تحديثات مستمرة بدون رسوم إضافية"
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-gold" strokeWidth={3} />
                  </div>
                  <span className="text-lg text-foreground/90 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 11 - الأسئلة الشائعة */}
      <section id="faq" className="py-20 md:py-32 bg-card/40 border-y border-border/40">
        <div className="container space-y-16 reveal">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold">أسئلة يسألها أصحاب المطاعم قبل البدء</h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqItems.map((item, idx) => (
              <div
                key={idx}
                className="border border-border/60 bg-background rounded-xl overflow-hidden hover:border-gold/40 transition-colors shadow-sm"
              >
                <button
                  onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                  className="w-full p-6 flex items-center justify-between hover:bg-card/30 transition-colors text-right"
                >
                  <h3 className="text-xl font-bold text-foreground flex-1 ml-4 leading-relaxed">{item.q}</h3>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${faqOpen === idx ? 'bg-gold text-background' : 'bg-card border hairline text-gold'}`}>
                    <ChevronDown
                      className={`w-5 h-5 transition-transform duration-300 ${
                        faqOpen === idx ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>
                <div 
                  className={`grid transition-all duration-300 ease-in-out ${
                    faqOpen === idx ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="p-6 pt-0 border-t border-border/30 text-lg text-foreground/80 leading-relaxed font-medium">
                      {item.a}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 12 - CTA النهائي */}
      <section className="py-24 md:py-40 relative overflow-hidden">
        <div className="radial-glow absolute inset-0 opacity-40 pointer-events-none" />
        <div className="container space-y-16 reveal relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-5xl md:text-6xl font-bold leading-tight">مطعمك يستحق أكثر من منيو ورقي</h2>
            <p className="text-2xl text-gold font-bold">
              كل يوم تنتظر — طاولاتك تخسر ما يمكن أن تكسبه
            </p>
            <div className="space-y-4">
              <p className="text-xl md:text-2xl text-foreground/90 font-medium leading-relaxed">
                أصحاب المطاعم الذين بدأوا مع VISIONO اليوم —<br/>
                يملكون غداً ميزة لن يملكها منافسهم.
              </p>
              <p className="text-2xl md:text-3xl font-bold text-foreground pt-6">
                السؤال ليس: هل أحتاج VISIONO؟<br/>
                <span className="text-gold mt-2 inline-block">السؤال هو: لماذا لم أبدأ قبل اليوم؟</span>
              </p>
            </div>
          </div>

          <div className="max-w-2xl mx-auto text-center space-y-6 pt-8">
            <Button onClick={() => navigate("/subscribe")} className="bg-gold hover:bg-gold-soft text-background font-bold text-xl md:text-2xl px-10 py-8 btn-press animate-pulse-glow w-full rounded-2xl shadow-2xl shadow-gold/20 flex flex-col items-center gap-1">
              <span>🟡 ابدأ تجربتك المجانية الآن — 3 أيام بلا أي التزام</span>
              <span className="text-sm font-medium opacity-90 block mt-1">[ جرّب VISIONO مجاناً — ابدأ الآن ]</span>
            </Button>
            <p className="text-base md:text-lg text-muted-foreground font-medium pt-4">
              بدون بطاقة بنكية · إلغاء فوري · دعم عربي 24/7
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER الصغير */}
      <footer className="border-t border-border/40 py-8 bg-background">
        <div className="container">
          <div className="flex flex-col items-center justify-center space-y-6 text-center">
            <div className="space-y-2">
              <p className="font-bold text-lg text-foreground tracking-wide">VISIONO — المنصة الذكية للمطاعم</p>
              <p className="text-sm text-muted-foreground font-medium">صُنع بشغف لأصحاب المطاعم في العالم العربي</p>
            </div>
            
            <div className="flex items-center gap-4 text-sm font-medium">
              <a href="#" className="text-muted-foreground hover:text-gold transition-colors">
                [ الشروط والأحكام ]
              </a>
              <span className="text-border/50">·</span>
              <a href="#" className="text-muted-foreground hover:text-gold transition-colors">
                [ سياسة الخصوصية ]
              </a>
              <span className="text-border/50">·</span>
              <a href="#" className="text-muted-foreground hover:text-gold transition-colors">
                [ تواصل معنا ]
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
