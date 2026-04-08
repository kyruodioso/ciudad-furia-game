"use client";

import { usePlayerStore, WeaponType } from "@/store/usePlayerStore";
import { useStoryStore } from "@/store/useStoryStore";
import { useEffect, useState } from "react";

const getWeaponName = (weaponId: WeaponType) => {
  switch (weaponId) {
    case "none":
      return "Manos vacías";
    case "iron_bar":
      return "Barra de Hierro";
    case "blaster":
      return "Blaster";
    default:
      return "Desconocido";
  }
};

export const SurvivalHUD = () => {
  const hp = usePlayerStore((state) => state.hp);
  const activeWeapon = usePlayerStore((state) => state.activeWeapon);
  const currentSubtitle = useStoryStore((state) => state.currentSubtitle);
  const hasObjective = useStoryStore((state) => state.hasObjective);
  const isExtracted = useStoryStore((state) => state.isExtracted);

  // Pequeño efecto de estática aleatorio cuando "La Voz" habla
  const [staticPulse, setStaticPulse] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentSubtitle) {
      interval = setInterval(
        () => {
          setStaticPulse((prev) => !prev);
        },
        150 + Math.random() * 200,
      ); // Glitch aleatorio
    } else {
      setStaticPulse(false);
    }
    return () => clearInterval(interval);
  }, [currentSubtitle]);

  return (
    <div className="absolute inset-0 pointer-events-none z-40 flex flex-col justify-between p-8 select-none">
      {/* Top Section */}
      <div className="w-full flex justify-end">
        {/* Voz Indicator (Estática/Pulso) */}
        <div className="flex flex-col items-end gap-4">
          {currentSubtitle && (
            <div className="flex items-center gap-3 opacity-90 transition-opacity mix-blend-difference bg-black/40 px-3 py-1 border border-red-900/50">
              <span className="text-red-500 font-mono text-sm uppercase tracking-widest animate-pulse">
                [ SEÑAL INTRUSA ]
              </span>
              <div
                className={`w-3 h-3 rounded-sm bg-red-600 blur-[1px] transition-all duration-75 ${
                  staticPulse ? "opacity-100 scale-125" : "opacity-40 scale-90"
                }`}
              ></div>
            </div>
          )}

          {/* Indicador de Extracción (Solo si tiene el objetivo y no ha ganado) */}
          {hasObjective && !isExtracted && (
            <div className="flex items-center gap-3 bg-green-950/60 border border-green-500 px-4 py-2 animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.3)]">
              <span className="text-green-400 font-mono text-sm font-bold uppercase tracking-[0.2em]">
                ⬆ EXTRACCIÓN DISPONIBLE
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="w-full flex justify-between items-end">
        {/* Health Bar (Bottom Left) */}
        <div className="flex flex-col gap-1 w-64">
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-gray-300 font-mono text-sm tracking-widest font-bold uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              VIT
            </span>
            <span className="text-gray-200 font-mono text-xs drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {Math.floor(hp)}%
            </span>
          </div>
          <div className="w-full h-4 bg-gray-900/80 border border-gray-600 relative overflow-hidden shadow-[0_0_10px_rgba(0,0,0,1)]">
            <div
              className="absolute top-0 left-0 h-full transition-all duration-300 ease-out"
              style={{
                width: `${hp}%`,
                transition: "width 0.3s ease-out, background 0.3s ease",
                filter:
                  hp < 30
                    ? "drop-shadow(0 0 6px #ef4444)"
                    : "drop-shadow(0 0 4px #a855f7)",
                background:
                  hp >= 60
                    ? "linear-gradient(90deg, #7c3aed, #a855f7)"
                    : hp >= 30
                      ? "linear-gradient(90deg, #ea580c, #f97316)"
                      : "linear-gradient(90deg, #991b1b, #ef4444)",
              }}
            ></div>
            {/* Overlay desgastado (ruido simple visual CSS en base64) */}
            <div
              className="absolute inset-0 opacity-30 pointer-events-none mix-blend-overlay"
              style={{
                backgroundImage:
                  'url(\'data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noiseFilter)"/></svg>\')',
              }}
            ></div>
          </div>
        </div>

        {/* Weapon Indicator (Bottom Right) */}
        <div className="flex flex-col items-end mix-blend-difference bg-black/20 p-2 border-r-2 border-b-2 border-gray-600">
          <span className="text-white/50 font-mono text-[10px] tracking-widest uppercase mb-1">
            EQUIPAMIENTO
          </span>
          <span className="text-gray-200 font-mono text-lg font-bold uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {getWeaponName(activeWeapon)}
          </span>
        </div>
      </div>
    </div>
  );
};
