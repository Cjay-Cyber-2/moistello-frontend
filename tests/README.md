# E2E Tests

This directory contains end-to-end tests for the Moistello application using Playwright.

## Prerequisites

- Dev server must be running on `http://localhost:1110`
- Run `npm run dev` before executing tests

## Running Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run with Playwright UI (interactive mode)
npm run test:e2e:ui

# Run with visible browser
npm run test:e2e:headed
```

## Test Structure

```
tests/
├── helpers/
│   └── api-mocks.ts       # API mocking utilities using page.route()
├── e2e/
│   ├── registration.spec.ts    # User registration flow
│   ├── passkey-login.spec.ts   # Passkey authentication
│   ├── circle-creation.spec.ts # Circle creation wizard
│   ├── contributions.spec.ts    # Contributions list and filtering
│   └── payout-claim.spec.ts    # Payouts and claiming
└── tsconfig.json              # TypeScript config for tests
```

## API Mocking

All tests use `page.route()` to mock API responses, so no backend is required. The `ApiMocker` class in `helpers/api-mocks.ts` provides pre-configured mocks for:

- Registration endpoints (`/auth/register`, `/auth/register/verify`)
- Passkey authentication (`/auth/passkey/nonce`, `/auth/passkey/verify`)
- Wallet creation (`/wallet/create`)
- Circle operations (`/circles`)
- Contributions (`/contributions`)
- Payouts (`/payouts`)

## Test Coverage

### Registration Flow
- Email/password submission
- OTP verification
- Profile setup
- Wallet creation
- Passkey linking
- Validation errors

### Passkey Login
- WebAuthn credential mocking
- Passkey authentication flow
- Error handling
- Method switching (wallet/password/passkey)

### Circle Creation
- Multi-step wizard navigation
- Form validation
- API success/failure scenarios
- Step-by-step progression

### Contributions
- List display with summary cards
- Filtering by circle, amount, date
- Search functionality
- Pagination
- Empty and error states

### Payouts
- Payout list display
- Claiming payouts
- Transaction links to Stellar explorer
- Pagination
- Empty and error states
