import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Shield } from "lucide-react";
import { useState } from "react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    if (!email.includes("@")) {
      setError("يرجى إدخال بريد إلكتروني صالح");
      return;
    }

    setIsSubmitting(true);
    // Simulate a login attempt (no backend)
    setTimeout(() => {
      setIsSubmitting(false);
      setError("تعذر الاتصال بالخادم. حاول مرة أخرى لاحقاً.");
    }, 1500);
  };

  return (
    <div
      dir="rtl"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: "oklch(0.13 0.012 60)" }}
    >
      {/* Radial glow behind card */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 600px 500px at 50% 45%, oklch(0.80 0.155 75 / 0.07), transparent 70%)",
        }}
      />

      {/* Subtle grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.80 0.155 75 / 0.3) 1px, transparent 1px), linear-gradient(90deg, oklch(0.80 0.155 75 / 0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Card */}
        <div
          className="rounded-2xl border p-8 sm:p-10 backdrop-blur-sm"
          style={{
            background: "oklch(0.17 0.01 60 / 0.85)",
            borderColor: "oklch(0.80 0.155 75 / 0.15)",
            boxShadow:
              "0 0 80px oklch(0.80 0.155 75 / 0.04), 0 25px 50px -12px oklch(0 0 0 / 0.5)",
          }}
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img
              src={LOGO_URL}
              alt="VISIONO"
              className="h-10 w-auto opacity-90"
            />
          </div>

          {/* Shield icon */}
          <div className="flex justify-center mb-4">
            <div
              className="flex items-center justify-center w-12 h-12 rounded-full"
              style={{
                background: "oklch(0.80 0.155 75 / 0.1)",
                border: "1px solid oklch(0.80 0.155 75 / 0.2)",
              }}
            >
              <Shield
                className="w-5 h-5"
                style={{ color: "oklch(0.80 0.155 75)" }}
              />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1
              className="text-2xl font-display font-bold mb-1"
              style={{ color: "oklch(0.93 0.01 75)" }}
            >
              لوحة تحكم الأدمن
            </h1>
            <p
              className="text-sm"
              style={{ color: "oklch(0.65 0.02 75)" }}
            >
              تسجيل الدخول
            </p>
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6 rounded-lg px-4 py-3 text-sm text-right"
              style={{
                background: "oklch(0.30 0.08 25 / 0.4)",
                border: "1px solid oklch(0.55 0.15 25 / 0.4)",
                color: "oklch(0.80 0.12 25)",
              }}
            >
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email field */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-right"
                style={{ color: "oklch(0.75 0.02 75)" }}
              >
                البريد الإلكتروني
              </label>
              <div className="relative">
                <div
                  className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  <Mail
                    className="w-4 h-4"
                    style={{ color: "oklch(0.55 0.03 75)" }}
                  />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@visiono.com"
                  dir="ltr"
                  className="w-full rounded-lg py-3 pr-10 pl-4 text-sm text-right outline-none transition-all duration-200"
                  style={{
                    background: "oklch(0.14 0.008 60)",
                    border: "1px solid oklch(0.30 0.01 60)",
                    color: "oklch(0.90 0.01 75)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "oklch(0.80 0.155 75 / 0.5)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px oklch(0.80 0.155 75 / 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "oklch(0.30 0.01 60)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-right"
                style={{ color: "oklch(0.75 0.02 75)" }}
              >
                كلمة المرور
              </label>
              <div className="relative">
                <div
                  className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  <Lock
                    className="w-4 h-4"
                    style={{ color: "oklch(0.55 0.03 75)" }}
                  />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full rounded-lg py-3 pr-10 pl-10 text-sm text-right outline-none transition-all duration-200"
                  style={{
                    background: "oklch(0.14 0.008 60)",
                    border: "1px solid oklch(0.30 0.01 60)",
                    color: "oklch(0.90 0.01 75)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "oklch(0.80 0.155 75 / 0.5)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px oklch(0.80 0.155 75 / 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "oklch(0.30 0.01 60)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 flex items-center pl-3 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff
                      className="w-4 h-4 transition-colors duration-200 hover:opacity-80"
                      style={{ color: "oklch(0.55 0.03 75)" }}
                    />
                  ) : (
                    <Eye
                      className="w-4 h-4 transition-colors duration-200 hover:opacity-80"
                      style={{ color: "oklch(0.55 0.03 75)" }}
                    />
                  )}
                </button>
              </div>
            </div>

            {/* Login button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="btn-press w-full rounded-lg py-3 text-sm font-bold transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: "oklch(0.80 0.155 75)",
                color: "oklch(0.15 0.01 60)",
                height: "48px",
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.background = "oklch(0.75 0.14 75)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "oklch(0.80 0.155 75)";
              }}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="inline-block w-4 h-4 rounded-full border-2 border-current border-t-transparent"
                  />
                  جارٍ تسجيل الدخول...
                </span>
              ) : (
                "تسجيل الدخول"
              )}
            </Button>
          </form>

          {/* Forgot password link */}
          <div className="mt-5 text-center">
            <button
              type="button"
              className="text-xs cursor-pointer transition-colors duration-200"
              style={{ color: "oklch(0.65 0.08 75)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "oklch(0.80 0.155 75)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "oklch(0.65 0.08 75)";
              }}
              onClick={() => {
                // No-op — placeholder
              }}
            >
              نسيت كلمة المرور؟
            </button>
          </div>
        </div>

        {/* Footer text */}
        <p
          className="mt-6 text-center text-xs"
          style={{ color: "oklch(0.45 0.02 75)" }}
        >
          هذه الصفحة مخصصة للمسؤولين فقط
        </p>
      </motion.div>
    </div>
  );
}
