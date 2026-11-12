import type { Brush, Point } from "./types";
export type Command =
  | { kind: "cell"; point: Point }
  | { kind: "select"; id: string }
  | { kind: "skill"; id: string }
  | { kind: "wait" }
  | { kind: "paint"; brush: Brush }
  | { kind: "seek"; cursor: number }
  | { kind: "reset" };
