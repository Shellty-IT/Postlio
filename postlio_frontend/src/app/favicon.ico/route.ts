// src/app/favicon.ico/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.redirect(
        new URL('/favicon.svg', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
        { status: 301 }
    );
}

export const runtime = 'edge';