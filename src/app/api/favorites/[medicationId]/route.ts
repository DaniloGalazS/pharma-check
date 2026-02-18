import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ medicationId: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { medicationId } = await params
  await prisma.favorite.deleteMany({
    where: { userId: session.user.id, medicationId },
  })

  return NextResponse.json({ ok: true })
}
