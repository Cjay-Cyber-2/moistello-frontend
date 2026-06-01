# Signup Page Audit Report

## Overview
**File**: `src/app/(auth)/register/page.tsx` (914 lines)  
**Purpose**: Registration with wallet connection + profile setup (display name, email, country, language)

---

## Critical Flaws & Errors

### 1. Inconsistent WC2 Approval State Handling
**Location**: `page.tsx:178-179`

```typescript
await connect("walletconnect")
// Connection approval is handled by the session event handler
// State will be updated when user approves via wallet
```

**Issue**: Unlike login page (line 172), this doesn't set `setWc2PairingState("approved")` immediately. However, both have race conditions because the state update happens in the adapter callback, not in response to actual user approval.

---

### 2. Profile Step Lacks Wallet Context Validation
**Location**: `page.tsx:751-810`

The profile step renders when `step === "profile"` and `address` exists, but doesn't validate that the address came from a completed passkey registration. If a user connects a wallet, disconnects, and reconnects, the profile step still shows with stale data.

---

### 3. Missing Validation for Country/Language Fields
Country and language are optional in backend but have no explicit validation in the UI. Empty strings are sent if not selected.

---

## Design / Architecture Flaws

### 1. Monolithic Page Structure
914 lines containing:
- Wallet selection grid
- WC2 QR deep-link handling
- Passkey email form
- Profile form (4 fields)
- Signature flow
- Success/error states

**Should be**:
```
src/components/auth/registration/
├── RegistrationWizard.tsx
├── RegistrationStep1Choose.tsx
├── RegistrationStep2PasskeyEmail.tsx
├── RegistrationStep3Profile.tsx
├── RegistrationStep4Sign.tsx
└── RegistrationSuccess.tsx
```

---

### 2. State Scattered Across Multiple Stores
The page uses:
- `useMultiWalletStore` - wallet connection, passkey state, WC2 pairing
- `useAuthStore` - auth tokens, user
- `useUIStore` - toasts

But `useAuthFlowStore` exists with registration-specific state (`profile`, `auth`) that's NOT used. The page manages its own `step` state with local `useState` while `auth-flow-store` has an unused state machine.

---

### 3. Step State Machine Inconsistency
```typescript
type Step = "choose" | "passkey-email" | "profile" | "sign"
```

vs the unused flow store:

```typescript
status: "idle" | "detecting_wallets" | "connecting" | "awaiting_approval" | 
  "connected" | "signing" | "signed" | "error" | "authenticated"
```

The steps don't align with the flow states, causing confusion about what "state" means in each context.

---

### 4. Profile Validation Scattered
`validateProfile()` (lines 261-278) validates `displayName` and `profileEmail`, but:
- Country/language have no validation
- Error state is stored in local `fieldErrors` instead of store
- No async validation (e.g., display name uniqueness)

---

## Security Issues

### 1. Passkey Credential Storage
Passkey credentials are stored in-memory via `credentialStore` Map in `passkey/store.ts`. On page refresh, the passphrase is lost and users must re-register.

**Impact**: Not a direct vulnerability, but poor UX for passkey users.

---

### 2. Signature Exposure in UI
Lines 847-859 display the signature in truncated form in the UI:

```typescript
<p className="text-xs text-muted-foreground font-mono truncate">
  {signature.slice(0, 16)}...{signature.slice(-8)}
</p>
```

**Impact**: Low - signature is already signed by user's wallet, but displaying it encourages unsafe practices.

---

### 3. No Rate Limiting on Registration
The registration endpoint hit at line 310 has no client-side rate limiting. The `signMessage` call already consumed a nonce, so failed attempts waste resources.

---

## Code Quality Issues

### 1. Massive Component
At 914 lines, this component violates single-responsibility principle. Code is split into step blocks but remains in one file.

### 2. Duplicate Passkey Flow
Both login and register have passkey handling, but:
- Login: has broken `handleSelectWallet` for passkey
- Register: has complete `handlePasskeyCreate` flow
- Both duplicate state management

Should share a `usePasskeyAuth` hook.

### 3. Inconsistent Button Styling
Uses both `Button` component from `@/components/ui/button` and native `<button>` with `gradient-bg-extended` styling.

### 4. Rabet Adapter XDR Bug (affects registration)
**Location**: `rabet.ts:54-58`

```typescript
async signMessage(message: string) {
  const result = await api.sign(message, "testnet")  // ← Rabet sign() expects XDR
```

Rabet's `sign()` method expects a Stellar transaction XDR, not a plain message. This creates invalid signatures.

### 5. Freighter Adapter XDR Bug
**Location**: `freighter.ts:39-44`

```typescript
const xdr = await window.freighterApi.signMessage(message)
const fakeXdr = `AAAAAgAAAAB${xdr}${encodedMessage}`
```

Constructs an invalid XDR format. `signMessage` returns just a signature, not XDR.

---

## UX Problems

### 1. Country Dropdown Truncation
Country names like "Democratic Republic of the Congo" may be truncated in the grid layout. No search/filter.

### 2. No Progress Persistence
If user refreshes during registration, all progress is lost. Profile data isn't persisted to sessionStorage.

### 3. Auto-Redirect on Success
On successful registration, immediately redirects to dashboard without showing a success confirmation. User may be confused about what happened.

### 4. Missing Back Navigation Context
The "Back" button on passkey-email step (line 642) resets `fieldErrors` but doesn't clear the email input value.

---

## Recommendations Priority

| Priority | Issue | Action |
|----------|-------|--------|
| P0 | Rabet signMessage XDR format | Fix to use proper auth XDR construction |
| P0 | Freighter signMessage XDR format | Fix to construct valid Stellar auth XDR |
| P1 | Decompose into step components | Create RegistrationWizard with dedicated step components |
| P1 | Unify passkey flow | Extract shared hook, fix login passkey bug |
| P2 | Persist registration progress | Use sessionStorage for profile step data |
| P2 | Add async validation | Check display name availability before sign step |
| P3 | Improve country selector | Add search/typeahead for long list |
| P3 | Show success confirmation | Display "Account created!" before redirect |

---

## Specific File Locations

| Component | Line Range | Purpose |
|-----------|-----------|---------|
| Step state | 49, 122 | Local step state management |
| handleSelectWallet | 154-213 | Wallet selection handler (WC2 flow) |
| handlePasskeyCreate | 229-259 | Passkey registration flow |
| handleSignAndRegister | 286-360 | Final signature + registration |
| Profile step | 750-811 | Profile form UI |
| WC2 deep link | 475-492 | Mobile wallet deep link rendering |