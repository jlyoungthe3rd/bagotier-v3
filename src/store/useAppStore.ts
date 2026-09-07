import { create } from 'zustand';

export interface AppState {
  readonly muted: boolean;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
}

export const useAppStore = create<AppState>()((set) => ({
  muted: false,
  toggleMute: () => set((s) => ({ muted: !s.muted })),
  setMuted: (muted: boolean) => set({ muted }),
}));
