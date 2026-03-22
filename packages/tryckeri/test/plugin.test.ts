import { describe, it, expect } from "vitest";
import { definePlugin } from "../src/plugin.ts";

describe("definePlugin", () => {
  it("returns the definition unchanged (identity)", () => {
    const def = {
      meta: { name: "my-plugin" },
      createOnce() {
        return {};
      },
    };
    const result = definePlugin(def);
    expect(result).toBe(def);
  });

  it("throws if meta.name is missing", () => {
    expect(() =>
      definePlugin({
        meta: {} as { name: string },
        createOnce() {
          return {};
        },
      }),
    ).toThrow(/meta\.name/);
  });

  it("throws if meta is absent entirely", () => {
    expect(() =>
      definePlugin({
        createOnce() {
          return {};
        },
      } as Parameters<typeof definePlugin>[0]),
    ).toThrow(/meta\.name/);
  });

  it("throws if createOnce is missing", () => {
    expect(() => definePlugin({ meta: { name: "x" } } as Parameters<typeof definePlugin>[0])).toThrow(
      /createOnce/,
    );
  });

  it("throws if createOnce is not a function", () => {
    expect(() =>
      definePlugin({ meta: { name: "x" }, createOnce: 42 } as unknown as Parameters<
        typeof definePlugin
      >[0]),
    ).toThrow(/createOnce/);
  });

  it("works with a minimal valid definition", () => {
    const def = definePlugin({
      meta: { name: "minimal" },
      createOnce() {
        return {};
      },
    });
    expect(def.meta.name).toBe("minimal");
    expect(typeof def.createOnce).toBe("function");
  });

  it("preserves optional meta fields", () => {
    const def = definePlugin({
      meta: { name: "full", version: "1.0.0", description: "A plugin" },
      createOnce() {
        return {};
      },
    });
    expect(def.meta.version).toBe("1.0.0");
    expect(def.meta.description).toBe("A plugin");
  });
});
