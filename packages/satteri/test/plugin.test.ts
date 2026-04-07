import { describe, it, expect } from "vitest";
import { defineMdastPlugin } from "../src/plugin.js";

describe("defineMdastPlugin", () => {
  it("returns the definition unchanged (identity)", () => {
    const def = {
      name: "my-plugin",
    };
    const result = defineMdastPlugin(def);
    expect(result).toBe(def);
  });

  it("throws if name is missing", () => {
    expect(() =>
      defineMdastPlugin({
        name: "",
      }),
    ).toThrow(/name/);
  });

  it("throws if name is absent entirely", () => {
    expect(() =>
      defineMdastPlugin({} as unknown as Parameters<typeof defineMdastPlugin>[0]),
    ).toThrow(/name/);
  });

  it("works with a minimal valid definition", () => {
    const def = defineMdastPlugin({
      name: "minimal",
    });
    expect(def.name).toBe("minimal");
  });
});
