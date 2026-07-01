/**
 * MenuHeader.tsx + CategoryNav.tsx — TableX Customer UI
 */

'use client'
import Image from 'next/image'

// ═══════════════════════════════════════════════════════════════════
// MENU HEADER
// ═══════════════════════════════════════════════════════════════════
interface Restaurant {
  nameAr: string; nameEn: string; logoUrl?: string; primaryColor: string
}

export function MenuHeader({
  restaurant, tableNumber, lang, onLangSwitch,
}: {
  restaurant: Restaurant; tableNumber?: string; lang: 'ar'|'en'; onLangSwitch: () => void
}) {
  const isAr = lang === 'ar'
  const name = isAr ? restaurant.nameAr : restaurant.nameEn
  const pc   = restaurant.primaryColor

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 backdrop-blur-md"
      style={{ background: 'rgba(10,10,14,0.92)', borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}
    >
      {/* Logo + name */}
      <div className="flex items-center gap-2.5">
        {restaurant.logoUrl ? (
          <div className="relative w-8 h-8 rounded-lg overflow-hidden">
            <Image src={restaurant.logoUrl} alt={name} fill className="object-cover"/>
          </div>
        ) : (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{ background: pc, color: '#0a0a0e' }}
          >
            {name.charAt(0)}
          </div>
        )}
        <div>
          <p className="text-white font-bold text-sm leading-tight">{name}</p>
          {tableNumber && (
            <p className="text-white/40 text-[10px]">
              {isAr ? `طاولة ${tableNumber}` : `Table ${tableNumber}`}
            </p>
          )}
        </div>
      </div>

      {/* Lang toggle */}
      <button
        onClick={onLangSwitch}
        className="text-xs px-2.5 py-1 rounded-full border font-medium transition-colors"
        style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.55)' }}
      >
        {isAr ? 'EN' : 'عربي'}
      </button>
    </header>
  )
}

// ═══════════════════════════════════════════════════════════════════
// CATEGORY NAV (horizontal scroll strip)
// ═══════════════════════════════════════════════════════════════════
interface Category { id: string; nameAr: string; nameEn: string; emoji?: string }

export function CategoryNav({
  categories, activeCatId, lang, primaryColor, onSelect,
}: {
  categories  : Category[]
  activeCatId : string
  lang        : 'ar'|'en'
  primaryColor: string
  onSelect    : (id: string) => void
}) {
  const isAr = lang === 'ar'

  return (
    <nav
      className="sticky top-[52px] z-10 flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide"
      style={{ background: 'rgba(10,10,14,0.9)', backdropFilter: 'blur(12px)', borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}
    >
      {categories.map(cat => {
        const active = cat.id === activeCatId
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap"
            style={
              active
                ? { background: primaryColor, color: '#0a0a0e' }
                : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)' }
            }
          >
            {cat.emoji && <span className="text-sm">{cat.emoji}</span>}
            <span>{isAr ? cat.nameAr : cat.nameEn}</span>
          </button>
        )
      })}
    </nav>
  )
}
