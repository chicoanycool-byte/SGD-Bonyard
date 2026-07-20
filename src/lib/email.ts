const REMITENTE = 'SGD Bonyard <notificaciones@sgd-bonyard.mx>'

export async function enviarCorreo(destinatarios: string[], asunto: string, cuerpoHtml: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || destinatarios.length === 0) return

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: REMITENTE,
        to: destinatarios,
        subject: asunto,
        html: cuerpoHtml,
      }),
    })
  } catch {
    // Si falla el correo no debe romper el flujo de la app;
    // la notificación dentro del sistema ya quedó registrada.
  }
}
