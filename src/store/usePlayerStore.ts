import { create } from "zustand";

export type WeaponType = "none" | "iron_bar" | "blaster";

export interface PlayerState {
  velocity: [number, number, number];
  setVelocity: (velocity: [number, number, number]) => void;
  hp: number;
  inventory: string[];
  activeWeapon: WeaponType;
  equipWeapon: (weaponId: WeaponType) => void;
  pickupWeapon: (weaponId: string) => void;
  receiveDamage: (amount: number) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  velocity: [0, 0, 0],
  setVelocity: (velocity) => set({ velocity }),
  hp: 100,
  inventory: [],
  activeWeapon: "none", // Modificación: Inicia sin armas
  equipWeapon: (weaponId) => set({ activeWeapon: weaponId }),
  pickupWeapon: (weaponId) =>
    set((state) => {
      const newInventory = state.inventory.includes(weaponId)
        ? state.inventory
        : [...state.inventory, weaponId];
      return {
        inventory: newInventory,
        activeWeapon: weaponId as WeaponType,
      };
    }),
  receiveDamage: (amount) =>
    set((state) => ({ hp: Math.max(0, state.hp - amount) })),
}));
