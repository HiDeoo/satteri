/**
 * Top-level compile functions — the primary public API.
 *
 * These are the "just give me output" functions that wire together parsing,
 * MDAST plugins, HAST plugins, and serialization into a single call.
 */

import { DataMap } from "./data-map.js";
import { HastReader } from "./hast-reader.js";
import { visitHast, type HastVisitorInstance } from "./hast-visitor.js";
import { runPluginsOnBuffer, ProcessorContext } from "./pipeline.js";
import type { PluginDefinition } from "./plugin.js";
import {
  parseToBuffer,
  parseMdxToBuffer,
  mdastBufferToHastBuffer,
  hastBufferToHtmlStr,
  compileHastBufferToJs,
  applyMutations,
} from "../index.js";

// ---------------------------------------------------------------------------
// MDAST plugin initialization helper
// ---------------------------------------------------------------------------

function initMdastPlugins(
  plugins: PluginDefinition[],
): { instance: ReturnType<PluginDefinition["createOnce"]>; name: string }[] {
  const ctx = new ProcessorContext();
  return plugins.map((def) => ({
    instance: def.createOnce(ctx),
    name: def.name,
  }));
}

// ---------------------------------------------------------------------------
// HAST plugin runner (unified: uses CommandBuffer + Rust applyMutations)
// ---------------------------------------------------------------------------

/**
 * Run HAST plugins on a HAST binary buffer.
 *
 * Uses the same CommandBuffer + Rust `applyMutations` path as MDAST plugins.
 * Returns the (possibly mutated) HAST binary buffer.
 */
function runHastPlugins(
  hastBuf: Uint8Array,
  plugins: HastVisitorInstance[],
): Uint8Array {
  if (plugins.length === 0) return hastBuf;

  let currentBuffer: Uint8Array = hastBuf;

  for (const plugin of plugins) {
    const reader = new HastReader(currentBuffer);
    const dataMap = new DataMap();
    const result = visitHast(reader, plugin, dataMap);

    if (result.hasMutations) {
      currentBuffer = applyMutations(currentBuffer, result.commandBuffer);
    }
  }

  return currentBuffer;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface CompileOptions {
  /** MDAST plugins (tree transformations on the Markdown AST). */
  mdastPlugins?: PluginDefinition[];
  /** HAST plugins (tree transformations on the HTML AST). */
  hastPlugins?: HastVisitorInstance[];
}

/**
 * Parse Markdown source and compile to an HTML string.
 *
 * Optionally runs MDAST and/or HAST plugins in sequence.
 */
export function compileMarkdownToHtml(
  source: string,
  options: CompileOptions = {},
): string {
  const { mdastPlugins = [], hastPlugins = [] } = options;

  // 1. Parse to MDAST binary buffer
  let mdastBuf: Uint8Array = parseToBuffer(source);

  // 2. Run MDAST plugins (if any)
  if (mdastPlugins.length > 0) {
    const instances = initMdastPlugins(mdastPlugins);
    const result = runPluginsOnBuffer(mdastBuf, instances);
    mdastBuf =
      result.buffer instanceof Uint8Array
        ? result.buffer
        : new Uint8Array(result.buffer);
  }

  // 3. Convert MDAST → HAST binary buffer
  let hastBuf = mdastBufferToHastBuffer(mdastBuf);

  // 4. Run HAST plugins (if any)
  hastBuf = runHastPlugins(hastBuf, hastPlugins);

  // 5. Serialize to HTML
  return hastBufferToHtmlStr(hastBuf);
}

/**
 * Parse MDX source and compile to JavaScript.
 *
 * Optionally runs MDAST and/or HAST plugins before compilation.
 */
export function compileMdxToJs(
  source: string,
  options: CompileOptions = {},
): string {
  const { mdastPlugins = [], hastPlugins = [] } = options;

  // 1. Parse to MDAST binary buffer
  let mdastBuf: Uint8Array = parseMdxToBuffer(source);

  // 2. Run MDAST plugins (if any)
  if (mdastPlugins.length > 0) {
    const instances = initMdastPlugins(mdastPlugins);
    const result = runPluginsOnBuffer(mdastBuf, instances);
    mdastBuf =
      result.buffer instanceof Uint8Array
        ? result.buffer
        : new Uint8Array(result.buffer);
  }

  // 3. Convert MDAST → HAST binary buffer
  let hastBuf = mdastBufferToHastBuffer(mdastBuf);

  // 4. Run HAST plugins (if any)
  hastBuf = runHastPlugins(hastBuf, hastPlugins);

  // 5. Compile HAST → JavaScript
  return compileHastBufferToJs(hastBuf);
}
