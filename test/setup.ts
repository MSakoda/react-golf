import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// RTL only auto-cleans when Vitest globals are on, and they are off by default.
afterEach(() => cleanup());
