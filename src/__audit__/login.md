# Login Page Audit Report

## Overview
**File**: `src/app/(auth)/login/page.tsx` (557 lines)  
**Purpose**: Wallet-based authentication via extension, mobile (WalletConnect), hardware (Ledger), or passkey

---

## Critical Flaws & Errors

### 1. Passkey Login Button Non-Functional
**Location**: `page.tsx:151-153`

```typescript
const handleSelectWallet = useCallback(
  async (walletId: string) => {
    if (walletId === "passkey") {
      return  // ← BUG: Returns immediately without action
    }
```

**Impact**: Passkey login is completely broken. Clicking the passkey button does nothing because the handler returns early instead of calling `handlePasskeyConnect`.

**Fix**: Remove the early return or delegate to `handlePasskeyConnect`:
```typescript
if (walletId === "passkey") {
  await handlePasskeyConnect()
  return
}
```

---

### 2. Missing Email for Passkey Authentication
The login page has no email input field, but passkey authentication requires an email to derive the keypair. The register page collects email in `step === "passkey-email"` but login skips this entirely.

**Impact**: Passkey login would fail at the backend because the derived keypair needs the email for PBKDF2 key derivation.

---

### 3. WC2 Pairing State Set Before User Approval
**Location**: `page.tsx:172`

```typescript
await connect("walletconnect")
setWc2PairingState("approved")  // ← Set BEFORE user actually approves
```

**Impact**: UI shows "approved" state immediately after `connect()` call, but actual approval happens asynchronously when the user opens their wallet. This creates a UX disconnect and potential race conditions.

**Correct flow**: Set to `"awaiting_approval"` after URI generation, let session manager or callback update to `"approved"` when user actually approves.

---

### 4. QR Code Countdown Starts Prematurely
**Location**: `walletconnect-qr.tsx:52-66`

Countdown logic triggers on `pairingState === "pairing"` but the QR code (`uri`) may not be available yet. Users see countdown ticking to a non-existent QR.

---

## Design / Architecture Flaws

### 1. Redundant Store Definitions
Three stores manage overlapping authentication state:

| Store | Purpose | Used by Login? |
|-------|---------|---------------|
| `multi-wallet-store.ts` | Wallet connection, passkey state, WC2 pairing | ✅ Yes |
| `auth-store.ts` | Auth tokens, user, isAuthenticated | ✅ Yes |
| `auth-flow-store.ts` | Auth flow state machine | ❌ No |

**Impact**: State conflicts, duplicated logic, maintenance burden. `auth-flow-store.ts` defines a proper state machine pattern that's unused.

---

### 2. Unidirectional Data Flow Violation
Login page reads directly from stores via selectors but writes via `useMultiWalletStore.getState()` in callbacks. This breaks React's reactivity model and can cause stale closures.

**Example**: `handlePasskeyConnect` calls `useMultiWalletStore.getState().address` instead of using the `address` selector.

---

### 3. No Loading State During Wallet Scan
`scanWallets()` runs on mount but there's no loading indicator until after the check completes. Users see a flash of empty state.

---

## Security Issues

### 1. Weak HMAC in WC2 Session Store
**Location**: `wc2-session-store.ts:27-34`

```typescript
function computeHMAC(data: string): string {
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash  // ← NOT cryptographic
  }
  return hash.toString(36)
}
```

**Impact**: Trivial to forge. An attacker can tamper with localStorage session data without detection.

**Fix**: Use Web Crypto API for SHA-256 based HMAC or store credentials server-side.

---

### 2. Passkey Secret Key in Memory
The derived secret key (seed) lives in memory during the session. While `secureZeroMemory` exists in `key-derivation.ts`, it's only called on disconnect—not before the public key is exposed.

---

## Code Quality Issues

### 1. Monolithic Component Size
557 lines for a single page with multiple states (choose, sign, WC2 QR modal). Should be decomposed:
- `WalletChooser` component
- `WC2PairingDialog` component
- `PasskeyLoginPrompt` component

### 2. Duplicate WC2 Flow Logic
Similar WC2 handling exists in both `page.tsx` and `wc2-session-manager.ts`. The page directly imports and calls `setOnPairingUri` from `walletconnect.ts` while `wc2-session-manager.ts` provides a cleaner singleton pattern.

### 3. Inconsistent Error Type Access
Uses both typed errors (`err instanceof Error`) and adapter error codes. Should normalize to structured error types.

---

## Improvements (Basic → Peak)

### Current State
1. Click wallet → connect → sign message → login API
2. Error toast on failure
3. WC2 QR modal for mobile wallets

### Peak Improvements

1. **Implement Proper State Machine**
   ```
   idle → scanning → wallet_selected → connecting → awaiting_approval → connected → signing → authenticated
   ```

2. **Add Email Input for Passkey Login**
   - Mirror register flow: "Enter email" step before passkey authentication

3. **Secure Storage**
   - Replace localStorage HMAC with server-side session validation
   - Add token encryption at rest

4. **Component Decomposition**
   ```
   src/components/auth/
   ├── PasskeyLoginForm.tsx
   ├── WalletGrid.tsx
   ├── WC2PairingView.tsx
   └── LedgerConnectModal.tsx
   ```

5. **Unified Error Handling**
   - Create `AuthError` type with `code`, `userMessage`, `retryable`
   - Map all errors through centralized handler

6. **Connection Timeout Handling**
   - Auto-cancel WC2 after 120s timeout
   - Visual countdown in UI

7. **Accessibility**
   - Add `aria-live` regions for status updates
   - Keyboard navigation for all wallet options

---

## Recommendations Priority

| Priority | Issue | Action |
|----------|-------|--------|
| P0 | Passkey login returns early | Fix `handleSelectWallet` to call `handlePasskeyConnect` |
| P0 | Weak HMAC in session store | Replace with crypto.subtle HMAC or server sessions |
| P1 | Add email input for passkey | Create passkey-email step like register page |
| P1 | WC2 state race condition | Move to event-driven state updates |
| P2 | Decompose monolith | Split into focused components |
| P2 | Consolidate stores | Either use `auth-flow-store` OR remove it |
| P3 | Add retry/backoff | Handle transient network failures gracefully |