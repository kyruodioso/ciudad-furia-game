"use client";

import { useStoryStore } from "@/store/useStoryStore";

export function SubtitlesUI() {
  const subtitle = useStoryStore((state) => state.currentSubtitle);

  if (!subtitle) return null;

  return (
    <div className="absolute inset-x-0 bottom-[10%] flex justify-center pointer-events-none px-8 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-black/50 backdrop-blur-md px-8 py-4 rounded shadow-lg border-b-2 border-fuchsia-500 max-w-4xl">
        <p
          className="text-xl md:text-2xl font-mono text-center tracking-wide font-bold"
          style={{
            color: "#ffcc00", // Amarillo forzado por estilo en línea
            textShadow:
              "2px 2px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000, 1px 1px 0px #000, 0px 4px 10px rgba(0,0,0,0.9)",
          }}
        >
          <span style={{ color: "#00ffcc" }} className="mr-3 uppercase">
            La Voz:
          </span>
          {subtitle}
        </p>
      </div>
    </div>
  );
}
