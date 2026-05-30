import type { ShotLogEntry } from "./types";

export function createLogEntry(text: string): ShotLogEntry {
  return { id: `${Date.now()}-${Math.random()}`, text };
}
