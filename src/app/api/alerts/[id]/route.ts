import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id } = await params
  const { active, targetPrice } = await req.json()

  const alert = await prisma.priceAlert.updateMany({
    where: { id, userId: session.user.id },
    data: {
      ...(active !== undefined && { active }),
      ...(targetPrice !== undefined && { targetPrice }),
    },
  })

  return NextResponse.json({ alert })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id } = await params
  await prisma.priceAlert.deleteMany({ where: { id, userId: session.user.id } })
  return NextResponse.json({ ok: true })
}
