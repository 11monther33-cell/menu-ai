import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Menu, X, Globe, User } from 'lucide-react';
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
        isScrolled ? 'bg-white/95 backdrop-blur-md py-3 border-b border-[#E7E1EA] shadow-sm' : 'bg-white/90 backdrop-blur-sm py-4 border-b border-[#E7E1EA]/60'
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
                className="text-[#351344] hover:text-[#FF5A1F] transition-colors text-sm uppercase tracking-wider font-semibold"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              aria-label={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
              className="flex items-center gap-2 text-[#351344] hover:text-[#FF5A1F] transition-colors px-3 py-2 rounded-lg hover:bg-[#F4EEF7] text-sm uppercase tracking-wider font-semibold"
            >
              <Globe size={16} />
              <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
            </button>
            
            <Link 
              to="/login"
              className="flex items-center gap-2 text-[#351344] hover:text-[#FF5A1F] transition-colors px-3 py-2 text-sm uppercase tracking-wider font-semibold"
            >
              <User size={16} />
              <span>{lang === 'ar' ? 'دخول' : 'Login'}</span>
            </Link>

            <button 
              onClick={() => navigate('/register')}
              className="bg-[#351344] hover:bg-[#260D32] text-white font-bold px-6 py-3 rounded-full transition-all shadow-md hover:shadow-lg text-xs uppercase tracking-wider"
            >
              {t('nav.cta')}
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-4">
            <button 
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              aria-label={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
              className="p-2 text-[#351344]"
            >
              <Globe size={20} />
            </button>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              className="p-2 text-[#351344]"
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div 
        className={`md:hidden bg-white border-b border-[#E7E1EA] overflow-hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pt-2 pb-6 space-y-2">
          {navLinks.map((link, i) => (
            <a 
              key={`mobile-nav-link-${i}-${link.name}`} 
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-3 text-sm uppercase tracking-wider font-semibold text-[#351344] hover:text-[#FF5A1F] hover:bg-[#F4EEF7] rounded-lg transition-colors"
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
      </div>
    </nav>
  );
};

