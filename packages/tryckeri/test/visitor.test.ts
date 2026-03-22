import { test, expect } from "vitest";
import { ArenaReader } from "../src/arena-reader.ts";
import { DataMap } from "../src/data-map.ts";
import { visitArena, MutationType } from "../src/visitor.ts";
import { buildHelloWorldBuffer } from "./fixtures.ts";
import type { MdastNode } from "../src/types.ts";

function setup() {
  const buf = buildHelloWorldBuffer();
  const reader = new ArenaReader(buf);
  const dataMap = new DataMap();
  return { reader, dataMap };
}

test("visitor with no subscriptions produces no mutations, no diagnostics", () => {
  const { reader, dataMap } = setup();
  const result = visitArena(reader, {}, dataMap);
  expect(result.mutations.length).toBe(0);
  expect(result.diagnostics.length).toBe(0);
  expect(result.hasMutations).toBe(false);
});

test("visiting heading nodes — callback fires once for the test doc", () => {
  const { reader, dataMap } = setup();
  let callCount = 0;
  visitArena(
    reader,
    {
      heading(_node: MdastNode) {
        callCount++;
      },
    },
    dataMap,
  );
  expect(callCount).toBe(1);
});

test('visitor callback receives correct MDAST node (type="heading", depth=1)', () => {
  const { reader, dataMap } = setup();
  let capturedNode: MdastNode | null = null;
  visitArena(
    reader,
    {
      heading(node: MdastNode) {
        capturedNode = node;
      },
    },
    dataMap,
  );
  expect(capturedNode).not.toBeNull();
  expect(capturedNode!.type).toBe("heading");
  expect(capturedNode!.depth).toBe(1);
});

test("return value from visitor creates a Replace mutation", () => {
  const { reader, dataMap } = setup();
  const newNode = { type: "paragraph", children: [] } as unknown as MdastNode;
  const result = visitArena(
    reader,
    {
      heading(_node: MdastNode) {
        return newNode;
      },
    },
    dataMap,
  );
  expect(result.mutations.length).toBe(1);
  expect(result.mutations[0].type).toBe(MutationType.Replace);
  expect(result.mutations[0].newNode).toBe(newNode);
});

test("context.removeNode creates a Remove mutation", () => {
  const { reader, dataMap } = setup();
  const result = visitArena(
    reader,
    {
      heading(node, context) {
        context.removeNode(node);
      },
    },
    dataMap,
  );
  expect(result.mutations.length).toBe(1);
  expect(result.mutations[0].type).toBe(MutationType.Remove);
  expect(result.mutations[0].nodeId).toBe(1);
});

test("context.report creates a diagnostic entry", () => {
  const { reader, dataMap } = setup();
  const result = visitArena(
    reader,
    {
      heading(node, context) {
        context.report({ message: "test diagnostic", node, severity: "warning" });
      },
    },
    dataMap,
  );
  expect(result.diagnostics.length).toBe(1);
  expect(result.diagnostics[0].message).toBe("test diagnostic");
  expect(result.diagnostics[0].severity).toBe("warning");
  expect(result.diagnostics[0].nodeId).toBe(1);
});

test("plugin.before is called before traversal", () => {
  const { reader, dataMap } = setup();
  const order: string[] = [];
  visitArena(
    reader,
    {
      before(_context) {
        order.push("before");
      },
      heading(_node: MdastNode) {
        order.push("heading");
      },
    },
    dataMap,
  );
  expect(order[0]).toBe("before");
  expect(order[1]).toBe("heading");
});

test("plugin.after is called after traversal", () => {
  const { reader, dataMap } = setup();
  const order: string[] = [];
  visitArena(
    reader,
    {
      heading(_node: MdastNode) {
        order.push("heading");
      },
      after(_context) {
        order.push("after");
      },
    },
    dataMap,
  );
  expect(order[0]).toBe("heading");
  expect(order[1]).toBe("after");
});

test("transformRoot gets the full materialized root", () => {
  const { reader, dataMap } = setup();
  let capturedRoot: MdastNode | null = null;
  visitArena(
    reader,
    {
      transformRoot(root, _context) {
        capturedRoot = root;
      },
    },
    dataMap,
  );
  expect(capturedRoot).not.toBeNull();
  expect(capturedRoot!.type).toBe("root");
  expect(capturedRoot!._nodeId).toBe(0);
});

test("multiple subscribed types — all fire", () => {
  const { reader, dataMap } = setup();
  const fired: string[] = [];
  visitArena(
    reader,
    {
      heading(_node: MdastNode) {
        fired.push("heading");
      },
      text(_node: MdastNode) {
        fired.push("text");
      },
      paragraph(_node: MdastNode) {
        fired.push("paragraph");
      },
    },
    dataMap,
  );
  expect(fired).toContain("heading");
  expect(fired).toContain("paragraph");
  expect(fired.filter((x) => x === "text").length).toBe(2);
});

test("non-subscribed types are not materialized via getNode", () => {
  const { reader, dataMap } = setup();
  let getNodeCalls = 0;
  const proxyReader = new Proxy(reader, {
    get(target, prop) {
      if (prop === "getNode") {
        return function (...args: Parameters<typeof target.getNode>) {
          getNodeCalls++;
          return target.getNode(...args);
        };
      }
      const val = (target as unknown as Record<string | symbol, unknown>)[prop];
      return typeof val === "function" ? val.bind(target) : val;
    },
  });
  visitArena(proxyReader as ArenaReader, { heading(_node: MdastNode) {} }, dataMap);
  expect(getNodeCalls).toBe(1);
});

test("context.source returns the source text", () => {
  const { reader, dataMap } = setup();
  let capturedSource: string | null = null;
  visitArena(
    reader,
    {
      before(context) {
        capturedSource = context.source;
      },
    },
    dataMap,
  );
  expect(capturedSource).toBe("# Hello\n\nWorld");
});

test("hasMutations is false when no mutations, true when there are mutations", () => {
  const { reader, dataMap } = setup();

  const noMutResult = visitArena(reader, { heading(_node: MdastNode) {} }, dataMap);
  expect(noMutResult.hasMutations).toBe(false);

  const mutResult = visitArena(
    reader,
    {
      heading(node, context) {
        context.removeNode(node);
      },
    },
    dataMap,
  );
  expect(mutResult.hasMutations).toBe(true);
});
