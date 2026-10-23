"use client";

import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  mapNeedsFrames,
  markMapActivity,
  subscribeMapActivity,
} from "./mapActivity";

const MOVE_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "KeyQ",
  "KeyE",
]);

/** Keeps the demand frameloop rendering while the user or the camera is moving. */
export function DemandFrames() {
  const invalidate = useThree((state) => state.invalidate);
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    const unsubscribe = subscribeMapActivity(() => invalidate());
    const poke = () => markMapActivity();
    const el = gl.domElement;
    const onKey = (event: KeyboardEvent) => {
      if (MOVE_KEYS.has(event.code)) poke();
    };
    el.addEventListener("pointerdown", poke);
    el.addEventListener("pointermove", poke);
    el.addEventListener("wheel", poke, { passive: true });
    window.addEventListener("keydown", onKey);
    poke();
    return () => {
      unsubscribe();
      el.removeEventListener("pointerdown", poke);
      el.removeEventListener("pointermove", poke);
      el.removeEventListener("wheel", poke);
      window.removeEventListener("keydown", onKey);
    };
  }, [gl, invalidate]);

  useFrame(() => {
    if (mapNeedsFrames()) invalidate();
  });

  return null;
}
