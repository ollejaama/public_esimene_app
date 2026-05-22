import { Resend } from 'resend'

const FROM = process.env.RESEND_FROM_ADDRESS ?? 'Atlas <hello@atlas.training>'

function getResend() {
  if (!process.env.RESEND_API_KEY) return null
  return new Resend(process.env.RESEND_API_KEY)
}

export async function sendWelcomeEmail(email: string, role: 'athlete' | 'coach') {
  const resend = getResend()
  if (!resend) return

  const subject =
    role === 'coach'
      ? 'Welcome to Atlas — your coaching dashboard is ready'
      : 'Welcome to Atlas — your training log is ready'

  const text =
    role === 'coach'
      ? `Your coach account is ready. Once your athletes connect Strava, you'll be able to follow their training from the Atlas coach dashboard.\n\nhttps://atlas.training/coach`
      : `Your athlete account is ready. Head to Settings to connect your Strava account and start syncing activities.\n\nhttps://atlas.training/settings`

  await resend.emails.send({ from: FROM, to: email, subject, text })
}

export async function sendInviteEmail(
  toEmail: string,
  coachName: string,
  teamName: string | null,
  appUrl: string
) {
  const resend = getResend()
  if (!resend) return

  const subject = teamName
    ? `${coachName} has invited you to join their team on Atlas`
    : `${coachName} wants to follow your training on Atlas`

  const body = teamName
    ? `${coachName} has invited you to join the team "${teamName}" on Atlas.\n\nSign in to Atlas to accept or decline the invite from your Settings page.\n\n${appUrl}/settings`
    : `${coachName} has requested coaching access to your training log on Atlas.\n\nSign in to Atlas to accept or decline from your Settings page.\n\n${appUrl}/settings`

  await resend.emails.send({ from: FROM, to: toEmail, subject, text: body })
}

export async function sendInviteAcceptedEmail(
  toEmail: string,
  athleteName: string,
  teamName: string | null
) {
  const resend = getResend()
  if (!resend) return

  const subject = `${athleteName} accepted your invite on Atlas`
  const text = teamName
    ? `${athleteName} has joined your team "${teamName}" on Atlas. You can now view their training calendar.\n\nhttps://atlas.training/coach`
    : `${athleteName} has accepted your coaching access request on Atlas. You can now view their training calendar.\n\nhttps://atlas.training/coach`

  await resend.emails.send({ from: FROM, to: toEmail, subject, text })
}

export async function sendPasswordResetEmail(email: string, resetLink: string) {
  const resend = getResend()
  if (!resend) return

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Reset your Atlas password',
    text: `Click the link below to reset your password. This link expires in 1 hour.\n\n${resetLink}\n\nIf you didn't request a password reset, you can safely ignore this email.`,
  })
}
