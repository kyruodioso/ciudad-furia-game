import { create } from "zustand";

export interface PlayerState {
  velocity: [number, number, number];
  setVelocity: (velocity: [number, number, number]) => void;
}

// TODO: Este estado será pivotal una vez introduzcamos Rapier RigidBody
// y necesitemos comunicar la velocidad del motor de físicas con otras entidades.
export const usePlayerStore = create<PlayerState>((set) => ({
  velocity: [0, 0, 0],
  setVelocity: (velocity) => set({ velocity }),
}));
