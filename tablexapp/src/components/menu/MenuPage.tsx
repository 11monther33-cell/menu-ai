/**
 * MenuPage.tsx — TableX Customer Menu Page
 * Opens when customer scans QR code. No app download. Pure web.
 *
 * Route: /[slug]/menu?table=N&lang=ar
 * Features: bilingual, sticky category nav, dish cards, 3D badge
 */

'use client'
import { useEffect, useState, useRef } from 'react'
import { DishCard }    from './DishCard'
import { MenuHeader }  from './MenuHeader'
import { CategoryNav } from './CategoryNav'

interface Dish {
  id          : string
  nameAr      : string
  nameEn      : string
  descriptionAr?: string
  descriptionEn?: string
  price       : number
  currency    : string
  image      ?: string
  has3D       : boolean
  isChefSpecial: boolean
  calories   ?: number
  allergens   : string[]
  prepTimeMin : number
  inStock     : boolean
  stockCount ?: number
}

interface Category {
  id     : string
  nameAr : string
  nameEn : string
  emoji ?: string
  dishes : Dish[]
}

interface Restaurant {
  id           : string
  slug         : string
  nameAr       : string
  nameEn       : string
  logoUrl     ?: string
  coverUrl    ?: string
  primaryColor : string
  welcomeMsgAr?: string
  welcomeMsgEn?: string
}

interface MenuData {
  restaurant  : Restaurant
  categories  : Category[]
  tableNumber?: string
}

interface MenuPageProps {
  slug        : string
  tableNumber?: string
  lang        : 'ar' | 'en'
}

export function MenuPage({ slug, tableNumber, lang }: MenuPageProps) {
  const [data, setData]         = useState<MenuData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [search, setSearch]     = useState('')
  const [activeCat, setActiveCat] = useState<string>('')
  const sectionRefs = useRef<Record<string, HTMLElement>>({})
  const isAr = lang === 'ar'

  // ── Fetch menu from API ──────────────────────────────────────────
  useEffect(() => {
    const url = `/api/menu/${slug}?table=${tableNumber || ''}&lang=${lang}`
    fetch(url)
      .then(r => r.ok ? r.json() : Promise.reject('Not found'))
      .then((d: MenuData) => { setData(d); setActiveCat(d.categories[0]?.id || '') })
      .catch(() => setError(isAr ? 'المطعم غير موجود' : 'Restaurant not found'))
      .finally(() => setLoading(false))
  }, [slug, tableNumber, lang])

  // ── Track visible category via IntersectionObserver ──────────────
  useEffect(() => {
    if (!data) return
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) setActiveCat(e.target.id.replace('cat-', ''))
        })
      },
      { threshold: 0.3, rootMargin: '-80px 0px -60% 0px' }
    )
    Object.values(sectionRefs.current).forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [data])

  // ── Filter dishes by search ────────────────────────────────────
  const q = search.trim().toLowerCase()
  const filteredCats = data?.categories.map(cat => ({
    ...cat,
    dishes: q
      ? cat.dishes.filter(d =>
          d.nameAr.toLowerCase().includes(q) ||
          d.nameEn.toLowerCase().includes(q)
        )
      : cat.dishes,
  })).filter(cat => cat.dishes.length > 0) || []

  if (loading) return <LoadingScreen primaryColor="#C9A84C" isAr={isAr} />
  if (error || !data) return <ErrorScreen message={error} isAr={isAr} />

  const { restaurant } = data
  const pc = restaurant.primaryColor || '#C9A84C'

  return (
    <div
      className="min-h-screen"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{
        background: '#0a0a0e',
        fontFamily: isAr ? 'Cairo, sans-serif' : 'Space Grotesk, sans-serif',
        ['--primary' as any]: pc,
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <MenuHeader
        restaurant={restaurant}
        tableNumber={tableNumber}
        lang={lang}
        onLangSwitch={() => {
          const next = isAr ? 'en' : 'ar'
          const url  = new URL(window.location.href)
          url.searchParams.set('lang', next)
          window.location.href = url.toString()
        }}
      />

      {/* ── Search bar ─────────────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-2">
        <div className="relative">
          <span className="absolute top-1/2 -translate-y-1/2 text-white/30 text-sm"
                style={isAr ? { right: 14 } : { left: 14 }}>
            🔍
          </span>
          <input
            type="search"
            placeholder={isAr ? 'ابحث عن طبق…' : 'Search dishes…'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl py-2.5 text-sm text-white placeholder-white/30 border border-white/10 focus:border-white/30 outline-none transition-colors"
            style={{
              background: 'rgba(255,255,255,0.06)',
              paddingRight: isAr ? 40 : 14,
              paddingLeft : isAr ? 14 : 40,
            }}
          />
        </div>
      </div>

      {/* ── Category nav ───────────────────────────────────────────── */}
      {!search && (
        <CategoryNav
          categories={data.categories}
          activeCatId={activeCat}
          lang={lang}
          primaryColor={pc}
          onSelect={id => {
            const el = sectionRefs.current[id]
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
        />
      )}

      {/* ── Welcome message ────────────────────────────────────────── */}
      {(isAr ? restaurant.welcomeMsgAr : restaurant.welcomeMsgEn) && (
        <div
          className="mx-4 mb-3 px-4 py-2.5 rounded-xl text-sm text-center"
          style={{ background: `${pc}18`, color: pc, border: `1px solid ${pc}30` }}
        >
          {isAr ? restaurant.welcomeMsgAr : restaurant.welcomeMsgEn}
        </div>
      )}

      {/* ── Dish sections ──────────────────────────────────────────── */}
      <main className="pb-24">
        {filteredCats.length === 0 && (
          <div className="text-center py-20 text-white/40 text-sm">
            {isAr ? 'لا توجد نتائج' : 'No dishes found'}
          </div>
        )}

        {filteredCats.map(cat => (
          <section
            key={cat.id}
            id={`cat-${cat.id}`}
            ref={el => { if (el) sectionRefs.current[cat.id] = el }}
          >
            {/* Category header — sticky while scrolling */}
            <div
              className="flex items-center gap-2 px-4 py-2.5 backdrop-blur-md sticky top-[112px] z-10"
              style={{ background: 'rgba(10,10,14,0.85)', borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}
            >
              {cat.emoji && <span className="text-lg">{cat.emoji}</span>}
              <h2 className="text-white font-bold text-base">
                {isAr ? cat.nameAr : cat.nameEn}
              </h2>
              <span className="text-white/30 text-sm ms-1">({cat.dishes.length})</span>
            </div>

            {/* Dish cards grid */}
            <div className="px-4 py-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {cat.dishes.map(dish => (
                <DishCard
                  key={dish.id}
                  dish={dish}
                  restaurantSlug={slug}
                  tableNumber={tableNumber}
                  lang={lang}
                  primaryColor={pc}
                />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}

// ── Loading skeleton ─────────────────────────────────────────────────
function LoadingScreen({ primaryColor, isAr }: { primaryColor: string; isAr: boolean }) {
  return (
    <div className="min-h-screen bg-[#0a0a0e] flex flex-col items-center justify-center gap-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="relative w-14 h-14">
        <svg className="-rotate-90 absolute inset-0" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4"/>
          <circle cx="28" cy="28" r="22" fill="none" stroke={primaryColor} strokeWidth="4"
            strokeLinecap="round" strokeDasharray="138" strokeDashoffset="34"
            className="animate-spin" style={{ animationDuration: '0.8s' }}
          />
        </svg>
      </div>
      <p className="text-white/40 text-sm" style={{ fontFamily: isAr ? 'Cairo, sans-serif' : 'inherit' }}>
        {isAr ? 'جاري تحميل المنيو…' : 'Loading menu…'}
      </p>
    </div>
  )
}

function ErrorScreen({ message, isAr }: { message: string; isAr: boolean }) {
  return (
    <div className="min-h-screen bg-[#0a0a0e] flex flex-col items-center justify-center gap-3 px-6 text-center" dir={isAr ? 'rtl' : 'ltr'}>
      <span className="text-5xl">🍽️</span>
      <p className="text-white font-semibold">{message || (isAr ? 'حدث خطأ' : 'Something went wrong')}</p>
    </div>
  )
}
