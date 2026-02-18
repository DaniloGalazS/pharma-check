import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const alerts = await prisma.priceAlert.findMany({
    where: { userId: session.user.id },
    include: {
      medication: { select: { id: true, genericName: true, commercialName: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ alerts })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { medicationId, targetPrice, chain } = await req.json()
  if (!medicationId || !targetPrice) {
    return NextResponse.json({ error: 'medicationId y targetPrice son requeridos' }, { status: 400 })
  }

  const alert = await prisma.priceAlert.create({
    data: {
      userId: session.user.id,
      medicationId,
      targetPrice,
      chain: chain ?? null,
      active: true,
    },
  })

  return NextResponse.json({ alert }, { status: 201 })
}
