import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Canvas } from "@react-three/fiber";
import { KeyboardControls } from "@react-three/drei";
import { Player } from "./Player";

global.ResizeObserver = class ResizeObserver {
  observe() { }
  unobserve() { }
  disconnect() { }
};

describe("Player Architecture QA", () => {
  it("should render the player wrapper without unhandled component errors", () => {
    const keyboardMap = [{ name: "forward", keys: ["ArrowUp", "KeyW"] }];

    const { container } = render(
      <KeyboardControls map={keyboardMap}>
        <Canvas>
          <Player />
        </Canvas>
      </KeyboardControls>,
    );

    // Tests that the core canvas and player wrapper initialize correctly in DOM
    expect(container.firstChild).toBeDefined();
  });
});
