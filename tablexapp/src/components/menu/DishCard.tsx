/**
 * DishCard.tsx + DishDetailPage.tsx — TableX
 * DishCard: the card in the menu grid (with 3D badge)
 * DishDetailPage: tapping a dish opens this — shows details + 3D button
 */

// ═══════════════════════════════════════════════════════════════════
// DISH CARD
// ═══════════════════════════════════════════════════════════════════

'use client'
import { useState, lazy, Suspense } from 'react'
import Image from 'next/image'

// Lazy-load the heavy 3D viewer only when needed
const ThreeDViewer = lazy(() => import('./ThreeDViewer'))

interface Dish {
  id           : string
  nameAr       : string
  nameEn       : string
  descriptionAr?: string
  descriptionEn?: string
  price        : number
  currency     : string
  image       ?: string
  has3D        : boolean
  model3dUrl  ?: string
  isChefSpecial: boolean
  calories    ?: number
  allergens    : string[]
  prepTimeMin  : number
  inStock      : boolean
  stockCount  ?: number
  chefNotes   ?: Array<{ message: string }>
  ugcPhotos   ?: string[]
}

interface DishCardProps {
  dish           : Dish
  restaurantSlug : string
  tableNumber   ?: string
  lang           : 'ar' | 'en'
  primaryColor   : string
}

export function DishCard({ dish, restaurantSlug, tableNumber, lang, primaryColor }: DishCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const [open, setOpen]           = useState(false)
  const isAr   = lang === 'ar'
  const name   = isAr ? dish.nameAr : dish.nameEn
  const desc   = isAr ? dish.descriptionAr : dish.descriptionEn

  return (
    <>
      {/* ── Card ──────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(true)}
        className="relative rounded-2xl overflow-hidden text-start w-full active:scale-95 transition-transform"
        style={{ border: '0.5px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.04)' }}
      >
        {/* Image */}
        <div className="relative h-36 bg-gray-900 overflow-hidden">
          {dish.image ? (
            <Image
              src={dish.image}
              alt={name}
              fill
              sizes="(max-width:640px) 50vw, 33vw"
              className={`object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImgLoaded(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">🍽</div>
          )}

          {/* 3D badge */}
          {dish.has3D && (
            <div
              className="absolute top-2 start-2 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold"
              style={{ background: primaryColor, color: '#0a0a0e' }}
            >
              <span>◉</span><span>{isAr ? '3D' : '3D'}</span>
            </div>
          )}

          {/* Out of stock */}
          {!dish.inStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-bold text-xs">
                {isAr ? 'نفد المخزون' : 'Out of stock'}
              </span>
            </div>
          )}

          {/* Low stock */}
          {dish.inStock && dish.stockCount != null && dish.stockCount <= 5 && (
            <div className="absolute bottom-2 start-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/90 text-white">
              {isAr ? `${dish.stockCount} فقط!` : `${dish.stockCount} left!`}
            </div>
          )}

          {/* Chef special */}
          {dish.isChefSpecial && (
            <div className="absolute top-2 end-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-white/90 text-gray-900">
              ⭐ {isAr ? 'الشيف' : 'Special'}
            </div>
          )}
        </div>

        {/* Text */}
        <div className="p-2.5">
          <h3 className="text-white font-semibold text-xs leading-snug line-clamp-2 mb-1">{name}</h3>
          <span className="font-bold text-sm" style={{ color: primaryColor }}>
            {dish.price} {dish.currency}
          </span>
        </div>
      </button>

      {/* ── Dish detail modal ─────────────────────────────────────── */}
      {open && (
        <DishDetailModal
          dish={dish}
          lang={lang}
          primaryColor={primaryColor}
          tableNumber={tableNumber}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════
// DISH DETAIL MODAL (opens on tap)
// ═══════════════════════════════════════════════════════════════════

const ALLERGEN_ICONS: Record<string, string> = {
  gluten: '🌾', dairy: '🥛', nuts: '🥜', eggs: '🥚',
  fish: '🐟', shellfish: '🦐', soy: '🫘',
}

function DishDetailModal({
  dish, lang, primaryColor, tableNumber, onClose,
}: {
  dish: Dish; lang: 'ar'|'en'; primaryColor: string; tableNumber?: string; onClose: () => void
}) {
  const [show3D, setShow3D]   = useState(false)
  const [added, setAdded]     = useState(false)
  const isAr  = lang === 'ar'
  const name  = isAr ? dish.nameAr : dish.nameEn
  const desc  = isAr ? dish.descriptionAr : dish.descriptionEn

  const handleAddOrder = async () => {
    // POST to cart API
    await fetch('/api/menu/cart', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({
        dishId     : dish.id,
        quantity   : 1,
        tableNumber,
      }),
    }).catch(() => {})
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (show3D && dish.model3dUrl) {
    return (
      <Suspense fallback={null}>
        <ThreeDViewer
          modelUrl     = {dish.model3dUrl}
          dishName     = {dish.nameEn}
          dishNameAr   = {dish.nameAr}
          price        = {`${dish.price} ${dish.currency}`}
          primaryColor = {primaryColor}
          lang         = {lang}
          onClose      = {() => setShow3D(false)}
          onOrderAdd   = {handleAddOrder}
        />
      </Suspense>
    )
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col" dir={isAr ? 'rtl' : 'ltr'}
         style={{ background: '#0a0a0e', fontFamily: isAr ? 'Cairo, sans-serif' : 'Space Grotesk, sans-serif' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 shrink-0">
        <button onClick={onClose} className="text-white/50 hover:text-white transition-colors text-sm">
          {isAr ? '← رجوع' : '← Back'}
        </button>
        <span className="text-white/30 text-xs">{isAr ? 'تفاصيل الطبق' : 'Dish detail'}</span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">

        {/* Hero image */}
        <div className="relative h-64 bg-gray-900">
          {dish.image ? (
            <Image src={dish.image} alt={name} fill className="object-cover"/>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl">🍽</div>
          )}
          {dish.has3D && (
            <div
              className="absolute bottom-3 end-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: primaryColor, color: '#0a0a0e' }}
            >
              ◉ {isAr ? 'متاح بـ 3D + AR' : 'Available in 3D + AR'}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">

          {/* Name + price */}
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              {dish.isChefSpecial && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 inline-block"
                  style={{ background: primaryColor, color: '#0a0a0e' }}
                >
                  ⭐ {isAr ? 'طبق الشيف' : 'Chef Special'}
                </span>
              )}
              <h1 className="text-white text-xl font-bold leading-tight">{name}</h1>
            </div>
            <div className="text-right ms-3">
              <div className="text-xl font-bold" style={{ color: primaryColor }}>{dish.price}</div>
              <div className="text-white/40 text-xs">{dish.currency}</div>
            </div>
          </div>

          {/* Description */}
          {desc && (
            <p className="text-white/60 text-sm leading-relaxed mb-4">{desc}</p>
          )}

          {/* Chef note */}
          {dish.chefNotes && dish.chefNotes.length > 0 && (
            <div
              className="flex gap-2 p-3 rounded-xl mb-4"
              style={{ background: `${primaryColor}15`, border: `1px solid ${primaryColor}30` }}
            >
              <span className="text-lg shrink-0">👨‍🍳</span>
              <p className="text-sm" style={{ color: primaryColor }}>{dish.chefNotes[0].message}</p>
            </div>
          )}

          {/* ⭐ 3D + AR Button */}
          {dish.has3D && dish.model3dUrl && (
            <button
              onClick={() => setShow3D(true)}
              className="w-full py-4 rounded-2xl font-bold text-base mb-3 flex items-center justify-center gap-2.5 active:scale-95 transition-transform"
              style={{ background: primaryColor, color: '#0a0a0e' }}
            >
              <span className="text-xl">◉</span>
              <span>{isAr ? 'شوف الطبق ثلاثي الأبعاد' : 'View Dish in 3D + AR'}</span>
            </button>
          )}

          {/* Add to order */}
          <button
            onClick={handleAddOrder}
            className="w-full py-3.5 rounded-2xl font-bold text-sm mb-4 transition-all active:scale-95"
            style={
              added
                ? { background: '#22c55e', color: 'white' }
                : { background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.12)' }
            }
          >
            {added
              ? (isAr ? '✓ تم الإضافة!' : '✓ Added!')
              : (isAr ? '+ أضف للطلب' : '+ Add to Order')}
          </button>

          {/* Quick info row */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {dish.calories && (
              <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="text-white text-sm font-bold">{dish.calories}</div>
                <div className="text-white/40 text-[10px]">{isAr ? 'سعرة' : 'kcal'}</div>
              </div>
            )}
            <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="text-white text-sm font-bold">{dish.prepTimeMin}</div>
              <div className="text-white/40 text-[10px]">{isAr ? 'دقيقة' : 'min'}</div>
            </div>
            <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="text-sm font-bold" style={{ color: dish.inStock ? '#22c55e' : '#ef4444' }}>
                {dish.inStock ? (isAr ? 'متاح' : 'In stock') : (isAr ? 'نفد' : 'Out')}
              </div>
              <div className="text-white/40 text-[10px]">{isAr ? 'الحالة' : 'Status'}</div>
            </div>
          </div>

          {/* Allergens */}
          {dish.allergens.length > 0 && (
            <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <p className="text-amber-400 text-xs font-bold mb-2">
                ⚠ {isAr ? 'يحتوي على مواد مسببة للحساسية' : 'Contains allergens'}
              </p>
              <div className="flex flex-wrap gap-2">
                {dish.allergens.map(a => (
                  <span key={a} className="text-amber-300/70 text-xs flex items-center gap-1">
                    {ALLERGEN_ICONS[a] || '⚠'} {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Customer photos */}
          {dish.ugcPhotos && dish.ugcPhotos.length > 0 && (
            <div className="mb-4">
              <p className="text-white/60 text-xs font-semibold mb-2">
                {isAr ? '📸 صور من الزبائن' : '📸 From our guests'}
              </p>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {dish.ugcPhotos.map((url, i) => (
                  <div key={i} className="relative h-20 w-20 rounded-xl overflow-hidden shrink-0">
                    <Image src={url} alt="" fill className="object-cover"/>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
