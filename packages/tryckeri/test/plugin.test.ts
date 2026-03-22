import { describe, it, expect } from "vitest";
import { definePlugin } from "../src/plugin.js";

describe("definePlugin", () => {
  it("returns the definition unchanged (identity)", () => {
    const def = {
      name: "my-plugin",
      createOnce() {
        return {};
      },
    };
    const result = definePlugin(def);
    expect(result).toBe(def);
  });

  it("throws if name is missing", () => {
    expect(() =>
      definePlugin({
        name: "",
        createOnce() {
          return {};
        },
      }),
    ).toThrow(/name/);
  });

  it("throws if name is absent entirely", () => {
    expect(() =>
      definePlugin({
        createOnce() {
          return {};
        },
      } as unknown as Parameters<typeof definePlugin>[0]),
    ).toThrow(/name/);
  });

  it("throws if createOnce is missing", () => {
    expect(() =>
      definePlugin({ name: "x" } as unknown as Parameters<typeof definePlugin>[0]),
    ).toThrow(/createOnce/);
  });

  it("throws if createOnce is not a function", () => {
    expect(() =>
      definePlugin({ name: "x", createOnce: 42 } as unknown as Parameters<typeof definePlugin>[0]),
    ).toThrow(/createOnce/);
  });

  it("works with a minimal valid definition", () => {
    const def = definePlugin({
      name: "minimal",
      createOnce() {
        return {};
      },
    });
    expect(def.name).toBe("minimal");
    expect(typeof def.createOnce).toBe("function");
  });
});
