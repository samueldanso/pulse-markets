import { create } from "zustand";
import type { Position } from "@/types";

interface UserStore {
  address: string;
  channelId: string | undefined;
  balance: number;
  positions: Position[];

  setAddress: (address: string) => void;
  setChannelId: (channelId: string | null) => void;
  setBalance: (balance: number) => void;
  addPosition: (position: Position) => void;
  updatePosition: (id: string, updates: Partial<Position>) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  address: "",
  channelId: undefined as string | undefined,
  balance: 0,
  positions: [] as Position[],
};

export const useUserStore = create<UserStore>((set) => ({
  ...INITIAL_STATE,

  setAddress: (address) => set({ address }),
  setChannelId: (channelId) => set({ channelId: channelId ?? undefined }),
  setBalance: (balance) => set({ balance }),

  addPosition: (position) =>
    set((state) => ({ positions: [...state.positions, position] })),

  updatePosition: (id, updates) =>
    set((state) => ({
      positions: state.positions.map((p) =>
        p.id === id ? { ...p, ...updates } : p,
      ),
    })),

  reset: () => set(INITIAL_STATE),
}));
