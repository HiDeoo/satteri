import { test, expect } from "vitest";
import { DataMap } from "../src/data-map.js";

test("get returns null for unknown keys", () => {
  const dm = new DataMap();
  expect(dm.get(0)).toBeNull();
  expect(dm.get(999)).toBeNull();
});

test("set then get returns the value", () => {
  const dm = new DataMap();
  dm.set(1, { foo: "bar" });
  expect(dm.get(1)).toEqual({ foo: "bar" });
});

test("merge merges objects", () => {
  const dm = new DataMap();
  dm.set(1, { a: 1 });
  dm.merge(1, { b: 2 });
  expect(dm.get(1)).toEqual({ a: 1, b: 2 });
});

test("merge creates new entry when key does not exist", () => {
  const dm = new DataMap();
  dm.merge(5, { x: 42 });
  expect(dm.get(5)).toEqual({ x: 42 });
});

test("delete removes key", () => {
  const dm = new DataMap();
  dm.set(2, { v: "hello" });
  dm.delete(2);
  expect(dm.get(2)).toBeNull();
});

test("clear empties map", () => {
  const dm = new DataMap();
  dm.set(1, { a: "a" });
  dm.set(2, { b: "b" });
  dm.clear();
  expect(dm.size).toBe(0);
  expect(dm.get(1)).toBeNull();
});

test("size property", () => {
  const dm = new DataMap();
  expect(dm.size).toBe(0);
  dm.set(1, { x: 1 });
  expect(dm.size).toBe(1);
  dm.set(2, { y: 2 });
  expect(dm.size).toBe(2);
  dm.delete(1);
  expect(dm.size).toBe(1);
});
