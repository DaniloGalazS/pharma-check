import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { Prisma } from '@prisma/client'

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const subscription = await req.json()

  await prisma.user.update({
    where: { id: session.user.id },
    data: { pushSubscription: subscription },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  await prisma.user.update({
    where: { id: session.user.id },
    data: { pushSubscription: Prisma.DbNull },
  })

  return NextResponse.json({ ok: true })
}
