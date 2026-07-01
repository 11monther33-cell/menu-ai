import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Menu, X, Globe, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';

export const Navbar = () => {
  const { lang, setLang, t, isRtl } = useLanguage();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: t('nav.features'), href: '#features' },
    { name: t('nav.benefits'), href: '#benefits' },
    { name: t('nav.pricing'), href: '#pricing' },
  ];

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-main/90 backdrop-blur-md py-3 border-b border-white/5' : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="VISIONO" className="h-10 object-contain" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link, i) => (
              <a 
                key={`nav-link-${i}-${link.name}`} 
                href={link.href}
                className="text-muted/80 hover:text-gold transition-colors text-sm uppercase tracking-wider font-medium"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-2 text-muted/80 hover:text-text transition-colors px-3 py-2 rounded-lg hover:bg-surface-2 text-sm uppercase tracking-wider font-medium"
            >
              <Globe size={16} />
              <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
            </button>
            
            <Link 
              to="/login"
              className="flex items-center gap-2 text-muted/80 hover:text-gold transition-colors px-3 py-2 text-sm uppercase tracking-wider font-medium"
            >
              <User size={16} />
              <span>{lang === 'ar' ? 'دخول' : 'Login'}</span>
            </Link>

            <button 
              onClick={() => navigate('/register')}
              className="bg-gold hover:bg-gold-light text-main font-semibold px-6 py-3 rounded-lg transition-colors shadow-lg text-xs uppercase tracking-wider"
            >
              {t('nav.cta')}
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-4">
            <button 
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="p-2 text-muted/80"
            >
              <Globe size={20} />
            </button>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-text"
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-surface-2 border-b border-white/5 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              {navLinks.map((link, i) => (
                <a 
                  key={`mobile-nav-link-${i}-${link.name}`} 
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-3 text-sm uppercase tracking-wider font-medium text-muted/80 hover:text-gold hover:bg-surface rounded-lg transition-colors"
                >
                  {link.name}
                </a>
              ))}
              
              <Link 
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-3 text-sm uppercase tracking-wider font-medium text-muted/80 hover:text-gold hover:bg-surface rounded-lg transition-colors"
              >
                {lang === 'ar' ? 'تسجيل الدخول' : 'Login'}
              </Link>

              <div className="pt-4 px-4">
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate('/register');
                  }}
                  className="w-full bg-gold hover:bg-gold-light text-main font-semibold py-4 rounded-lg transition-colors text-sm uppercase tracking-wider"
                >
                  {t('nav.cta')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
