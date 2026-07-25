import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WalletAdapter } from "@/lib/wallet/types";

const { getAdapter, sessionConnect } = vi.hoisted(() => ({
  getAdapter: vi.fn(),
  sessionConnect: vi.fn(),
}));

vi.mock("@/lib/wallet/registry", () => ({
  getWalletRegistry: () => ({
    getAdapter,
  }),
}));

vi.mock("@/lib/wallet/session-manager", () => ({
  getSessionManager: () => ({
    connect: sessionConnect,
  }),
}));

import { useMultiWalletStore } from "@/stores/multi-wallet-store";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function createAdapter(
  connect: WalletAdapter["connect"]
): WalletAdapter {
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
    connect,
    disconnect: vi.fn(),
    isConnected: vi.fn(),
    signMessage: vi.fn(),
    signTransaction: vi.fn(),
    getPublicKey: vi.fn(),
    getNetwork: vi.fn().mockResolvedValue("testnet"),
  };
}

describe("multi-wallet-store connect concurrency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMultiWalletStore.setState({
      activeWalletId: null,
      wallets: {},
      isConnected: false,
      address: null,
      isConnecting: false,
      connectingWalletId: null,
      error: null,
      activeAdapter: null,
    });
  });

  it("ignores a double-click while the same wallet is connecting", async () => {
    const pendingConnection = deferred<{ publicKey: string }>();
    const adapter = createAdapter(
      vi.fn().mockReturnValue(pendingConnection.promise)
    );
    getAdapter.mockReturnValue(adapter);

    const first = useMultiWalletStore.getState().connect("freighter");
    const second = useMultiWalletStore.getState().connect("freighter");

    expect(adapter.connect).toHaveBeenCalledTimes(1);
    await expect(second).resolves.toBeUndefined();

    pendingConnection.resolve({ publicKey: "GDOUBLECLICK" });
    await first;
  });

  it("still connects a wallet with a single call", async () => {
    const adapter = createAdapter(
      vi.fn().mockResolvedValue({ publicKey: "GSINGLECONNECT" })
    );
    getAdapter.mockReturnValue(adapter);

    await useMultiWalletStore.getState().connect("freighter");

    expect(adapter.connect).toHaveBeenCalledTimes(1);
    expect(sessionConnect).toHaveBeenCalledWith(adapter, "GSINGLECONNECT");
    expect(useMultiWalletStore.getState().wallets.freighter).toMatchObject({
      publicKey: "GSINGLECONNECT",
      network: "testnet",
      status: "connected",
      error: null,
    });
  });

  it("keeps state consistent after rapid duplicate calls", async () => {
    const pendingConnection = deferred<{ publicKey: string }>();
    const adapter = createAdapter(
      vi.fn().mockReturnValue(pendingConnection.promise)
    );
    getAdapter.mockReturnValue(adapter);

    const attempts = [
      useMultiWalletStore.getState().connect("freighter"),
      useMultiWalletStore.getState().connect("freighter"),
      useMultiWalletStore.getState().connect("freighter"),
    ];

    expect(useMultiWalletStore.getState()).toMatchObject({
      activeWalletId: "freighter",
      isConnecting: true,
      connectingWalletId: "freighter",
    });

    pendingConnection.resolve({ publicKey: "GRAPIDCLICKS" });
    await Promise.all(attempts);

    expect(adapter.connect).toHaveBeenCalledTimes(1);
    expect(sessionConnect).toHaveBeenCalledTimes(1);
    expect(useMultiWalletStore.getState()).toMatchObject({
      activeWalletId: "freighter",
      address: "GRAPIDCLICKS",
      isConnected: true,
      isConnecting: false,
      connectingWalletId: null,
    });
    expect(Object.keys(useMultiWalletStore.getState().wallets)).toEqual([
      "freighter",
    ]);
  });
});
