import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMultiWalletStore } from "@/stores/multi-wallet-store";
import type { WalletAdapter } from "@/lib/wallet/types";

const mockGetAdapter = vi.fn();

vi.mock("@/lib/wallet/registry", () => ({
  getWalletRegistry: () => ({
    getAdapter: mockGetAdapter,
    detect: vi.fn().mockReturnValue([]),
  }),
}));

vi.mock("@/lib/wallet/session-manager", () => ({
  getSessionManager: () => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    switchTo: vi.fn(),
    getAll: vi.fn().mockReturnValue([]),
    getActive: vi.fn().mockReturnValue(null),
  }),
}));

vi.mock("@/lib/wallet/balance-cache", () => ({
  fetchBalanceWithBackoff: vi.fn(),
}));

vi.mock("@/lib/constants", () => ({
  WC2_QR_EXPIRATION_MS: 300000,
  STELLAR_NETWORK: "testnet",
}));

function createMockAdapter(): WalletAdapter {
  return {
    meta: {
      id: "freighter",
      name: "Freighter",
      category: "extension",
      icon: "",
      installUrl: "",
      description: "",
      priority: 1,
      isAvailable: () => true,
    },
    connect: vi.fn().mockResolvedValue({ publicKey: "GTEST123" }),
    disconnect: vi.fn(),
    isConnected: vi.fn().mockResolvedValue(false),
    signMessage: vi.fn(),
    signTransaction: vi.fn(),
    getPublicKey: vi.fn(),
    getNetwork: vi.fn().mockResolvedValue("testnet"),
  };
}

describe("useMultiWallet store via hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMultiWalletStore.setState({
      activeWalletId: null,
      wallets: {},
      detectedWallets: [],
      isConnected: false,
      address: null,
      isConnecting: false,
      error: null,
      activeAdapter: null,
      isSelectorOpen: false,
    });
  });

  describe("connection state", () => {
    it("starts disconnected", () => {
      const state = useMultiWalletStore.getState();
      expect(state.isConnected).toBe(false);
      expect(state.isConnecting).toBe(false);
      expect(state.address).toBeNull();
      expect(state.error).toBeNull();
      expect(state.activeAdapter).toBeNull();
    });

    it("reflects connected state", () => {
      const adapter = createMockAdapter();
      useMultiWalletStore.setState({
        activeWalletId: "freighter",
        wallets: {
          freighter: {
            adapter,
            publicKey: "GTEST123",
            network: "testnet",
            balance: null,
            lastConnected: Date.now(),
            error: null,
            status: "connected",
          },
        },
        isConnected: true,
        address: "GTEST123",
        activeAdapter: adapter,
      });

      const state = useMultiWalletStore.getState();
      expect(state.isConnected).toBe(true);
      expect(state.address).toBe("GTEST123");
      expect(state.activeAdapter).toBe(adapter);
    });
  });

  describe("active wallet", () => {
    it("returns null activeWalletId by default", () => {
      expect(useMultiWalletStore.getState().activeWalletId).toBeNull();
    });

    it("returns active wallet entry", () => {
      const adapter = createMockAdapter();
      useMultiWalletStore.setState({
        activeWalletId: "freighter",
        wallets: {
          freighter: {
            adapter,
            publicKey: "GTEST123",
            network: "testnet",
            balance: null,
            lastConnected: Date.now(),
            error: null,
            status: "connected",
          },
        },
      });

      const state = useMultiWalletStore.getState();
      expect(state.activeWalletId).toBe("freighter");
      expect(state.wallets.freighter).toMatchObject({
        publicKey: "GTEST123",
        status: "connected",
      });
    });
  });

  describe("wallet list", () => {
    it("returns empty detected wallets by default", () => {
      const state = useMultiWalletStore.getState();
      expect(state.detectedWallets).toEqual([]);
      expect(state.isSelectorOpen).toBe(false);
    });

    it("reflects selector open state", () => {
      useMultiWalletStore.setState({ isSelectorOpen: true });
      expect(useMultiWalletStore.getState().isSelectorOpen).toBe(true);
    });
  });

  describe("actions", () => {
    it("setSelectorOpen toggles selector state", () => {
      useMultiWalletStore.getState().setSelectorOpen(true);
      expect(useMultiWalletStore.getState().isSelectorOpen).toBe(true);

      useMultiWalletStore.getState().setSelectorOpen(false);
      expect(useMultiWalletStore.getState().isSelectorOpen).toBe(false);
    });

    it("disconnect removes wallet entry", () => {
      useMultiWalletStore.setState({
        activeWalletId: "freighter",
        wallets: {
          freighter: {
            adapter: createMockAdapter(),
            publicKey: "GABC",
            network: "testnet",
            balance: null,
            lastConnected: Date.now(),
            error: null,
            status: "connected",
          },
        },
      });

      useMultiWalletStore.getState().disconnect("freighter");

      const state = useMultiWalletStore.getState();
      expect(state.wallets.freighter).toBeUndefined();
      expect(state.activeWalletId).toBeNull();
      expect(state.isConnected).toBe(false);
    });

    it("switchWallet changes active wallet", () => {
      useMultiWalletStore.setState({
        activeWalletId: "freighter",
        wallets: {
          freighter: {
            adapter: createMockAdapter(),
            publicKey: "GABC",
            network: "testnet",
            balance: null,
            lastConnected: Date.now(),
            error: null,
            status: "connected",
          },
          lobstr: {
            adapter: createMockAdapter(),
            publicKey: "GDEF",
            network: "testnet",
            balance: null,
            lastConnected: Date.now(),
            error: null,
            status: "connected",
          },
        },
      });

      useMultiWalletStore.getState().switchWallet("lobstr");
      expect(useMultiWalletStore.getState().activeWalletId).toBe("lobstr");
    });

    it("clearError removes error from wallet", () => {
      useMultiWalletStore.setState({
        activeWalletId: "freighter",
        wallets: {
          freighter: {
            adapter: createMockAdapter(),
            publicKey: "",
            network: "testnet",
            balance: null,
            lastConnected: Date.now(),
            error: { adapter: "freighter", code: "timeout", message: "Timed out" },
            status: "error",
          },
        },
      });

      useMultiWalletStore.getState().clearError("freighter");

      const entry = useMultiWalletStore.getState().wallets.freighter;
      expect(entry.error).toBeNull();
      expect(entry.status).toBe("disconnected");
    });

    it("updateWalletStatus changes wallet status", () => {
      useMultiWalletStore.setState({
        wallets: {
          freighter: {
            adapter: createMockAdapter(),
            publicKey: "GABC",
            network: "testnet",
            balance: null,
            lastConnected: Date.now(),
            error: null,
            status: "connecting",
          },
        },
      });

      useMultiWalletStore.getState().updateWalletStatus("freighter", "connected");
      expect(useMultiWalletStore.getState().wallets.freighter.status).toBe("connected");
    });
  });

  describe("connect error handling", () => {
    it("sets error state when connect fails", async () => {
      const adapter = createMockAdapter();
      adapter.connect.mockRejectedValue({
        adapter: "freighter",
        code: "rejected",
        message: "User rejected connection",
      });
      mockGetAdapter.mockReturnValue(adapter);

      try {
        await useMultiWalletStore.getState().connect("freighter");
      } catch {
        // expected
      }

      const state = useMultiWalletStore.getState();
      expect(state.wallets.freighter.status).toBe("error");
      expect(state.wallets.freighter.error?.message).toBe("User rejected connection");
    });
  });

  describe("WC2 state", () => {
    it("starts with idle pairing state", () => {
      const state = useMultiWalletStore.getState();
      expect(state.wc2PairingState).toBe("idle");
      expect(state.wc2PairingUri).toBeNull();
      expect(state.wc2RelayStatus).toBe("healthy");
    });

    it("setWc2PairingUri updates URI and state", () => {
      useMultiWalletStore.getState().setWc2PairingUri("wc:test");
      expect(useMultiWalletStore.getState().wc2PairingUri).toBe("wc:test");
      expect(useMultiWalletStore.getState().wc2PairingState).toBe("pairing");
    });

    it("resetWc2Pairing clears all WC2 state", () => {
      useMultiWalletStore.getState().setWc2PairingUri("wc:test");
      useMultiWalletStore.getState().resetWc2Pairing();

      const state = useMultiWalletStore.getState();
      expect(state.wc2PairingUri).toBeNull();
      expect(state.wc2PairingState).toBe("idle");
      expect(state.wc2PairingError).toBeNull();
    });
  });

  describe("passkey state", () => {
    it("starts with idle passkey state", () => {
      const state = useMultiWalletStore.getState();
      expect(state.passkeyState).toBe("idle");
      expect(state.passkeyError).toBeNull();
      expect(state.passkeyPublicKey).toBeNull();
    });

    it("resetPasskeyState clears all passkey state", () => {
      useMultiWalletStore.setState({
        passkeyState: "connected",
        passkeyPublicKey: "GPK123",
      });
      useMultiWalletStore.getState().resetPasskeyState();

      const state = useMultiWalletStore.getState();
      expect(state.passkeyState).toBe("idle");
      expect(state.passkeyError).toBeNull();
      expect(state.passkeyPublicKey).toBeNull();
    });
  });

  describe("ledger state", () => {
    it("starts with idle ledger state", () => {
      const state = useMultiWalletStore.getState();
      expect(state.ledgerConnectionState).toBe("idle");
      expect(state.ledgerFirmwareVersion).toBeNull();
    });

    it("resetLedgerState clears all ledger state", () => {
      useMultiWalletStore.setState({
        ledgerConnectionState: "connected",
        ledgerFirmwareVersion: "2.1.0",
        ledgerStellarAppVersion: "5.0.0",
      });
      useMultiWalletStore.getState().resetLedgerState();

      const state = useMultiWalletStore.getState();
      expect(state.ledgerConnectionState).toBe("idle");
      expect(state.ledgerFirmwareVersion).toBeNull();
      expect(state.ledgerStellarAppVersion).toBeNull();
      expect(state.ledgerFirmwareWarnings).toEqual([]);
    });
  });

  describe("route-specific error isolation", () => {
    it("setLoginError and clearLoginError", () => {
      useMultiWalletStore.getState().setLoginError("Invalid credentials");
      expect(useMultiWalletStore.getState().loginError).toBe("Invalid credentials");

      useMultiWalletStore.getState().clearLoginError();
      expect(useMultiWalletStore.getState().loginError).toBeNull();
    });

    it("setRegisterError and clearRegisterError", () => {
      useMultiWalletStore.getState().setRegisterError("Email taken");
      expect(useMultiWalletStore.getState().registerError).toBe("Email taken");

      useMultiWalletStore.getState().clearRegisterError();
      expect(useMultiWalletStore.getState().registerError).toBeNull();
    });
  });
});
