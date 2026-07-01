import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

const CURRENCIES = [
  { code: 'SAR', name: 'Saudi Riyal', nameAr: 'ريال سعودي', flag: '🇸🇦' },
  { code: 'AED', name: 'UAE Dirham', nameAr: 'درهم إماراتي', flag: '🇦🇪' },
  { code: 'USD', name: 'US Dollar', nameAr: 'دولار أمريكي', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', nameAr: 'يورو', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', nameAr: 'جنيه إسترليني', flag: '🇬🇧' },
  { code: 'KWD', name: 'Kuwaiti Dinar', nameAr: 'دينار كويتي', flag: '🇰🇼' },
  { code: 'BHD', name: 'Bahraini Dinar', nameAr: 'دينار بحريني', flag: '🇧🇭' },
  { code: 'OMR', name: 'Omani Rial', nameAr: 'ريال عماني', flag: '🇴🇲' },
  { code: 'QAR', name: 'Qatari Riyal', nameAr: 'ريال قطري', flag: '🇶🇦' },
  { code: 'JOD', name: 'Jordanian Dinar', nameAr: 'دينار أردني', flag: '🇯🇴' },
  { code: 'EGP', name: 'Egyptian Pound', nameAr: 'جنيه مصري', flag: '🇪🇬' },
  { code: 'LBP', name: 'Lebanese Pound', nameAr: 'ليرة لبنانية', flag: '🇱🇧' },
  { code: 'IQD', name: 'Iraqi Dinar', nameAr: 'دينار عراقي', flag: '🇮🇶' },
  { code: 'SYP', name: 'Syrian Pound', nameAr: 'ليرة سورية', flag: '🇸🇾' },
  { code: 'YER', name: 'Yemeni Rial', nameAr: 'ريال يمني', flag: '🇾🇪' },
  { code: 'TND', name: 'Tunisian Dinar', nameAr: 'دينار تونسي', flag: '🇹🇳' },
  { code: 'MAD', name: 'Moroccan Dirham', nameAr: 'درهم مغربي', flag: '🇲🇦' },
  { code: 'DZD', name: 'Algerian Dinar', nameAr: 'دينار جزائري', flag: '🇩🇿' },
  { code: 'LYD', name: 'Libyan Dinar', nameAr: 'دينار ليبي', flag: '🇱🇾' },
  { code: 'SDG', name: 'Sudanese Pound', nameAr: 'جنيه سوداني', flag: '🇸🇩' },
  { code: 'TRY', name: 'Turkish Lira', nameAr: 'ليرة تركية', flag: '🇹🇷' },
  { code: 'IRR', name: 'Iranian Rial', nameAr: 'ريال إيراني', flag: '🇮🇷' },
  { code: 'PKR', name: 'Pakistani Rupee', nameAr: 'روبية باكستانية', flag: '🇵🇰' },
  { code: 'INR', name: 'Indian Rupee', nameAr: 'روبية هندية', flag: '🇮🇳' },
  { code: 'CNY', name: 'Chinese Yuan', nameAr: 'يوان صيني', flag: '🇨🇳' },
  { code: 'JPY', name: 'Japanese Yen', nameAr: 'ين ياباني', flag: '🇯🇵' },
  { code: 'KRW', name: 'South Korean Won', nameAr: 'وون كوري', flag: '🇰🇷' },
  { code: 'MYR', name: 'Malaysian Ringgit', nameAr: 'رينجت ماليزي', flag: '🇲🇾' },
  { code: 'IDR', name: 'Indonesian Rupiah', nameAr: 'روبية إندونيسية', flag: '🇮🇩' },
  { code: 'THB', name: 'Thai Baht', nameAr: 'بات تايلندي', flag: '🇹🇭' },
  { code: 'SGD', name: 'Singapore Dollar', nameAr: 'دولار سنغافوري', flag: '🇸🇬' },
  { code: 'PHP', name: 'Philippine Peso', nameAr: 'بيزو فلبيني', flag: '🇵🇭' },
  { code: 'VND', name: 'Vietnamese Dong', nameAr: 'دونج فيتنامي', flag: '🇻🇳' },
  { code: 'BDT', name: 'Bangladeshi Taka', nameAr: 'تاكا بنغلاديشي', flag: '🇧🇩' },
  { code: 'LKR', name: 'Sri Lankan Rupee', nameAr: 'روبية سريلانكية', flag: '🇱🇰' },
  { code: 'NPR', name: 'Nepalese Rupee', nameAr: 'روبية نيبالية', flag: '🇳🇵' },
  { code: 'MMK', name: 'Myanmar Kyat', nameAr: 'كيات ميانمار', flag: '🇲🇲' },
  { code: 'KHR', name: 'Cambodian Riel', nameAr: 'ريال كمبودي', flag: '🇰🇭' },
  { code: 'TWD', name: 'Taiwan Dollar', nameAr: 'دولار تايواني', flag: '🇹🇼' },
  { code: 'HKD', name: 'Hong Kong Dollar', nameAr: 'دولار هونغ كونغ', flag: '🇭🇰' },
  { code: 'AUD', name: 'Australian Dollar', nameAr: 'دولار أسترالي', flag: '🇦🇺' },
  { code: 'NZD', name: 'New Zealand Dollar', nameAr: 'دولار نيوزيلندي', flag: '🇳🇿' },
  { code: 'CAD', name: 'Canadian Dollar', nameAr: 'دولار كندي', flag: '🇨🇦' },
  { code: 'CHF', name: 'Swiss Franc', nameAr: 'فرنك سويسري', flag: '🇨🇭' },
  { code: 'SEK', name: 'Swedish Krona', nameAr: 'كرونة سويدية', flag: '🇸🇪' },
  { code: 'NOK', name: 'Norwegian Krone', nameAr: 'كرونة نرويجية', flag: '🇳🇴' },
  { code: 'DKK', name: 'Danish Krone', nameAr: 'كرونة دنماركية', flag: '🇩🇰' },
  { code: 'PLN', name: 'Polish Zloty', nameAr: 'زلوتي بولندي', flag: '🇵🇱' },
  { code: 'CZK', name: 'Czech Koruna', nameAr: 'كرونة تشيكية', flag: '🇨🇿' },
  { code: 'HUF', name: 'Hungarian Forint', nameAr: 'فورنت مجري', flag: '🇭🇺' },
  { code: 'RON', name: 'Romanian Leu', nameAr: 'ليو روماني', flag: '🇷🇴' },
  { code: 'BGN', name: 'Bulgarian Lev', nameAr: 'ليف بلغاري', flag: '🇧🇬' },
  { code: 'HRK', name: 'Croatian Kuna', nameAr: 'كونا كرواتية', flag: '🇭🇷' },
  { code: 'RSD', name: 'Serbian Dinar', nameAr: 'دينار صربي', flag: '🇷🇸' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', nameAr: 'هريفنيا أوكرانية', flag: '🇺🇦' },
  { code: 'RUB', name: 'Russian Ruble', nameAr: 'روبل روسي', flag: '🇷🇺' },
  { code: 'GEL', name: 'Georgian Lari', nameAr: 'لاري جورجي', flag: '🇬🇪' },
  { code: 'AZN', name: 'Azerbaijani Manat', nameAr: 'مانات أذربيجاني', flag: '🇦🇿' },
  { code: 'KZT', name: 'Kazakh Tenge', nameAr: 'تينغ كازاخستاني', flag: '🇰🇿' },
  { code: 'UZS', name: 'Uzbek Som', nameAr: 'سوم أوزبكي', flag: '🇺🇿' },
  { code: 'BRL', name: 'Brazilian Real', nameAr: 'ريال برازيلي', flag: '🇧🇷' },
  { code: 'MXN', name: 'Mexican Peso', nameAr: 'بيزو مكسيكي', flag: '🇲🇽' },
  { code: 'ARS', name: 'Argentine Peso', nameAr: 'بيزو أرجنتيني', flag: '🇦🇷' },
  { code: 'CLP', name: 'Chilean Peso', nameAr: 'بيزو تشيلي', flag: '🇨🇱' },
  { code: 'COP', name: 'Colombian Peso', nameAr: 'بيزو كولومبي', flag: '🇨🇴' },
  { code: 'PEN', name: 'Peruvian Sol', nameAr: 'سول بيروفي', flag: '🇵🇪' },
  { code: 'ZAR', name: 'South African Rand', nameAr: 'راند جنوب أفريقي', flag: '🇿🇦' },
  { code: 'NGN', name: 'Nigerian Naira', nameAr: 'نايرا نيجيري', flag: '🇳🇬' },
  { code: 'GHS', name: 'Ghanaian Cedi', nameAr: 'سيدي غاني', flag: '🇬🇭' },
  { code: 'KES', name: 'Kenyan Shilling', nameAr: 'شلن كيني', flag: '🇰🇪' },
  { code: 'TZS', name: 'Tanzanian Shilling', nameAr: 'شلن تنزاني', flag: '🇹🇿' },
  { code: 'UGX', name: 'Ugandan Shilling', nameAr: 'شلن أوغندي', flag: '🇺🇬' },
  { code: 'ETB', name: 'Ethiopian Birr', nameAr: 'بير إثيوبي', flag: '🇪🇹' },
  { code: 'XOF', name: 'West African CFA', nameAr: 'فرنك غرب أفريقي', flag: '🌍' },
  { code: 'XAF', name: 'Central African CFA', nameAr: 'فرنك وسط أفريقي', flag: '🌍' },
  { code: 'ILS', name: 'Israeli Shekel', nameAr: 'شيكل إسرائيلي', flag: '🇮🇱' },
  { code: 'AFN', name: 'Afghan Afghani', nameAr: 'أفغاني', flag: '🇦🇫' },
  { code: 'ISK', name: 'Icelandic Krona', nameAr: 'كرونة آيسلندية', flag: '🇮🇸' },
  { code: 'JMD', name: 'Jamaican Dollar', nameAr: 'دولار جامايكي', flag: '🇯🇲' },
  { code: 'DOP', name: 'Dominican Peso', nameAr: 'بيزو دومينيكي', flag: '🇩🇴' },
  { code: 'CRC', name: 'Costa Rican Colon', nameAr: 'كولون كوستاريكي', flag: '🇨🇷' },
  { code: 'GTQ', name: 'Guatemalan Quetzal', nameAr: 'كيتزال غواتيمالي', flag: '🇬🇹' },
  { code: 'PAB', name: 'Panamanian Balboa', nameAr: 'بالبوا بنمي', flag: '🇵🇦' },
  { code: 'UYU', name: 'Uruguayan Peso', nameAr: 'بيزو أوروغواي', flag: '🇺🇾' },
  { code: 'BOB', name: 'Bolivian Boliviano', nameAr: 'بوليفيانو', flag: '🇧🇴' },
  { code: 'PYG', name: 'Paraguayan Guarani', nameAr: 'غواراني باراغواي', flag: '🇵🇾' },
  { code: 'VES', name: 'Venezuelan Bolívar', nameAr: 'بوليفار فنزويلي', flag: '🇻🇪' },
  { code: 'CUP', name: 'Cuban Peso', nameAr: 'بيزو كوبي', flag: '🇨🇺' },
  { code: 'TTD', name: 'Trinidad Dollar', nameAr: 'دولار ترينيداد', flag: '🇹🇹' },
  { code: 'BBD', name: 'Barbadian Dollar', nameAr: 'دولار بربادوسي', flag: '🇧🇧' },
  { code: 'BSD', name: 'Bahamian Dollar', nameAr: 'دولار بهامي', flag: '🇧🇸' },
  { code: 'BZD', name: 'Belize Dollar', nameAr: 'دولار بليزي', flag: '🇧🇿' },
  { code: 'HTG', name: 'Haitian Gourde', nameAr: 'غورد هايتي', flag: '🇭🇹' },
  { code: 'HNL', name: 'Honduran Lempira', nameAr: 'لمبيرا هندوراسي', flag: '🇭🇳' },
  { code: 'NIO', name: 'Nicaraguan Córdoba', nameAr: 'كوردوبا نيكاراغوا', flag: '🇳🇮' },
  { code: 'SVC', name: 'Salvadoran Colon', nameAr: 'كولون سلفادوري', flag: '🇸🇻' },
  { code: 'MOP', name: 'Macanese Pataca', nameAr: 'باتاكا ماكاوية', flag: '🇲🇴' },
  { code: 'BND', name: 'Brunei Dollar', nameAr: 'دولار بروناي', flag: '🇧🇳' },
  { code: 'FJD', name: 'Fijian Dollar', nameAr: 'دولار فيجي', flag: '🇫🇯' },
  { code: 'PGK', name: 'Papua New Guinean Kina', nameAr: 'كينا بابوا', flag: '🇵🇬' },
  { code: 'WST', name: 'Samoan Tala', nameAr: 'تالا ساموا', flag: '🇼🇸' },
  { code: 'TOP', name: 'Tongan Paʻanga', nameAr: 'بانغا تونغا', flag: '🇹🇴' },
  { code: 'SBD', name: 'Solomon Islands Dollar', nameAr: 'دولار جزر سليمان', flag: '🇸🇧' },
  { code: 'VUV', name: 'Vanuatu Vatu', nameAr: 'فاتو فانواتو', flag: '🇻🇺' },
  { code: 'MUR', name: 'Mauritian Rupee', nameAr: 'روبية موريشية', flag: '🇲🇺' },
  { code: 'SCR', name: 'Seychellois Rupee', nameAr: 'روبية سيشلية', flag: '🇸🇨' },
  { code: 'MVR', name: 'Maldivian Rufiyaa', nameAr: 'روفية مالديفية', flag: '🇲🇻' },
  { code: 'BTN', name: 'Bhutanese Ngultrum', nameAr: 'نغولتروم بوتاني', flag: '🇧🇹' },
  { code: 'MNT', name: 'Mongolian Tugrik', nameAr: 'توغريك منغولي', flag: '🇲🇳' },
  { code: 'KGS', name: 'Kyrgyz Som', nameAr: 'سوم قيرغيزي', flag: '🇰🇬' },
  { code: 'TJS', name: 'Tajik Somoni', nameAr: 'سوموني طاجيكي', flag: '🇹🇯' },
  { code: 'TMT', name: 'Turkmen Manat', nameAr: 'مانات تركمانستاني', flag: '🇹🇲' },
  { code: 'AMD', name: 'Armenian Dram', nameAr: 'درام أرميني', flag: '🇦🇲' },
  { code: 'MDL', name: 'Moldovan Leu', nameAr: 'ليو مولدوفي', flag: '🇲🇩' },
  { code: 'ALL', name: 'Albanian Lek', nameAr: 'ليك ألباني', flag: '🇦🇱' },
  { code: 'MKD', name: 'Macedonian Denar', nameAr: 'دينار مقدوني', flag: '🇲🇰' },
  { code: 'BAM', name: 'Bosnian Mark', nameAr: 'مارك بوسني', flag: '🇧🇦' },
  { code: 'RWF', name: 'Rwandan Franc', nameAr: 'فرنك رواندي', flag: '🇷🇼' },
  { code: 'BIF', name: 'Burundian Franc', nameAr: 'فرنك بوروندي', flag: '🇧🇮' },
  { code: 'CDF', name: 'Congolese Franc', nameAr: 'فرنك كونغولي', flag: '🇨🇩' },
  { code: 'MGA', name: 'Malagasy Ariary', nameAr: 'أرياري مدغشقر', flag: '🇲🇬' },
  { code: 'MWK', name: 'Malawian Kwacha', nameAr: 'كواشا مالاوي', flag: '🇲🇼' },
  { code: 'ZMW', name: 'Zambian Kwacha', nameAr: 'كواشا زامبي', flag: '🇿🇲' },
  { code: 'MZN', name: 'Mozambican Metical', nameAr: 'ميتيكال موزمبيقي', flag: '🇲🇿' },
  { code: 'AOA', name: 'Angolan Kwanza', nameAr: 'كوانزا أنغولي', flag: '🇦🇴' },
  { code: 'NAD', name: 'Namibian Dollar', nameAr: 'دولار ناميبي', flag: '🇳🇦' },
  { code: 'BWP', name: 'Botswana Pula', nameAr: 'بولا بوتسواني', flag: '🇧🇼' },
  { code: 'SZL', name: 'Eswatini Lilangeni', nameAr: 'ليلانجيني سوازيلند', flag: '🇸🇿' },
  { code: 'LSL', name: 'Lesotho Loti', nameAr: 'لوتي ليسوتو', flag: '🇱🇸' },
  { code: 'GMD', name: 'Gambian Dalasi', nameAr: 'دلاسي غامبي', flag: '🇬🇲' },
  { code: 'SLL', name: 'Sierra Leonean Leone', nameAr: 'ليون سيراليوني', flag: '🇸🇱' },
  { code: 'GNF', name: 'Guinean Franc', nameAr: 'فرنك غيني', flag: '🇬🇳' },
  { code: 'LRD', name: 'Liberian Dollar', nameAr: 'دولار ليبيري', flag: '🇱🇷' },
  { code: 'CVE', name: 'Cape Verdean Escudo', nameAr: 'إسكودو كاب فيردي', flag: '🇨🇻' },
  { code: 'STN', name: 'São Tomé Dobra', nameAr: 'دوبرا ساوتومي', flag: '🇸🇹' },
  { code: 'ERN', name: 'Eritrean Nakfa', nameAr: 'ناكفا إريتري', flag: '🇪🇷' },
  { code: 'DJF', name: 'Djiboutian Franc', nameAr: 'فرنك جيبوتي', flag: '🇩🇯' },
  { code: 'SOS', name: 'Somali Shilling', nameAr: 'شلن صومالي', flag: '🇸🇴' },
  { code: 'KMF', name: 'Comorian Franc', nameAr: 'فرنك قمري', flag: '🇰🇲' },
  { code: 'MRU', name: 'Mauritanian Ouguiya', nameAr: 'أوقية موريتانية', flag: '🇲🇷' },
  { code: 'LAK', name: 'Lao Kip', nameAr: 'كيب لاوسي', flag: '🇱🇦' },
];

interface CurrencySelectorProps {
  value: string;
  onChange: (code: string) => void;
  isRtl: boolean;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({ value, onChange, isRtl }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus();
  }, [open]);

  const selected = CURRENCIES.find(c => c.code === value) || CURRENCIES[0];

  const filtered = useMemo(() => {
    if (!search) return CURRENCIES;
    const q = search.toLowerCase();
    return CURRENCIES.filter(c =>
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.nameAr.includes(search)
    );
  }, [search]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch(''); }}
        className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl text-white text-sm bg-main border border-white/10 outline-none hover:border-gold/30 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="text-lg">{selected.flag}</span>
          <span className="font-bold">{selected.code}</span>
          <span className="text-white/40 text-xs hidden sm:inline">— {isRtl ? selected.nameAr : selected.name}</span>
        </span>
        <ChevronDown size={16} className={`text-white/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full bg-[#111] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
          <div className="p-3 border-b border-white/5">
            <div className="relative">
              <Search size={14} className="absolute top-1/2 -translate-y-1/2 start-3 text-white/30" />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={isRtl ? 'ابحث عن عملة...' : 'Search currency...'}
                className="w-full ps-9 pe-4 py-2.5 rounded-lg text-white text-xs bg-white/5 border border-white/10 outline-none focus:border-gold/40 placeholder:text-white/25"
              />
            </div>
          </div>
          <div className="max-h-[280px] overflow-y-auto custom-scrollbar">
            {filtered.length === 0 && (
              <p className="text-center text-white/30 text-xs py-6">{isRtl ? 'لا توجد نتائج' : 'No results'}</p>
            )}
            {filtered.map(c => (
              <button
                key={c.code}
                type="button"
                onClick={() => { onChange(c.code); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  c.code === value ? 'bg-gold/10 text-gold' : 'text-white hover:bg-white/5'
                }`}
              >
                <span className="text-lg">{c.flag}</span>
                <span className="font-bold w-12 text-start">{c.code}</span>
                <span className="text-white/50 text-xs truncate">{isRtl ? c.nameAr : c.name}</span>
                {c.code === value && <Check size={14} className="ms-auto text-gold" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
