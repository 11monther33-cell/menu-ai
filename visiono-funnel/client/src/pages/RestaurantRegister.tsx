import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  ChefHat,
  Check,
} from "lucide-react";
import { useState } from "react";

const LOGO_URL = "/logo.png";

const cuisineOptions = [
  { value: "", label: "اختر نوع المطبخ" },
  { value: "arabic", label: "عربي" },
  { value: "italian", label: "إيطالي" },
  { value: "asian", label: "آسيوي" },
  { value: "fast-food", label: "وجبات سريعة" },
  { value: "cafe", label: "مقهى" },
  { value: "other", label: "أخرى" },
];

interface FormErrors {
  restaurantName?: string;
  cuisineType?: string;
  ownerName?: string;
  email?: string;
  phone?: string;
  city?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

const containerVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.23, 1, 0.32, 1],
      staggerChildren: 0.07,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] },
  },
};

const successVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] },
  },
};

export default function RestaurantRegister() {
  const [restaurantName, setRestaurantName] = useState("");
  const [cuisineType, setCuisineType] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!restaurantName.trim())
      newErrors.restaurantName = "اسم المطعم مطلوب";
    if (!cuisineType) newErrors.cuisineType = "يرجى اختيار نوع المطبخ";
    if (!ownerName.trim()) newErrors.ownerName = "اسم المالك مطلوب";
    if (!email.trim()) {
      newErrors.email = "البريد الإلكتروني مطلوب";
    } else if (!validateEmail(email)) {
      newErrors.email = "صيغة البريد الإلكتروني غير صحيحة";
    }
    if (!phone.trim()) newErrors.phone = "رقم الهاتف مطلوب";
    if (!city.trim()) newErrors.city = "المدينة مطلوبة";
    if (!password) {
      newErrors.password = "كلمة المرور مطلوبة";
    } else if (password.length < 6) {
      newErrors.password = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = "تأكيد كلمة المرور مطلوب";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "كلمتا المرور غير متطابقتين";
    }
    if (!termsAccepted)
      newErrors.terms = "يجب الموافقة على الشروط والأحكام";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setSubmitted(true);
    }
  };

  const inputBaseClass =
    "w-full bg-background border border-border/60 rounded-lg px-4 py-3 pr-11 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/60 transition-all duration-200 text-right";

  const renderInput = (
    icon: React.ReactNode,
    placeholder: string,
    value: string,
    onChange: (val: string) => void,
    type: string = "text",
    error?: string,
    isPassword?: boolean,
    showPw?: boolean,
    togglePw?: () => void
  ) => (
    <div className="space-y-1.5">
      <div className="relative">
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70">
          {icon}
        </span>
        <input
          type={isPassword ? (showPw ? "text" : "password") : type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputBaseClass} ${error ? "border-ember/60 focus:ring-ember/30" : ""}`}
          dir="rtl"
        />
        {isPassword && togglePw && (
          <button
            type="button"
            onClick={togglePw}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-gold transition-colors"
          >
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-ember text-xs pr-1"
        >
          {error}
        </motion.p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex items-center justify-center relative overflow-hidden py-12 px-4">
      {/* Radial glow background */}
      <div className="radial-glow absolute inset-0 opacity-40" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(circle at 30% 70%, oklch(0.80 0.155 75 / 0.08), transparent 50%), radial-gradient(circle at 70% 30%, oklch(0.80 0.155 75 / 0.06), transparent 50%)",
        }}
      />

      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key="form"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -30, transition: { duration: 0.4 } }}
            className="relative z-10 w-full max-w-2xl"
          >
            {/* Card */}
            <div className="bg-card border hairline rounded-2xl p-8 md:p-10 shadow-2xl">
              {/* Logo */}
              <motion.div variants={itemVariants} className="flex justify-center mb-6">
                <img src={LOGO_URL} alt="VISIONO" className="h-14 w-auto" />
              </motion.div>

              {/* Title */}
              <motion.div variants={itemVariants} className="text-center mb-8 space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  تسجيل مطعم جديد
                </h1>
                <p className="text-muted-foreground text-sm md:text-base">
                  أنشئ حسابك وابدأ رحلتك مع{" "}
                  <span className="text-gold font-display font-semibold">VISIONO</span>
                </p>
              </motion.div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 2-column grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-semibold text-foreground/90 mb-1.5 text-right">
                      اسم المطعم
                    </label>
                    {renderInput(
                      <Building2 className="w-4 h-4" />,
                      "مثال: مطعم الذهبي",
                      restaurantName,
                      setRestaurantName,
                      "text",
                      errors.restaurantName
                    )}
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-semibold text-foreground/90 mb-1.5 text-right">
                      نوع المطبخ
                    </label>
                    <div className="space-y-1.5">
                      <div className="relative">
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70">
                          <ChefHat className="w-4 h-4" />
                        </span>
                        <select
                          value={cuisineType}
                          onChange={(e) => setCuisineType(e.target.value)}
                          className={`${inputBaseClass} appearance-none ${
                            errors.cuisineType ? "border-ember/60 focus:ring-ember/30" : ""
                          } ${!cuisineType ? "text-muted-foreground/60" : ""}`}
                          dir="rtl"
                        >
                          {cuisineOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors.cuisineType && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-ember text-xs pr-1"
                        >
                          {errors.cuisineType}
                        </motion.p>
                      )}
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-semibold text-foreground/90 mb-1.5 text-right">
                      اسم المالك
                    </label>
                    {renderInput(
                      <User className="w-4 h-4" />,
                      "الاسم الكامل",
                      ownerName,
                      setOwnerName,
                      "text",
                      errors.ownerName
                    )}
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-semibold text-foreground/90 mb-1.5 text-right">
                      البريد الإلكتروني
                    </label>
                    {renderInput(
                      <Mail className="w-4 h-4" />,
                      "email@example.com",
                      email,
                      setEmail,
                      "email",
                      errors.email
                    )}
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-semibold text-foreground/90 mb-1.5 text-right">
                      رقم الهاتف
                    </label>
                    {renderInput(
                      <Phone className="w-4 h-4" />,
                      "+966 5XX XXX XXXX",
                      phone,
                      setPhone,
                      "tel",
                      errors.phone
                    )}
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-semibold text-foreground/90 mb-1.5 text-right">
                      المدينة
                    </label>
                    {renderInput(
                      <MapPin className="w-4 h-4" />,
                      "مثال: الرياض",
                      city,
                      setCity,
                      "text",
                      errors.city
                    )}
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-semibold text-foreground/90 mb-1.5 text-right">
                      كلمة المرور
                    </label>
                    {renderInput(
                      <Lock className="w-4 h-4" />,
                      "••••••••",
                      password,
                      setPassword,
                      "password",
                      errors.password,
                      true,
                      showPassword,
                      () => setShowPassword(!showPassword)
                    )}
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-semibold text-foreground/90 mb-1.5 text-right">
                      تأكيد كلمة المرور
                    </label>
                    {renderInput(
                      <Lock className="w-4 h-4" />,
                      "••••••••",
                      confirmPassword,
                      setConfirmPassword,
                      "password",
                      errors.confirmPassword,
                      true,
                      showConfirmPassword,
                      () => setShowConfirmPassword(!showConfirmPassword)
                    )}
                  </motion.div>
                </div>

                {/* Terms checkbox */}
                <motion.div variants={itemVariants} className="space-y-1.5">
                  <label className="flex items-center gap-3 cursor-pointer group text-right" dir="rtl">
                    <div className="relative flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                          termsAccepted
                            ? "bg-gold border-gold"
                            : "border-border/80 group-hover:border-gold/50"
                        } ${errors.terms ? "border-ember/60" : ""}`}
                      >
                        {termsAccepted && <Check className="w-3 h-3 text-background" />}
                      </div>
                    </div>
                    <span className="text-sm text-foreground/80">
                      أوافق على{" "}
                      <a href="#" className="text-gold hover:text-gold-soft underline underline-offset-2">
                        الشروط والأحكام
                      </a>{" "}
                      و
                      <a href="#" className="text-gold hover:text-gold-soft underline underline-offset-2">
                        سياسة الخصوصية
                      </a>
                    </span>
                  </label>
                  {errors.terms && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-ember text-xs pr-1"
                    >
                      {errors.terms}
                    </motion.p>
                  )}
                </motion.div>

                {/* Submit button */}
                <motion.div variants={itemVariants}>
                  <Button
                    type="submit"
                    className="w-full bg-gold hover:bg-gold-soft text-background font-bold text-lg py-6 btn-press animate-pulse-glow rounded-xl"
                  >
                    إنشاء حساب
                  </Button>
                </motion.div>

                {/* Divider */}
                <motion.div variants={itemVariants} className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-border/40" />
                  <span className="text-muted-foreground text-sm">أو</span>
                  <div className="flex-1 h-px bg-border/40" />
                </motion.div>

                {/* Login link */}
                <motion.div variants={itemVariants} className="text-center">
                  <p className="text-sm text-muted-foreground">
                    لديك حساب بالفعل؟{" "}
                    <a
                      href="#"
                      className="text-gold hover:text-gold-soft font-semibold underline underline-offset-2 transition-colors"
                    >
                      تسجيل الدخول
                    </a>
                  </p>
                </motion.div>
              </form>
            </div>

            {/* Footer note */}
            <motion.p
              variants={itemVariants}
              className="text-center text-xs text-muted-foreground/60 mt-6"
            >
              هذه الصفحة مخصصة لأصحاب المطاعم
            </motion.p>
          </motion.div>
        ) : (
          /* Success state */
          <motion.div
            key="success"
            variants={successVariants}
            initial="hidden"
            animate="visible"
            className="relative z-10 w-full max-w-md"
          >
            <div className="bg-card border hairline rounded-2xl p-10 md:p-12 shadow-2xl text-center space-y-6">
              {/* Animated checkmark */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.2,
                }}
                className="mx-auto w-20 h-20 rounded-full bg-gold/15 border-2 border-gold/40 flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 250,
                    damping: 20,
                    delay: 0.4,
                  }}
                >
                  <Check className="w-10 h-10 text-gold" />
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-3"
              >
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  تم إنشاء حسابك بنجاح!
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  مرحباً بك في{" "}
                  <span className="text-gold font-display font-semibold">VISIONO</span>
                  <br />
                  سيتم التواصل معك خلال 24 ساعة لإعداد مطعمك
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <div className="p-4 bg-gold/10 border border-gold/25 rounded-xl space-y-1">
                  <p className="text-sm font-semibold text-gold">
                    {restaurantName}
                  </p>
                  <p className="text-xs text-muted-foreground">{email}</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <Button
                  onClick={() => setSubmitted(false)}
                  variant="outline"
                  className="border-gold/30 text-gold hover:bg-gold/10 hover:text-gold font-semibold"
                >
                  العودة إلى التسجيل
                </Button>
              </motion.div>

              {/* Logo */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
              >
                <img
                  src={LOGO_URL}
                  alt="VISIONO"
                  className="h-8 w-auto mx-auto opacity-40"
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
