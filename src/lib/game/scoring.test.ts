import { describe, expect, it } from "vitest";
import { getFinishName } from "./scoring";

describe("getFinishName", () => {
  it("names a one-stroke hole a hole in one on any par", () => {
    expect(getFinishName(1, 3)).toBe("Hole in one");
    expect(getFinishName(1, 5)).toBe("Hole in one");
  });

  it("names results around par 4", () => {
    expect(getFinishName(2, 4)).toBe("Eagle");
    expect(getFinishName(3, 4)).toBe("Birdie");
    expect(getFinishName(4, 4)).toBe("Par");
    expect(getFinishName(5, 4)).toBe("Bogey");
    expect(getFinishName(6, 4)).toBe("Double bogey");
    expect(getFinishName(7, 4)).toBe("Triple bogey or worse");
    expect(getFinishName(12, 4)).toBe("Triple bogey or worse");
  });

  it("names three or more under par an albatross", () => {
    expect(getFinishName(2, 5)).toBe("Albatross");
    expect(getFinishName(3, 6)).toBe("Albatross");
  });
});
