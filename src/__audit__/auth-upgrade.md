# Authentication System Enterprise Upgrade Plan

## Priority 0 - Critical Production Issues

### 1. Passkey Login Button Broken (login/page.tsx:151-153)

**Problem**: Clicking passkey login returns immediately without invoking the passkey flow.

```typescript
// CURRENT BROKEN CODE
const handleSelectWallet = useCallback(
  async (walletId: string) => {
    if (walletId === "passkey") {
      return  // ← Does nothing!
    }
```

**Enterprise Solution**:
```typescript
// FIX
const handleSelectWallet = useCallback(
  async (walletId: string) => {
    if (walletId === "passkey") {
      await handlePasskeyConnect()
      return
    }
```

**Better**: Extract into shared hook
```typescript
// src/lib/auth/use-passkey-auth.ts
export function usePasskeyAuth(mode: 'login' | 'register') {
  const connect = useMultiWalletStore((s) => s.connect)
  const setPasskeyState = useMultiWalletStore((s) => s.setPasskeyState)
  const setPasskeyPublicKey = useMultiWalletStore((s) => s.setPasskeyPublicKey)

  return useCallback(async (email?: string) => {
    setPasskeyState("registering")
    await connect("passkey")
    const address = useMultiWalletStore.getState().address
    if (address) setPasskeyPublicKey(address)
    setPasskeyState("connected")
  }, [connect, setPasskeyState, setPasskeyPublicKey])
}
```

---

### 2. Weak HMAC in WC2 Session Store (wc2-session-store.ts:27-34)

**Problem**: Uses JavaScript bit-shift hash that can be trivially forged.

```typescript
// CURRENT WEAK CODE
let hash = 0
for (let i = 0; i < data.length; i++) {
  const char = data.charCodeAt(i)
  hash = ((hash << 5) - hash) + char
  hash = hash & hash
}
return hash.toString(36)
```

**Enterprise Solution**:
```typescript
// src/lib/wallet/wc2-session-store.ts
const SESSION_SECRET = process.env.NEXT_PUBLIC_WALLETCONNECT_SESSION_SECRET || crypto.getRandomValues(new Uint8Array(32))

export async function computeHMAC(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw", 
    typeof SESSION_SECRET === 'string' ? new TextEncoder().encode(SESSION_SECRET) : SESSION_SECRET,
    { name: "HMAC", hash: "SHA-256" }, 
    false, 
    ["sign"]
  )
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}
```

**Best Enterprise Solution**: Server-side session validation
- Store session data server-side with user's refresh token
- Client stores only opaque session ID
- Validate on each authenticated request

---

### 3. Rabet/Freighter Invalid XDR Format (rabet.ts:57, freighter.ts:41)

**Problem**: Both adapters pass raw messages to sign methods expecting XDR.

**Rabet (rabet.ts:57)**:
```typescript
// BROKEN
const result = await api.sign(message, "testnet")  // sign() expects XDR
```

**Freighter (freighter.ts:41)**:
```typescript
// BROKEN
const fakeXdr = `AAAAAgAAAAB${xdr}${encodedMessage}`  // Invalid XDR structure
```

**Enterprise Solution** - Create shared utility:
```typescript
// src/lib/auth/stellar-xdr.ts
export async function createAuthXDR(message: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(`moistello-auth:${message}`)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")
  return btoa(`MOISTELLO_AUTH:${hash}:${Date.now()}`)
}

// src/lib/wallet/adapters/rabet.ts
async signMessage(message: string) {
  const xrd = await createAuthXDR(message)
  const result = await api.sign(xdr, "testnet")
  return { signature: result.signature || result.xdr, publicKey: await api.getPublicKey() }
}
```

---

## Priority 1 - High Priority Architectural Issues

### 4. WC2 State Race Condition (login/page.tsx:172)

**Problem**: Pairing state jumps to "approved" before user actually approves.

```typescript
await connect("walletconnect")
setWc2PairingState("approved")  // Set before actual approval!
```

**Enterprise Solution**:
```typescript
// src/lib/wallet/adapters/walletconnect.ts
export const approvalCallbacks = new Set<(state: PairingState) => void>()

export function subscribeToApprovalChanges(cb: (state: PairingState) => void): () => void {
  approvalCallbacks.add(cb)
  return () => approvalCallbacks.delete(cb)
}

// When wallet actually approves
function notifyApproval() {
  approvalCallbacks.forEach(cb => cb('approved'))
}

// In login/page.tsx
useEffect(() => {
  const unsub = subscribeToApprovalChanges(setWc2PairingState)
  return unsub
}, [])
```

---

### 5. Passkey Login Missing Email Input

**Problem**: Login has no email field; passkey requires email for key derivation.

**Enterprise Solution**: Add email step to login flow
```typescript
// Add to login/page.tsx
type Step = "choose" | "passkey-email" | "sign"

{step === "passkey-email" && (
  <div className="space-y-4">
    <Input
      type="email"
      value={passkeyEmail}
      onChange={e => setPasskeyEmail(e.target.value)}
      placeholder="you@example.com"
      required
    />
    <Button onClick={handlePasskeyConnect}>Continue with Passkey</Button>
  </div>
)}
```

---

### 6. Redundant Store Definitions

| Store | Current Purpose | Should Be |
|-------|---------------|-----------|
| `multi-wallet-store.ts` | Wallet connection, passkey state, WC2 pairing | Wallet connection state only |
| `auth-store.ts` | Tokens, user, isAuthenticated | Session tokens only |
| `auth-flow-store.ts` | Unused state machine | PRIMARY auth flow state |
| `wallet-store.ts` | Freighter-only store | Remove (duplicate) |

**Enterprise Solution**: Single unified store with typed reducer pattern:

```typescript
// src/stores/auth-store.ts
export type AuthFlowEvent =
  | { type: 'MODE_SET'; mode: 'login' | 'register' }
  | { type: 'WALLET_SCAN_START' }
  | { type: 'WALLET_SCAN_COMPLETE'; wallets: Wallet[] }
  | { type: 'WALLET_CONNECT_START'; walletId: string }
  | { type: 'WALLET_CONNECT_SUCCESS'; address: string }
  | { type: 'PASSKEY_EMAIL_SET'; email: string }
  | { type: 'PROFILE_UPDATE'; field: string; value: string }
  | { type: 'SIGN_START' }
  | { type: 'SIGN_SUCCESS'; signature: string; nonce: string }
  | { type: 'REGISTER_SUCCESS' }
  | { type: 'ERROR'; code: AuthErrorCode; message: string }

export const useAuthStore = create<AuthState>()(
  devtools((set) => ({
    mode: 'login',
    step: 'choose',
    wallets: [],
    connection: null,
    profile: initialProfile,
    auth: null,
    status: 'idle',
    
    dispatch: (event: AuthFlowEvent) => {
      set((state) => authReducer(state, event))
    }
  }))
)
```

---

## Priority 2 - Medium Priority Code Quality

### 7. Monolithic Login Page (557 lines)

**Enterprise Solution** - Component decomposition:
```
src/components/auth/login/
├── LoginLayout.tsx        # Page wrapper (bg, logo)
├── WalletSelector.tsx     # Extension wallet grid
├── WC2PairingModal.tsx   # QR/deep-link modal
├── PasskeySection.tsx     # Biometric login section
└── SigningView.tsx        # Connecting/signing state
```

---

### 8. Monolithic Register Page (914 lines)

**Enterprise Solution** - Step-based decomposition:
```
src/components/auth/register/
├── RegistrationLayout.tsx  # Page wrapper
├── ChooseWalletStep.tsx    # Wallet selection
├── PasskeyEmailStep.tsx    # Email entry
├── ProfileStep.tsx         # Form fields
└── VerifyStep.tsx          # Signature & submit
```

---

### 9. No Registration Progress Persistence

**Enterprise Solution**:
```typescript
// src/lib/auth/persistence.ts
const REGISTRATION_KEY = 'moistello-registration-progress'

export function saveRegistrationProgress(data: {
  step: RegistrationStep
  profile: { displayName: string; email?: string; country?: string; language: string }
}) {
  sessionStorage.setItem(REGISTRATION_KEY, JSON.stringify(data))
}

export function restoreRegistrationProgress(): RegistrationProgress | null {
  const saved = sessionStorage.getItem(REGISTRATION_KEY)
  return saved ? JSON.parse(saved) : null
}

// In RegisterPage
const [step, setStep] = useState<Step>(() => {
  const restored = restoreRegistrationProgress()
  return restored?.step || 'choose'
})
```

---

### 10. QR Code Countdown Starts Prematurely

**Enterprise Solution**:
```typescript
// src/components/wallet/WC2PairingView.tsx
const [countdown, setCountdown] = useState(120)

useEffect(() => {
  if (!uri) {
    setCountdown(120) // Reset but don't actively count
    return
  }
  
  const interval = setInterval(() => {
    setCountdown(prev => {
      if (prev <= 1) {
        clearInterval(interval)
        return 0
      }
      return prev - 1
    })
  }, 1000)

  return () => clearInterval(interval)
}, [uri]) // Only start when uri exists
```

---

## Priority 3 - Low Priority UX Enhancements

### 11. Country Dropdown Needs Search

**Enterprise Solution**:
```typescript
// src/components/ui/CountryCombobox.tsx
import { Combobox } from "@/components/ui/combobox"

export function CountryCombobox({ value, onChange }: Props) {
  const [search, setSearch] = useState("")
  
  const filtered = countries.filter(c =>
    c.label.toLowerCase().includes(search.toLowerCase())
  )
  
  return (
    <Combobox
      options={filtered}
      value={value}
      onChange={onChange}
      onSearchChange={setSearch}
      placeholder="Search countries..."
      searchPlaceholder="Type to search..."
    />
  )
}
```

---

### 12. Missing Success Confirmation

**Enterprise Solution**:
```typescript
// src/components/auth/shared/SuccessView.tsx
interface SuccessViewProps {
  title: string
  description: string
  autoRedirectIn?: number
  onRedirect?: () => void
}

export function SuccessView({ title, description, autoRedirectIn, onRedirect }: SuccessViewProps) {
  useEffect(() => {
    if (autoRedirectIn && onRedirect) {
      const timer = setTimeout(onRedirect, autoRedirectIn * 1000)
      return () => clearTimeout(timer)
    }
  }, [autoRedirectIn, onRedirect])

  return (
    <div className="text-center py-8">
      <CheckCircle2 className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
      <h2 className="font-heading text-2xl gradient-text mb-2">{title}</h2>
      <p className="text-muted-foreground">{description}</p>
      {autoRedirectIn && (
        <p className="text-xs text-muted-foreground mt-4">
          Redirecting in {autoRedirectIn}s...
        </p>
      )}
    </div>
  )
}
```

---

### 13. Inconsistent Button Styling

**Enterprise Solution**: Create design system wrapper
```typescript
// src/components/ui/GradientButton.tsx
interface GradientButtonProps extends ButtonProps {
  gradient?: 'primary' | 'premium' | 'extended'
}

export function GradientButton({ gradient = 'primary', className, ...props }: GradientButtonProps) {
  const gradientClass = {
    primary: 'gradient-bg',
    premium: 'gradient-bg-premium',
    extended: 'gradient-bg-extended'
  }[gradient]

  return (
    <Button
      className={cn(gradientClass, className)}
      {...props}
    />
  )
}
```

---

## Recommended Enterprise Architecture

```
src/
├── lib/
│   ├── auth/
│   │   ├── api.ts              # Auth API endpoints
│   │   ├── session.ts          # Session validation
│   │   ├── stellar-xdr.ts      # XDR utilities (shared)
│   │   ├── use-auth.ts         # React hooks
│   │   └── types.ts            # Error codes, flow types
│   └── wallet/
│       ├── detect.ts           # Wallet detection singleton
│       ├── connect.ts          # Connection orchestrator
│       └── adapters/
│           ├── index.ts        # Lazy adapter loader
│           ├── base.ts         # Base adapter interface
│           ├── passkey.ts
│           ├── walletconnect.ts
│           ├── freighter.ts
│           ├── xbull.ts
│           ├── ledger.ts
│           ├── rabet.ts
│           └── albedo.ts
├── stores/
│   └── auth-store.ts           # UNIFIED single store
├── components/
│   └── auth/
│       ├── shared/             # Reused components
│       │   ├── PasskeyForm.tsx
│       │   ├── WalletGrid.tsx
│       │   ├── CountryCombobox.tsx
│       │   └── SuccessView.tsx
│       ├── login/
│       │   └── LoginPage.tsx
│       └── register/
│           └── RegisterPage.tsx
└── app/
    └── (auth)/
        ├── login/
        │   └── page.tsx         # Thin wrapper
        └── register/
            └── page.tsx         # Thin wrapper
```

### Key Principles:
1. **Single source of truth** - One auth store, server-validated sessions
2. **Shared components** - Reduce code duplication by 40%
3. **Event-driven updates** - Prevent race conditions in async flows
4. **Proper error handling** - Typed errors with user-facing messages
5. **Progressive enhancement** - Work without JS, enhance with it
6. **Security first** - No secrets in localStorage, server-side validation