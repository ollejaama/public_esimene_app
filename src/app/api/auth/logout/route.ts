import { NextRequest, NextResponse } from 'next/server'
import { createSSRClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = createSSRClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/login', req.url))
}
