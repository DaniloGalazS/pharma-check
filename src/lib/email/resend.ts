import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM ?? 'alertas@pharmacheck.cl'

export interface PriceAlertEmailData {
  to: string
  userName: string
  medicationName: string
  medicationId: string
  pharmacyName: string
  chainName: string
  currentPrice: number
  targetPrice: number
}

export async function sendPriceAlertEmail(data: PriceAlertEmailData) {
  const formatCLP = (n: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

  const url = `${process.env.NEXTAUTH_URL}/medications/${data.medicationId}`

  await resend.emails.send({
    from: FROM,
    to: data.to,
    subject: `💊 ${data.medicationName} bajó a ${formatCLP(data.currentPrice)}`,
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 20px;">
  <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.1);">
    <div style="background: #059669; padding: 24px; text-align: center;">
      <p style="color: white; font-size: 24px; margin: 0; font-weight: 700;">💊 PharmaCheck</p>
    </div>
    <div style="padding: 32px 24px;">
      <p style="color: #374151; margin: 0 0 8px;">Hola <strong>${data.userName}</strong>,</p>
      <p style="color: #374151; margin: 0 0 24px;">
        El precio de <strong>${data.medicationName}</strong> bajó del umbral que configuraste.
      </p>

      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">
        <p style="color: #6b7280; font-size: 13px; margin: 0 0 4px;">Precio actual en ${data.chainName}</p>
        <p style="color: #059669; font-size: 36px; font-weight: 700; margin: 0;">${formatCLP(data.currentPrice)}</p>
        <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0;">Tu umbral: ${formatCLP(data.targetPrice)}</p>
        <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0;">${data.pharmacyName}</p>
      </div>

      <a href="${url}" style="display: block; background: #059669; color: white; text-align: center; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
        Ver precio y comparar →
      </a>

      <p style="color: #9ca3af; font-size: 12px; margin: 24px 0 0; text-align: center;">
        Puedes administrar tus alertas en <a href="${process.env.NEXTAUTH_URL}/alerts" style="color: #059669;">PharmaCheck → Alertas</a>
      </p>
    </div>
  </div>
</body>
</html>`,
  })
}
