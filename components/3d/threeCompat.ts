import * as THREE from "three";

const threeWithConsole = THREE as unknown as {
  setConsoleFunction?: (
    fn: (
      type: "log" | "warn" | "error",
      message: string,
      ...params: unknown[]
    ) => void
  ) => void;
};

if (typeof threeWithConsole.setConsoleFunction === "function") {
  threeWithConsole.setConsoleFunction((type, message, ...params) => {
    if (
      type === "warn" &&
      typeof message === "string" &&
      (message.includes("THREE.Clock") ||
        message.includes("PCFSoftShadowMap"))
    ) {
      return;
    }
    if (type === "error") {
      console.error(message, ...params);
    } else if (type === "warn") {
      console.warn(message, ...params);
    } else {
      console.log(message, ...params);
    }
  });
}
