import { redirect } from 'next/navigation'

// /calendar is the post-login destination for athletes.
// The Calendar view lives at /activities.
export default function CalendarPage() {
  redirect('/activities')
}
