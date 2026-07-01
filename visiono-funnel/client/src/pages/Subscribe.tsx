import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Building2,
  User,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { useLocation } from "wouter";

const LOGO_URL = "/logo.png";

/* ───────── Types ───────── */
interface FormData {
  restaurantName: string;
  cuisineType: string;
  branches: string;
  city: string;
  fullName: string;
  phone: string;
  email: string;
  selectedPlan: "starter" | "pro" | "enterprise";
  billingCycle: "monthly" | "yearly";
  agreedToTerms: boolean;
}

/* ───────── Step metadata ───────── */
const steps = [
  { id: 1, label: "معلومات المطعم", icon: Building2 },
  { id: 2, label: "معلومات المالك", icon: User },
  { id: 3, label: "اختيار الخطة", icon: CreditCard },
  { id: 4, label: "التأكيد", icon: CheckCircle2 },
] as const;

/* ───────── Plan data ───────── */
const plans = [
  {
    key: "starter" as const,
    name: "البداية",
    subtitle: "Starter",
    monthlyPrice: 29,
    yearlyPrice: 278,
    features: [
      "حتى 50 طبق",
      "باركود غير محدود",
      "منيو رقمي ثنائي اللغة",
      "تحديث فوري للمنيو",
      "Kitchen Pulse أساسي",
    ],
    featured: false,
  },
  {
    key: "pro" as const,
    name: "الاحتراف",
    subtitle: "Pro",
    monthlyPrice: 79,
    yearlyPrice: 758,
    features: [
      "كل شيء في Starter",
      "أطباق غير محدودة",
      "نماذج 3D للأطباق",
      "Taste DNA AI",
      "Mood Menu",
      "طلب بالصوت عربي",
    ],
    featured: true,
  },
  {
    key: "enterprise" as const,
    name: "المؤسسي",
    subtitle: "Enterprise",
    monthlyPrice: 199,
    yearlyPrice: 1910,
    features: [
      "كل شيء في Pro",
      "فروع غير محدودة",
      "نمذجة 3D من فريقنا",
      "Custom Domain",
      "API كامل",
      "مدير حساب مخصص",
    ],
    featured: false,
  },
];

const cuisineOptions = [
  "عربي",
  "إيطالي",
  "آسيوي",
  "وجبات سريعة",
  "مقهى",
  "أخرى",
];

/* ───────── Animations ───────── */
const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 80 : -80,
    opacity: 0,
    scale: 0.97,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (dir: number) => ({
    x: dir < 0 ? 80 : -80,
    opacity: 0,
    scale: 0.97,
  }),
};

/* ═══════════════════════════════════════════════════════════════
   SUBSCRIBE PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function Subscribe() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<FormData>({
    restaurantName: "",
    cuisineType: "",
    branches: "",
    city: "",
    fullName: "",
    phone: "",
    email: "",
    selectedPlan: "pro",
    billingCycle: "monthly",
    agreedToTerms: false,
  });

  /* ── helpers ── */
  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const errs: Record<string, string> = {};
    if (step === 1) {
      if (!form.restaurantName.trim()) errs.restaurantName = "مطلوب";
      if (!form.cuisineType) errs.cuisineType = "مطلوب";
      if (!form.branches.trim()) errs.branches = "مطلوب";
      if (!form.city.trim()) errs.city = "مطلوب";
    } else if (step === 2) {
      if (!form.fullName.trim()) errs.fullName = "مطلوب";
      if (!form.phone.trim()) errs.phone = "مطلوب";
      if (!form.email.trim()) errs.email = "مطلوب";
      else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "بريد غير صحيح";
    } else if (step === 4) {
      if (!form.agreedToTerms) errs.agreedToTerms = "يجب الموافقة";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goNext = () => {
    if (!validateStep(currentStep)) return;
    setDirection(1);
    setCurrentStep((s) => Math.min(s + 1, 4));
  };

  const goPrev = () => {
    setDirection(-1);
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = () => {
    if (!validateStep(4)) return;
    setSubmitted(true);
  };

  /* ── label helper ── */
  const Label = ({
    children,
    error,
  }: {
    children: React.ReactNode;
    error?: string;
  }) => (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-foreground/90">
        {children}
      </label>
      {error && (
        <p className="text-xs text-ember font-medium animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );

  /* ────────────────────────────────────────────────────────────
     STEP RENDERERS
     ──────────────────────────────────────────────────────────── */

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold text-foreground">معلومات المطعم</h2>
        <p className="text-sm text-muted-foreground">
          أخبرنا عن مطعمك لنجهز لك التجربة المثالية
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label error={errors.restaurantName}>اسم المطعم</Label>
          <Input
            placeholder="مثال: مطعم الديرة"
            value={form.restaurantName}
            onChange={(e) => update("restaurantName", e.target.value)}
            className="h-11 text-right bg-background border-input focus-visible:border-gold focus-visible:ring-gold/30"
          />
        </div>

        <div className="space-y-2">
          <Label error={errors.cuisineType}>نوع المطبخ</Label>
          <Select
            value={form.cuisineType}
            onValueChange={(v) => update("cuisineType", v)}
          >
            <SelectTrigger className="h-11 w-full text-right bg-background border-input focus-visible:border-gold focus-visible:ring-gold/30">
              <SelectValue placeholder="اختر نوع المطبخ" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {cuisineOptions.map((opt) => (
                <SelectItem key={opt} value={opt} className="text-right">
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label error={errors.branches}>عدد الفروع</Label>
            <Input
              type="number"
              min={1}
              placeholder="1"
              value={form.branches}
              onChange={(e) => update("branches", e.target.value)}
              className="h-11 text-right bg-background border-input focus-visible:border-gold focus-visible:ring-gold/30"
            />
          </div>
          <div className="space-y-2">
            <Label error={errors.city}>المدينة</Label>
            <Input
              placeholder="مثال: دبي"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              className="h-11 text-right bg-background border-input focus-visible:border-gold focus-visible:ring-gold/30"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold text-foreground">معلومات المالك</h2>
        <p className="text-sm text-muted-foreground">
          بياناتك الشخصية للتواصل معك
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label error={errors.fullName}>الاسم الكامل</Label>
          <Input
            placeholder="مثال: أحمد محمد"
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            className="h-11 text-right bg-background border-input focus-visible:border-gold focus-visible:ring-gold/30"
          />
        </div>

        <div className="space-y-2">
          <Label error={errors.phone}>رقم الهاتف / واتساب</Label>
          <Input
            type="tel"
            dir="ltr"
            placeholder="+971 50 000 0000"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className="h-11 text-left bg-background border-input focus-visible:border-gold focus-visible:ring-gold/30"
          />
        </div>

        <div className="space-y-2">
          <Label error={errors.email}>البريد الإلكتروني</Label>
          <Input
            type="email"
            dir="ltr"
            placeholder="name@restaurant.com"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className="h-11 text-left bg-background border-input focus-visible:border-gold focus-visible:ring-gold/30"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold text-foreground">اختيار الخطة</h2>
        <p className="text-sm text-muted-foreground">
          اختر الخطة المناسبة لمطعمك
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => update("billingCycle", "monthly")}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
            form.billingCycle === "monthly"
              ? "bg-gold text-background shadow-lg shadow-gold/25"
              : "bg-card border hairline text-foreground hover:border-gold/50"
          }`}
        >
          شهري
        </button>
        <button
          onClick={() => update("billingCycle", "yearly")}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
            form.billingCycle === "yearly"
              ? "bg-gold text-background shadow-lg shadow-gold/25"
              : "bg-card border hairline text-foreground hover:border-gold/50"
          }`}
        >
          سنوي — وفّر 20%
        </button>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isSelected = form.selectedPlan === plan.key;
          const price =
            form.billingCycle === "monthly"
              ? plan.monthlyPrice
              : plan.yearlyPrice;
          return (
            <motion.button
              key={plan.key}
              type="button"
              onClick={() => update("selectedPlan", plan.key)}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              className={`relative p-5 rounded-xl text-right transition-all duration-300 ${
                isSelected
                  ? "bg-gold/10 ring-2 ring-gold shadow-lg shadow-gold/20"
                  : "bg-card border hairline hover:border-gold/40"
              } ${plan.featured && !isSelected ? "ring-1 ring-gold/30" : ""}`}
            >
              {/* Recommended badge */}
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-gold text-background text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    ⭐ الأكثر طلباً
                  </span>
                </div>
              )}

              {/* Selected check */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 left-3 w-6 h-6 bg-gold rounded-full flex items-center justify-center"
                >
                  <Check className="w-3.5 h-3.5 text-background" />
                </motion.div>
              )}

              <div className="space-y-3 pt-1">
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-muted-foreground font-display">
                    {plan.subtitle}
                  </p>
                </div>

                <div>
                  <p className="text-3xl font-bold text-gold font-display">
                    ${price}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {form.billingCycle === "monthly" ? "/ شهرياً" : "/ سنوياً"}
                  </p>
                </div>

                <ul className="space-y-2 pt-2 border-t border-border/40">
                  {plan.features.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs text-foreground/80"
                    >
                      <Check className="w-3.5 h-3.5 text-gold flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Free trial note */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center p-3 rounded-lg bg-gold/5 border border-gold/20"
      >
        <p className="text-sm text-gold font-semibold">
          🎁 3 أيام مجانية — بدون بطاقة بنكية
        </p>
      </motion.div>
    </div>
  );

  const renderStep4 = () => {
    const selectedPlan = plans.find((p) => p.key === form.selectedPlan)!;
    const price =
      form.billingCycle === "monthly"
        ? selectedPlan.monthlyPrice
        : selectedPlan.yearlyPrice;

    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold text-foreground">
            تأكيد الاشتراك
          </h2>
          <p className="text-sm text-muted-foreground">
            راجع بياناتك قبل البدء
          </p>
        </div>

        {/* Summary cards */}
        <div className="space-y-4">
          {/* Restaurant */}
          <div className="p-4 rounded-lg bg-card border hairline space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-gold" />
              <h3 className="text-sm font-bold text-gold">معلومات المطعم</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground text-xs">
                  اسم المطعم
                </span>
                <p className="text-foreground font-medium">
                  {form.restaurantName}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">
                  نوع المطبخ
                </span>
                <p className="text-foreground font-medium">
                  {form.cuisineType}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">
                  عدد الفروع
                </span>
                <p className="text-foreground font-medium">{form.branches}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">المدينة</span>
                <p className="text-foreground font-medium">{form.city}</p>
              </div>
            </div>
          </div>

          {/* Owner */}
          <div className="p-4 rounded-lg bg-card border hairline space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-gold" />
              <h3 className="text-sm font-bold text-gold">معلومات المالك</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground text-xs">
                  الاسم الكامل
                </span>
                <p className="text-foreground font-medium">{form.fullName}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">الهاتف</span>
                <p className="text-foreground font-medium font-display" dir="ltr">
                  {form.phone}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground text-xs">
                  البريد الإلكتروني
                </span>
                <p className="text-foreground font-medium font-display" dir="ltr">
                  {form.email}
                </p>
              </div>
            </div>
          </div>

          {/* Plan */}
          <div className="p-4 rounded-lg bg-gold/8 border border-gold/25 space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-gold" />
              <h3 className="text-sm font-bold text-gold">الخطة المختارة</h3>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-2xl font-bold text-gold font-display">
                  ${price}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {form.billingCycle === "monthly" ? "/ شهرياً" : "/ سنوياً"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-foreground">
                  {selectedPlan.name}
                </p>
                <p className="text-xs text-muted-foreground font-display">
                  {selectedPlan.subtitle}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="space-y-2">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-card border hairline">
            <Checkbox
              id="terms"
              checked={form.agreedToTerms}
              onCheckedChange={(checked) =>
                update("agreedToTerms", checked === true)
              }
              className="mt-0.5 border-gold/50 data-[state=checked]:bg-gold data-[state=checked]:border-gold"
            />
            <label
              htmlFor="terms"
              className="text-sm text-foreground/80 cursor-pointer leading-relaxed"
            >
              أوافق على{" "}
              <span className="text-gold underline underline-offset-2">
                الشروط والأحكام
              </span>{" "}
              و{" "}
              <span className="text-gold underline underline-offset-2">
                سياسة الخصوصية
              </span>
            </label>
          </div>
          {errors.agreedToTerms && (
            <p className="text-xs text-ember font-medium text-center animate-in fade-in">
              {errors.agreedToTerms}
            </p>
          )}
        </div>

        {/* Submit button */}
        <Button
          onClick={handleSubmit}
          className="w-full h-13 bg-gold hover:bg-gold-soft text-background font-bold text-base btn-press animate-pulse-glow rounded-xl"
        >
          ابدأ تجربتك المجانية
          <ArrowRight className="w-5 h-5 mr-2 rotate-180" />
        </Button>
      </div>
    );
  };

  /* ────────────────────────────────────────────────────────────
     SUCCESS STATE
     ──────────────────────────────────────────────────────────── */
  if (submitted) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans flex items-center justify-center p-4">
        <div className="radial-glow fixed inset-0 opacity-40" />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.7 }}
          className="relative z-10 max-w-md w-full text-center space-y-8 p-8"
        >
          {/* Animated check circle */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2, stiffness: 200 }}
            className="mx-auto w-24 h-24 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.4, stiffness: 260 }}
            >
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <h1 className="text-3xl font-bold text-foreground">
              🎉 مرحباً بك في عائلة VISIONO!
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              سنتواصل معك خلال 24 ساعة لإعداد مطعمك
              <br />
              <span className="text-gold font-semibold">
                {form.restaurantName}
              </span>{" "}
              على منصة VISIONO
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-3"
          >
            <div className="p-4 rounded-lg bg-card border hairline text-sm text-muted-foreground space-y-1">
              <p>
                📧 سيصلك بريد تأكيد على{" "}
                <span className="text-foreground font-display" dir="ltr">
                  {form.email}
                </span>
              </p>
              <p>
                📱 وسنتصل بك على{" "}
                <span className="text-foreground font-display" dir="ltr">
                  {form.phone}
                </span>
              </p>
            </div>

            <Button
              onClick={() => setLocation("/")}
              className="w-full h-12 bg-gold hover:bg-gold-soft text-background font-bold btn-press rounded-xl"
            >
              العودة للصفحة الرئيسية
              <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  /* ────────────────────────────────────────────────────────────
     MAIN RENDER
     ──────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-background text-foreground font-sans" dir="rtl">
      <div className="radial-glow fixed inset-0 opacity-30 pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 md:py-12">
        {/* Back to home */}
        <motion.button
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors mb-8 group"
        >
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          <span>العودة للرئيسية</span>
        </motion.button>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-10"
        >
          <img src={LOGO_URL} alt="VISIONO" className="h-14 w-auto" />
        </motion.div>

        {/* ── Progress bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <div className="flex items-center justify-between relative">
            {/* Background line */}
            <div className="absolute top-5 right-[calc(12.5%)] left-[calc(12.5%)] h-[2px] bg-border/60" />
            {/* Active line */}
            <motion.div
              className="absolute top-5 right-[calc(12.5%)] h-[2px] bg-gold"
              initial={false}
              animate={{
                width: `${((currentStep - 1) / (steps.length - 1)) * 75}%`,
              }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            />

            {steps.map((step) => {
              const isActive = currentStep >= step.id;
              const isCurrent = currentStep === step.id;
              const StepIcon = step.icon;
              return (
                <div
                  key={step.id}
                  className="flex flex-col items-center relative z-10 flex-1"
                >
                  <motion.div
                    animate={{
                      scale: isCurrent ? 1.1 : 1,
                      backgroundColor: isActive
                        ? "oklch(0.80 0.155 75)"
                        : "oklch(0.205 0.013 60)",
                    }}
                    transition={{ duration: 0.3 }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                      isActive
                        ? "border-gold shadow-lg shadow-gold/20"
                        : "border-border/60"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check
                        className={`w-4 h-4 ${
                          isActive ? "text-background" : "text-muted-foreground"
                        }`}
                      />
                    ) : (
                      <StepIcon
                        className={`w-4 h-4 ${
                          isActive ? "text-background" : "text-muted-foreground"
                        }`}
                      />
                    )}
                  </motion.div>
                  <span
                    className={`text-[10px] mt-2 font-medium transition-colors duration-300 whitespace-nowrap ${
                      isActive ? "text-gold" : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Step content card ── */}
        <div className="relative overflow-hidden rounded-2xl border hairline bg-card/70 backdrop-blur-sm p-6 md:p-8 min-h-[420px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                duration: 0.4,
                ease: [0.23, 1, 0.32, 1],
              }}
            >
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Navigation buttons ── */}
        {currentStep < 4 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between mt-6 gap-4"
          >
            {/* Previous button */}
            {currentStep > 1 ? (
              <Button
                variant="outline"
                onClick={goPrev}
                className="h-11 px-6 border-border/60 hover:border-gold/50 hover:bg-gold/5 text-foreground/80 btn-press rounded-xl"
              >
                <ChevronRight className="w-4 h-4 ml-1" />
                السابق
              </Button>
            ) : (
              <div />
            )}

            {/* Next button */}
            <Button
              onClick={goNext}
              className="h-11 px-8 bg-gold hover:bg-gold-soft text-background font-bold btn-press rounded-xl"
            >
              التالي
              <ChevronLeft className="w-4 h-4 mr-1" />
            </Button>
          </motion.div>
        )}

        {/* Step indicator */}
        <div className="text-center mt-6">
          <span className="text-xs text-muted-foreground font-display">
            {currentStep} / {steps.length}
          </span>
        </div>
      </div>
    </div>
  );
}
