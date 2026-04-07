import type { MdastPluginInstance } from "./mdast/mdast-visitor.js";
import type { HastVisitorInstance } from "./hast/hast-visitor.js";

export type MdastPluginDefinition = MdastPluginInstance & { name: string };

export type HastPluginDefinition = HastVisitorInstance & { name: string };

export function defineMdastPlugin(definition: MdastPluginDefinition): MdastPluginDefinition {
  if (!definition.name) {
    throw new Error("Plugin definition must have a name");
  }
  return definition;
}

export function defineHastPlugin(definition: HastPluginDefinition): HastPluginDefinition {
  if (!definition.name) {
    throw new Error("Plugin definition must have a name");
  }
  return definition;
}
