"use client";

import { useStoryStore } from "@/store/useStoryStore";

export function VictoryScreen() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.93)",
        backdropFilter: "blur(4px)",
        fontFamily: "'Courier New', monospace",
      }}
    >
      {/* Scanlines overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,136,0.03) 2px, rgba(0,255,136,0.03) 4px)",
          pointerEvents: "none",
        }}
      />

      {/* Contenido central */}
      <div style={{ textAlign: "center", position: "relative" }}>
        {/* Label corporativo */}
        <p
          style={{
            color: "#00aaff",
            fontSize: "12px",
            letterSpacing: "8px",
            textTransform: "uppercase",
            marginBottom: "32px",
            opacity: 0.8,
          }}
        >
          SOLSTEINN INNOVATIONS
        </p>

        {/* Línea separadora */}
        <div
          style={{
            width: "300px",
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, #00ff88, transparent)",
            margin: "0 auto 32px",
          }}
        />

        {/* Título de victoria */}
        <h1
          style={{
            color: "#ffffff",
            fontSize: "42px",
            fontWeight: "bold",
            letterSpacing: "4px",
            textTransform: "uppercase",
            marginBottom: "8px",
            textShadow: "0 0 20px rgba(0,255,136,0.5)",
          }}
        >
          MISIÓN COMPLETADA
        </h1>

        {/* Subtítulo narrativo */}
        <p
          style={{
            color: "#00ff88",
            fontSize: "14px",
            letterSpacing: "3px",
            marginBottom: "48px",
          }}
        >
          MVP COMPLETADO
        </p>

        {/* Texto narrativo */}
        <p
          style={{
            color: "#666666",
            fontSize: "13px",
            letterSpacing: "2px",
            lineHeight: "2",
            marginBottom: "48px",
            maxWidth: "380px",
          }}
        >
          El Transceptor fue recuperado.
          <br />
          Ciudad Furia sobrevive otro día.
        </p>

        {/* Línea separadora */}
        <div
          style={{
            width: "300px",
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, #00ff88, transparent)",
            margin: "0 auto 40px",
          }}
        />

        {/* Botón de reinicio */}
        <button
          onClick={() => window.location.reload()}
          style={{
            background: "transparent",
            border: "1px solid #00ff88",
            color: "#00ff88",
            padding: "14px 40px",
            fontSize: "13px",
            letterSpacing: "4px",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "all 0.2s ease",
            fontFamily: "'Courier New', monospace",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.background = "#00ff88";
            (e.target as HTMLButtonElement).style.color = "#000000";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.background = "transparent";
            (e.target as HTMLButtonElement).style.color = "#00ff88";
          }}
        >
          REINICIAR PARTIDA
        </button>
      </div>
    </div>
  );
}

/**
 * Wrapper que solo renderiza VictoryScreen cuando isExtracted === true.
 * Montar fuera del Canvas en page.tsx.
 */
export function VictoryOverlay() {
  const isExtracted = useStoryStore((state) => state.isExtracted);
  if (!isExtracted) return null;
  return <VictoryScreen />;
}
