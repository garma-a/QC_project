import { NextRequest, NextResponse } from 'next/server';
import {
  mockMachines,
  mockProfile,
  mockSections,
  mockQcTests,
  mockControlLots,
  mockAlerts,
  mockDashboard,
  mockMachineHistory,
  mockQcHistory,
  mockQcMachines
} from '@/data/mocks';

export async function GET(req: NextRequest, props: { params: Promise<{ slug: string[] }> }) {
  const params = await props.params;
  const slug = params.slug;
  return handleProxyOrMock(req, slug, 'GET');
}

export async function POST(req: NextRequest, props: { params: Promise<{ slug: string[] }> }) {
  const params = await props.params;
  const slug = params.slug;
  return handleProxyOrMock(req, slug, 'POST');
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ slug: string[] }> }) {
  const params = await props.params;
  const slug = params.slug;
  return handleProxyOrMock(req, slug, 'PATCH');
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ slug: string[] }> }) {
  const params = await props.params;
  const slug = params.slug;
  return handleProxyOrMock(req, slug, 'DELETE');
}

async function handleProxyOrMock(req: NextRequest, slug: string[], method: string) {
  const backendUrl = process.env.BACKEND_URL;
  const path = `/api/${(slug || []).join('/')}`;
  const queryString = req.nextUrl.search;

  if (backendUrl) {
    try {
      let authHeader = req.headers.get('authorization') || '';
      if (authHeader && !authHeader.toLowerCase().startsWith('bearer ')) {
        authHeader = `Bearer ${authHeader}`;
      }

      // Try to fetch from the real backend
      const response = await fetch(`${backendUrl}${path}${queryString}`, {
        method,
        headers: {
          'Content-Type': req.headers.get('content-type') || 'application/json',
          'Authorization': authHeader,
        },
        // Only include body if it's not a GET/HEAD request
        ...(method !== 'GET' && method !== 'HEAD' && { body: await req.text() })
      });

      if (response.ok) {
        return response; // Success from real backend
      } else {
        console.warn(`[Proxy Fallback] Real backend returned ${response.status} for ${path}. Falling back to mock data.`);
      }
    } catch (error) {
      console.warn(`[Proxy Fallback] Failed to reach real backend for ${path}. Falling back to mock data.`);
    }
  }

  // Fallback to mock data based on the path
  return getMockResponse(path, method, req);
}

function getMockResponse(path: string, method: string, req: NextRequest) {
  if (method === 'GET') {
    if (path.startsWith('/api/v1/users/me/profile')) return NextResponse.json(mockProfile);
    if (path.startsWith('/api/v1/sections')) return NextResponse.json(mockSections);
    if (path.startsWith('/api/v1/machines')) return NextResponse.json(mockMachines);
    if (path.startsWith('/api/v1/qc-tests')) return NextResponse.json(mockQcTests);
    if (path.startsWith('/api/v1/control-lots')) return NextResponse.json(mockControlLots);
    if (path.startsWith('/api/v1/alerts')) return NextResponse.json(mockAlerts);
    if (path.startsWith('/api/v1/bff/dashboard/machine-history')) return NextResponse.json(mockMachineHistory);
    if (path.startsWith('/api/v1/bff/dashboard')) return NextResponse.json(mockDashboard);
    if (path.startsWith('/api/v1/bff/qc/history')) return NextResponse.json(mockQcHistory);
    if (path.startsWith('/api/v1/bff/qc/machines')) return NextResponse.json(mockQcMachines);
  }

  if (method === 'POST') {
    if (path.startsWith('/api/v1/auth/login') || path.startsWith('/api/v1/auth/refresh')) {
      const mockPayload = {
        userId: 1,
        role: 'ADMIN',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600 * 24 // 24 hours
      };
      // Base64 encode header and payload
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify(mockPayload)).toString('base64url');
      const mockJwt = `${header}.${payload}.mock_signature`;
      
      return NextResponse.json({ accessToken: mockJwt, refreshToken: mockJwt });
    }
    return NextResponse.json({ message: 'Mock POST success', id: Date.now() });
  }

  if (method === 'PATCH' || method === 'DELETE') {
    return NextResponse.json({ message: `Mock ${method} success` });
  }

  return NextResponse.json({ message: 'Mock endpoint not configured' }, { status: 404 });
}
