import type { Page, Route } from '@playwright/test'

export interface MockResponse {
  status: number
  body: any
  headers?: Record<string, string>
}

export class ApiMocker {
  constructor(private page: Page) {}

  /**
   * Mock a specific API endpoint
   */
  async mockEndpoint(urlPattern: string | RegExp, response: MockResponse, method?: string): Promise<void> {
    await this.page.route(urlPattern, (route: Route) => {
      // Playwright consults routes newest-first; when a broader pattern
      // (e.g. new RegExp('/(api|v1)/circles') for the list) shadows a narrower one
      // ('**/api/circles' POST), defer to the next matching handler.
      if (method && route.request().method() !== method) {
        return route.fallback()
      }
      route.fulfill({
        status: response.status,
        contentType: 'application/json',
        headers: response.headers,
        body: JSON.stringify(response.body),
      })
    })
  }

  /**
   * Mock multiple endpoints at once
   */
  async mockEndpoints(mocks: Record<string, MockResponse>): Promise<void> {
    for (const [pattern, response] of Object.entries(mocks)) {
      await this.mockEndpoint(pattern, response)
    }
  }

  /**
   * Mock authentication endpoints for registration
   */
  async mockRegistration(): Promise<void> {
    await this.mockEndpoints({
      '**/api/auth/register': {
        status: 200,
        body: { success: true },
      },
      '**/api/auth/register/verify': {
        status: 200,
        body: {
          token: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token',
          user: {
            id: 'user-123',
            email: 'test@example.com',
            displayName: 'Test User',
            moiScore: 50,
          },
        },
      },
      '**/api/claim-name': {
        status: 200,
        body: { name: 'Test User' },
      },
      '**/api/users/me': {
        status: 200,
        body: {
          id: 'user-123',
          displayName: 'Test User',
          preferredLanguage: 'en',
        },
      },
    })
  }

  /**
   * Mock authentication endpoints for passkey login
   */
  async mockPasskeyLogin(): Promise<void> {
    await this.mockEndpoints({
      '**/api/auth/passkey/nonce': {
        status: 200,
        body: { nonce: 'mock-nonce-12345' },
      },
      '**/api/auth/passkey/verify': {
        status: 200,
        body: {
          token: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token',
          user: {
            id: 'user-123',
            email: 'test@example.com',
            displayName: 'Test User',
            moiScore: 50,
          },
        },
      },
    })
  }

  /**
   * Mock wallet creation endpoint
   */
  async mockWalletCreation(): Promise<void> {
    await this.mockEndpoint(new RegExp('/(api|v1)/wallet/create'), {
      status: 200,
      body: {
        publicKey: 'GABCD1234567890EFGHIJKLMNOPQRSTUVWXYZ',
        fundingStatus: 'funded',
        trustlineStatus: 'ready',
        usdcTrustline: true,
      },
    })
  }

  /**
   * Mock passkey linking endpoint
   */
  async mockPasskeyLink(): Promise<void> {
    await this.mockEndpoint(new RegExp('/(api|v1)/auth/passkey/link'), {
      status: 200,
      body: { success: true },
    })
  }

  /**
   * Mock circle creation endpoint
   */
  async mockCircleCreation(): Promise<void> {
    await this.mockEndpoint(new RegExp('^https?://[^/]+/(api|v1)/circles$'), {
      status: 200,
      body: {
        circle: {
          id: 'circle-123',
          name: 'Test Savings Circle',
          description: 'A test circle for E2E testing',
          circleType: 'public',
          payoutType: 'random',
          contributionAmount: 100,
          currency: 'USDC',
          frequency: 'monthly',
          maxMembers: 10,
          createdAt: new Date().toISOString(),
        },
      },
    })
  }

  /**
   * Mock circles list endpoint
   */
  async mockCirclesList(): Promise<void> {
    await this.mockEndpoint(new RegExp('/(api|v1)/circles'), {
      status: 200,
      body: {
        circles: [
          {
            id: 'circle-123',
            name: 'Test Savings Circle',
            description: 'A test circle for E2E testing',
            circleType: 'public',
            contributionAmount: 100,
            currency: 'USDC',
            maxMembers: 10,
          },
        ],
      },
    }, 'GET')
  }

  /**
   * Mock contributions endpoint
   */
  async mockContributions(): Promise<void> {
    await this.mockEndpoint(new RegExp('/(api|v1)/contributions'), {
      status: 200,
      body: {
        contributions: [
          {
            id: 'contrib-1',
            circleId: 'circle-123',
            roundNumber: 1,
            amount: 100,
            currency: 'USDC',
            status: 'confirmed',
            onTime: true,
            createdAt: new Date().toISOString(),
            txnHash: 'abcd1234567890efghijklmnopqrstuvwxyz',
          },
        ],
        summary: {
          totalContributed: 100,
          average: 100,
          count: 1,
        },
        meta: {
          page: 1,
          totalPages: 1,
          total: 1,
        },
      },
    })
  }

  /**
   * Mock payouts endpoint
   */
  async mockPayouts(): Promise<void> {
    await this.mockEndpoint(new RegExp('/(api|v1)/payouts'), {
      status: 200,
      body: {
        payouts: [
          {
            id: 'payout-1',
            circleId: 'circle-123',
            roundNumber: 1,
            amount: 1000,
            currency: 'USDC',
            feeAmount: 10,
            status: 'confirmed',
            createdAt: new Date().toISOString(),
            txnHash: 'xyz9876543210abcdefghijklmnopqrstuv',
          },
        ],
        meta: {
          page: 1,
          totalPages: 1,
          total: 1,
        },
      },
    })
  }

  /**
   * Mock payout claim endpoint
   */
  async mockPayoutClaim(): Promise<void> {
    await this.mockEndpoint(new RegExp('/(api|v1)/payouts/[^/]+/claim'), {
      status: 200,
      body: {
        success: true,
        txnHash: 'claimed-transaction-hash-12345',
      },
    })
  }

  /**
   * Mock session check endpoint.
   *
   * Matches the real /api/auth/session GET handler which returns
   * { authenticated: true, token, expiresAt } so that the auth store's
   * rehydrateAccessToken() can restore the in-memory token.
   *
   * The token must be a real three-part JWT with a future `exp`: the auth
   * store parses it (extractTokenExpiry) and only short-circuits the session
   * check when the expiry is valid — otherwise it falls through to
   * POST /auth/me, which must then also be mocked or every protected page
   * renders null and all E2E specs time out.
   */
  async mockSession(): Promise<void> {
    const b64url = (obj: object) =>
      Buffer.from(JSON.stringify(obj)).toString('base64url')

    const now = Math.floor(Date.now() / 1000)
    const token = [
      b64url({ alg: 'none', typ: 'JWT' }),
      b64url({
        sub: 'user-1',
        walletAddress: '0x0000000000000000000000000000000000000001',
        exp: now + 3600,
        iat: now,
      }),
      'test-signature',
    ].join('.')

    // Seed the HttpOnly access-token cookie BEFORE navigation: Next.js
    // middleware gates every protected path on it server-side, and a
    // route-fulfilled Set-Cookie would arrive too late — the initial
    // document request is already redirected to /login.
    await this.page.context().addCookies([
      {
        name: 'moistello_token',
        value: token,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
        expires: now + 3600,
      },
    ])

    await this.mockEndpoint('**/api/auth/session', {
      status: 200,
      body: {
        authenticated: true,
        token,
        expiresAt: Date.now() + 3600000,
      },
    })

    // Belt and braces: any flow that still hits /auth/me gets a valid user.
    await this.mockEndpoint(new RegExp('/(api|v1)/auth/me'), {
      status: 200,
      body: {
        success: true,
        data: {
          user: {
            id: 'user-1',
            walletAddress: '0x0000000000000000000000000000000000000001',
            preferredLanguage: 'en',
            moiScore: 700,
          },
        },
      },
    })
  }

  /**
   * Clear all mocks
   */
  async clearMocks(): Promise<void> {
    await this.page.unrouteAll()
  }
}

/**
 * Helper to create an API mocker instance
 */
export function createApiMocker(page: Page): ApiMocker {
  return new ApiMocker(page)
}
