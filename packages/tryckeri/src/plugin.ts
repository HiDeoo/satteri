import type { PluginInstance, VisitorContext } from "./visitor.js";
import type { MdastNode } from "./types.js";
import type { ProcessorContext } from "./pipeline.js";

export interface PluginDefinition {
  name: string;
  createOnce(context: ProcessorContext): PluginInstance;
}

/**
 * Define a plugin. Returns the definition unchanged (identity function),
 * but enforces the plugin contract and provides type documentation.
 */
export function definePlugin(definition: PluginDefinition): PluginDefinition {
  if (!definition.name) {
    throw new Error("Plugin definition must have a name");
  }
  if (typeof definition.createOnce !== "function") {
    throw new Error("Plugin definition must have a createOnce function");
  }
  return definition;
}

export type { PluginInstance, VisitorContext, MdastNode };
