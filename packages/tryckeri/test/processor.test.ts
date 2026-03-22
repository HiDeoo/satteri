import { describe, it, expect } from "vitest";
import { buildHelloWorldBuffer } from "./fixtures.ts";
import { createProcessor } from "../src/processor.ts";
import { definePlugin } from "../src/plugin.ts";
import headingIds from "../src/plugins/heading-ids.ts";
import lintHeadingDepth from "../src/plugins/lint-heading-depth.ts";
import flattenHeadings from "../src/plugins/flatten-headings.ts";
import collectHeadings from "../src/plugins/collect-headings.ts";

describe("createProcessor", () => {
  it("createProcessor([]) works, processBuffer returns same buffer", () => {
    const buf = buildHelloWorldBuffer();
    const processor = createProcessor({ plugins: [] });
    const result = processor.processBuffer(buf);
    expect(result.buffer).toBe(buf);
    expect(result.mutationCount).toBe(0);
    expect(result.diagnostics).toEqual([]);
  });

  it('heading-ids plugin: heading node data.id is set to "hello"', () => {
    const buf = buildHelloWorldBuffer();
    const processor = createProcessor({ plugins: [headingIds] });
    const result = processor.processBuffer(buf);
    const data = result.dataMap.get(1);
    expect(data).toBeTruthy();
    expect(data.id).toBe("hello");
  });

  it("heading-ids plugin: id is a slug (lowercase, no special chars)", () => {
    const buf = buildHelloWorldBuffer();
    const processor = createProcessor({ plugins: [headingIds] });
    const result = processor.processBuffer(buf);
    const data = result.dataMap.get(1);
    expect(data?.id).toBeTruthy();
    expect(String(data!.id)).toMatch(/^[a-z0-9-]+$/);
  });

  it("heading-ids plugin: hProperties.id matches id", () => {
    const buf = buildHelloWorldBuffer();
    const processor = createProcessor({ plugins: [headingIds] });
    const result = processor.processBuffer(buf);
    const data = result.dataMap.get(1);
    expect(data!.hProperties).toEqual({ id: data!.id });
  });

  it("lint-heading-depth: no diagnostics when heading is within limit", () => {
    const buf = buildHelloWorldBuffer();
    const processor = createProcessor({ plugins: [lintHeadingDepth({ maxDepth: 1 })] });
    const result = processor.processBuffer(buf);
    expect(result.diagnostics.length).toBe(0);
  });

  it("lint-heading-depth with maxDepth=0: reports a diagnostic for h1 heading", () => {
    const buf = buildHelloWorldBuffer();
    const processor = createProcessor({ plugins: [lintHeadingDepth({ maxDepth: 0 })] });
    const result = processor.processBuffer(buf);
    expect(result.diagnostics.length).toBe(1);
    expect(result.diagnostics[0].severity).toBe("warning");
    expect(result.diagnostics[0].message).toMatch(/depth 1 exceeds maximum of 0/);
  });

  it("flatten-headings: records a Replace mutation when heading exceeds max", () => {
    const buf = buildHelloWorldBuffer();
    const processor = createProcessor({ plugins: [flattenHeadings({ maxDepth: 0 })] });
    const result = processor.processBuffer(buf);
    expect(result.mutationCount).toBe(1);
  });

  it("flatten-headings: no mutation when heading is within max", () => {
    const buf = buildHelloWorldBuffer();
    const processor = createProcessor({ plugins: [flattenHeadings({ maxDepth: 2 })] });
    const result = processor.processBuffer(buf);
    expect(result.mutationCount).toBe(0);
  });

  it("collect-headings: after processing, getHeadings() returns 1 heading with depth=1", () => {
    const buf = buildHelloWorldBuffer();
    let capturedInstance: ReturnType<typeof collectHeadings.createOnce> | null = null;
    const wrappedCollect = definePlugin({
      meta: { name: "collect-headings-wrapper" },
      createOnce(ctx) {
        capturedInstance = collectHeadings.createOnce(ctx);
        return capturedInstance;
      },
    });
    const processor = createProcessor({ plugins: [wrappedCollect] });
    processor.processBuffer(buf);
    expect(capturedInstance).toBeTruthy();
    const headings = (capturedInstance as { getHeadings(): { depth: number }[] }).getHeadings();
    expect(headings.length).toBe(1);
    expect(headings[0].depth).toBe(1);
  });

  it("multiple plugins run in order: heading-ids runs first, then counter sees results", () => {
    const buf = buildHelloWorldBuffer();
    let headingCallCount = 0;
    const counterPlugin = definePlugin({
      meta: { name: "counter" },
      createOnce() {
        return {
          heading(_node: unknown) {
            headingCallCount++;
          },
        };
      },
    });
    const processor = createProcessor({ plugins: [headingIds, counterPlugin] });
    processor.processBuffer(buf);
    expect(headingCallCount).toBe(1);
  });

  it("createOnce is called once per processor, not once per processBuffer call", () => {
    const buf = buildHelloWorldBuffer();
    let createOnceCallCount = 0;
    const countingPlugin = definePlugin({
      meta: { name: "counter" },
      createOnce(_ctx) {
        createOnceCallCount++;
        return {};
      },
    });
    const processor = createProcessor({ plugins: [countingPlugin] });
    processor.processBuffer(buf);
    processor.processBuffer(buf);
    expect(createOnceCallCount).toBe(1);
  });

  it('processBufferToTree returns a tree object with type === "root"', () => {
    const buf = buildHelloWorldBuffer();
    const processor = createProcessor({ plugins: [] });
    const result = processor.processBufferToTree(buf);
    expect(result.tree).toBeTruthy();
    expect(result.tree.type).toBe("root");
  });

  it("processBufferToTree tree has children", () => {
    const buf = buildHelloWorldBuffer();
    const processor = createProcessor({ plugins: [] });
    const result = processor.processBufferToTree(buf);
    expect(Array.isArray(result.tree.children)).toBe(true);
    expect(result.tree.children!.length).toBeGreaterThan(0);
  });

  it("getDiagnostics returns array (empty when no processor-level reports)", () => {
    const processor = createProcessor({ plugins: [] });
    expect(processor.getDiagnostics()).toEqual([]);
  });

  it("createProcessor throws for invalid plugin (missing meta.name)", () => {
    expect(() =>
      createProcessor({
        plugins: [
          {
            meta: {} as { name: string },
            createOnce() {
              return {};
            },
          },
        ],
      }),
    ).toThrow(/Invalid plugin/);
  });
});
