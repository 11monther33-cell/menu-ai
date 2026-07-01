/**
 * API Routes — TableX
 *
 * File 1: app/api/menu/[slug]/route.ts          → GET public menu
 * File 2: app/api/menu/[slug]/dish/[id]/route.ts → GET dish + 3D URL
 * File 3: app/api/r/dishes/[id]/model3d/route.ts → POST upload GLB (dashboard)
 * File 4: app/api/r/qr-codes/route.ts           → POST generate QR
 * File 5: app/api/menu/cart/route.ts             → POST add to cart
 */

// ═══════════════════════════════════════════════════════════════════
// FILE 1 — app/api/menu/[slug]/route.ts
// GET /api/menu/[slug]?table=N&lang=ar
// ═══════════════════════════════════════════════════════════════════
/*
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params
  const table = req.nextUrl.searchParams.get('table') || ''
  const lang  = req.nextUrl.searchParams.get('lang') || 'ar'

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug, isActive: true },
    include: {
      categories: {
        where: { isVisible: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          dishes: {
            where: { isAvailable: true },
            orderBy: { sortOrder: 'asc' },
            select: {
              id: true, nameAr: true, nameEn: true,
              descriptionAr: true, descriptionEn: true,
              price: true, currency: true,
              thumbnailUrl: true, images: true,
              model3dStatus: true,
              isChefSpecial: true, calories: true,
              allergens: true, prepTimeMin: true,
              isAvailable: true, stockCount: true,
            },
          },
        },
      },
    },
  })

  if (!restaurant)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Increment scan count (fire-and-forget)
  if (table) {
    prisma.qrCode.updateMany({
      where: { restaurantId: restaurant.id, tableNumber: table },
      data: { scanCount: { increment: 1 }, lastScannedAt: new Date() },
    }).catch(() => {})
  }

  return NextResponse.json({
    restaurant: {
      id: restaurant.id, slug: restaurant.slug,
      nameAr: restaurant.nameAr, nameEn: restaurant.nameEn,
      logoUrl: restaurant.logoUrl, coverUrl: restaurant.coverUrl,
      primaryColor: restaurant.primaryColor,
      welcomeMsgAr: restaurant.welcomeMsgAr,
      welcomeMsgEn: restaurant.welcomeMsgEn,
    },
    tableNumber: table || null,
    categories: restaurant.categories.map(cat => ({
      id: cat.id, nameAr: cat.nameAr, nameEn: cat.nameEn, emoji: cat.emoji,
      dishes: cat.dishes.map(d => ({
        id: d.id, nameAr: d.nameAr, nameEn: d.nameEn,
        descriptionAr: d.descriptionAr, descriptionEn: d.descriptionEn,
        price: Number(d.price), currency: d.currency,
        image: d.images[0] ?? null,
        has3D: d.model3dStatus === 'READY',
        isChefSpecial: d.isChefSpecial, calories: d.calories,
        allergens: d.allergens, prepTimeMin: d.prepTimeMin,
        inStock: d.stockCount === null || d.stockCount > 0,
        stockCount: d.stockCount,
      })),
    })),
  }, {
    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' }
  })
}
*/

// ═══════════════════════════════════════════════════════════════════
// FILE 2 — app/api/menu/[slug]/dish/[id]/route.ts
// GET /api/menu/[slug]/dish/[id]?lang=ar
// Returns FULL dish details including model3dUrl (only if READY)
// ═══════════════════════════════════════════════════════════════════
/*
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  const lang = req.nextUrl.searchParams.get('lang') || 'ar'

  const dish = await prisma.dish.findFirst({
    where: { id: params.id, restaurant: { slug: params.slug } },
    include: {
      restaurant : { select: { primaryColor: true } },
      category   : { select: { nameAr: true, nameEn: true } },
      chefNotes  : { where: { isActive: true }, take: 3, orderBy: { createdAt: 'desc' } },
      ugcPhotos  : { where: { status: 'APPROVED' }, take: 8, select: { photoUrl: true } },
    },
  })

  if (!dish) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Increment view count (non-blocking)
  prisma.dish.update({ where: { id: dish.id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {})

  return NextResponse.json({
    id: dish.id,
    nameAr: dish.nameAr, nameEn: dish.nameEn,
    descriptionAr: dish.descriptionAr, descriptionEn: dish.descriptionEn,
    price: Number(dish.price), currency: dish.currency,
    images: dish.images,
    has3D: dish.model3dStatus === 'READY',
    model3dUrl: dish.model3dStatus === 'READY' ? dish.model3dUrl : null,
    model3dSizeKb: dish.model3dSizeKb,
    allergens: dish.allergens, calories: dish.calories,
    protein: dish.protein, carbs: dish.carbs, fat: dish.fat,
    prepTimeMin: dish.prepTimeMin,
    inStock: dish.stockCount === null || dish.stockCount > 0,
    stockCount: dish.stockCount,
    isChefSpecial: dish.isChefSpecial,
    restaurantColor: dish.restaurant.primaryColor,
    chefNotes: dish.chefNotes.map(n => ({ message: lang === 'ar' ? n.messageAr : (n.messageEn || n.messageAr) })),
    ugcPhotos: dish.ugcPhotos.map(p => p.photoUrl),
  })
}
*/

// ═══════════════════════════════════════════════════════════════════
// FILE 3 — app/api/r/dishes/[id]/model3d/route.ts
// POST — upload GLB 3D model (restaurant dashboard only)
// ═══════════════════════════════════════════════════════════════════
/*
import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
  credentials: {
    accessKeyId   : process.env.CLOUDFLARE_R2_ACCESS_KEY!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY!,
  },
})

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Auth check
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const restaurantId = session.user.restaurantId as string
  const dishId       = params.id

  // Verify dish belongs to this restaurant
  const dish = await prisma.dish.findFirst({ where: { id: dishId, restaurantId } })
  if (!dish) return NextResponse.json({ error: 'Dish not found' }, { status: 404 })

  // Check plan
  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } })
  if (restaurant?.plan === 'STARTER') {
    return NextResponse.json({ error: 'Upgrade to Pro to upload 3D models' }, { status: 403 })
  }

  // Read multipart form data
  const formData = await req.formData()
  const file     = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

  // Validate file type
  const filename = file.name.toLowerCase()
  if (!filename.endsWith('.glb') && !filename.endsWith('.gltf')) {
    return NextResponse.json({ error: 'Only .glb and .gltf files are accepted' }, { status: 400 })
  }

  // Validate size (50MB max)
  const MAX = 50 * 1024 * 1024
  if (file.size > MAX) {
    return NextResponse.json({ error: `File too large. Max 50MB, got ${(file.size/1024/1024).toFixed(1)}MB` }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  // Validate GLB magic bytes "glTF"
  if (filename.endsWith('.glb') && buffer.slice(0, 4).toString('ascii') !== 'glTF') {
    return NextResponse.json({ error: 'Invalid GLB file' }, { status: 400 })
  }

  // Mark as uploading
  await prisma.dish.update({ where: { id: dishId }, data: { model3dStatus: 'UPLOADING' } })

  // Upload to Cloudflare R2
  const key = `models/${restaurantId}/${dishId}/dish.glb`
  await r2.send(new PutObjectCommand({
    Bucket      : process.env.CLOUDFLARE_R2_BUCKET!,
    Key         : key,
    Body        : buffer,
    ContentType : 'model/gltf-binary',
    CacheControl: 'public, max-age=31536000, immutable',
    Metadata    : { dishId, restaurantId, uploadedAt: new Date().toISOString() },
  }))

  const modelUrl = `${process.env.NEXT_PUBLIC_CDN_URL}/${key}`
  const sizeKb   = Math.round(buffer.length / 1024)

  // Update DB
  await prisma.dish.update({
    where: { id: dishId },
    data: {
      model3dUrl     : modelUrl,
      model3dStatus  : 'READY',
      model3dSizeKb  : sizeKb,
      model3dUploadedAt: new Date(),
    },
  })

  return NextResponse.json({ modelUrl, sizeKb, status: 'READY' })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.dish.update({
    where: { id: params.id, restaurantId: session.user.restaurantId as string },
    data: { model3dUrl: null, model3dStatus: 'NONE', model3dSizeKb: null, model3dUploadedAt: null },
  })

  return NextResponse.json({ ok: true })
}
*/

// ═══════════════════════════════════════════════════════════════════
// FILE 4 — app/api/r/qr-codes/route.ts
// POST /api/r/qr-codes { tableNumber, tableLabel }
// ═══════════════════════════════════════════════════════════════════
/*
import { NextRequest, NextResponse } from 'next/server'
import { generateTableQR } from '@/lib/qrGenerator'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tableNumber, tableLabel } = await req.json()
  if (!tableNumber) return NextResponse.json({ error: 'tableNumber is required' }, { status: 400 })

  const restaurantId = session.user.restaurantId as string
  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } })
  if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

  const result = await generateTableQR({
    restaurantId,
    restaurantSlug   : restaurant.slug,
    restaurantNameAr : restaurant.nameAr,
    restaurantNameEn : restaurant.nameEn,
    primaryColor     : restaurant.primaryColor,
    tableNumber,
    tableLabel,
    logoUrl          : restaurant.logoUrl ?? undefined,
  })

  // Save to DB
  await prisma.qrCode.upsert({
    where: { restaurantId_tableNumber: { restaurantId, tableNumber } },
    update: { qrData: result.qrUrl, qrSvgUrl: result.svgUrl, qrPdfUrl: result.pdfUrl },
    create: { restaurantId, tableNumber, tableLabel, qrData: result.qrUrl, qrSvgUrl: result.svgUrl, qrPdfUrl: result.pdfUrl },
  })

  return NextResponse.json(result)
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const qrCodes = await prisma.qrCode.findMany({
    where: { restaurantId: session.user.restaurantId as string },
    orderBy: { tableNumber: 'asc' },
  })

  return NextResponse.json({ qrCodes })
}
*/

// ═══════════════════════════════════════════════════════════════════
// FILE 5 — app/api/menu/cart/route.ts
// POST /api/menu/cart { dishId, quantity, tableNumber }
// ═══════════════════════════════════════════════════════════════════
/*
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const { dishId, quantity = 1, tableNumber } = await req.json()

  // Device fingerprint (anonymous — no login needed)
  const ip         = req.headers.get('x-forwarded-for') || 'unknown'
  const ua         = req.headers.get('user-agent') || ''
  const deviceHash = crypto.createHash('sha256').update(ip + ua).digest('hex').slice(0, 16)

  const dish = await prisma.dish.findUnique({
    where: { id: dishId },
    include: { restaurant: { select: { id: true } } },
  })
  if (!dish) return NextResponse.json({ error: 'Dish not found' }, { status: 404 })

  // Create or update order (one per table session)
  const existingOrder = await prisma.order.findFirst({
    where: {
      restaurantId: dish.restaurant.id,
      tableNumber : tableNumber || 'counter',
      deviceHash,
      status      : 'PENDING',
    },
  })

  if (existingOrder) {
    // Add item to existing order
    await prisma.orderItem.create({
      data: { orderId: existingOrder.id, dishId, quantity, unitPrice: dish.price },
    })
    await prisma.order.update({
      where: { id: existingOrder.id },
      data: { total: { increment: dish.price.toNumber() * quantity } },
    })
    return NextResponse.json({ orderId: existingOrder.id, added: true })
  } else {
    // Create new order
    const order = await prisma.order.create({
      data: {
        restaurantId: dish.restaurant.id,
        tableNumber : tableNumber || 'counter',
        deviceHash,
        total       : dish.price.toNumber() * quantity,
        items       : { create: { dishId, quantity, unitPrice: dish.price } },
      },
    })
    return NextResponse.json({ orderId: order.id, added: true })
  }
}
*/

export {}  // Make this a module
