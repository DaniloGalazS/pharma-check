import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      medication: {
        include: {
          prices: {
            orderBy: { scrapedAt: 'desc' },
            take: 5,
            include: { pharmacy: { select: { chain: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ favorites })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { medicationId } = await req.json()
  if (!medicationId) return NextResponse.json({ error: 'medicationId requerido' }, { status: 400 })

  const favorite = await prisma.favorite.upsert({
    where: { userId_medicationId: { userId: session.user.id, medicationId } },
    create: { userId: session.user.id, medicationId },
    update: {},
  })

  return NextResponse.json({ favorite }, { status: 201 })
}
