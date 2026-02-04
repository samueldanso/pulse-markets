import { create } from "zustand";
import { createMarkets } from "@/data/markets";
import type { Market } from "@/types";

interface MarketStore {
  markets: Market[];

  updateMarket: (id: string, updates: Partial<Market>) => void;
  refreshMarkets: () => void;
}

export const useMarketStore = create<MarketStore>((set) => ({
  markets: createMarkets(),

  updateMarket: (id, updates) =>
    set((state) => ({
      markets: state.markets.map((m) =>
        m.id === id ? { ...m, ...updates } : m,
      ),
    })),

  refreshMarkets: () => set({ markets: createMarkets() }),
}));
