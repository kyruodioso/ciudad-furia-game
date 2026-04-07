import { create } from "zustand";

export interface PlayerState {
  velocity: [number, number, number];
  setVelocity: (velocity: [number, number, number]) => void;
  // Estado del Inventario
  hasWeapon: boolean;
  equipWeapon: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  velocity: [0, 0, 0],
  setVelocity: (velocity) => set({ velocity }),
  hasWeapon: false,
  equipWeapon: () => set({ hasWeapon: true }),
}));
