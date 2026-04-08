import { useRef } from "react";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { useStoryStore } from "@/store/useStoryStore";

interface NarrativeTriggerProps {
  position: [number, number, number];
  args: [number, number, number]; // Tamaño del área (mitades en tapier: [hx, hy, hz])
  dialogueText: string;
  duration?: number;
  isOneShot?: boolean;
}

export function NarrativeTrigger({
  position,
  args,
  dialogueText,
  duration = 5000,
  isOneShot = true,
}: NarrativeTriggerProps) {
  const hasFired = useRef(false);

  return (
    <RigidBody
      type="fixed"
      position={position}
      colliders={false}
      userData={{ type: "trigger" }}
    >
      <CuboidCollider
        args={args}
        sensor
        onIntersectionEnter={(payload) => {
          if (isOneShot && hasFired.current) return;

          const ud = payload.other.rigidBodyObject?.userData as { type?: string };
          if (ud && ud.type === "player") {
            hasFired.current = true;
            useStoryStore.getState().triggerDialogue(dialogueText, duration);
          }
        }}
      />
    </RigidBody>
  );
}
