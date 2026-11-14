"use client";

import { create } from "zustand";

/**
 * Which month the NASA map layers show (null = latest available). Kept out of the
 * persisted app store on purpose: every visit starts from the most recent data.
 */
export const useLayerTime = create<{
  month: string | null;
  playing: boolean;
  setMonth: (month: string | null) => void;
  setPlaying: (playing: boolean) => void;
}>((set) => ({
  month: null,
  playing: false,
  setMonth: (month) => set({ month }),
  setPlaying: (playing) => set({ playing }),
}));
