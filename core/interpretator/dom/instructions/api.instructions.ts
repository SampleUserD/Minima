import { Analyzer, AnalyzisPath } from "@/core/interpretator/dom/analyzer/type.analyze"
import { Applier } from "@/core/interpretator/dom/applier/type.applier"
import { Handler, Instructions, Resource } from "@/core/interpretator/dom/instructions/type.instructions"
import { ResourceRegistry } from "@/core/interpretator/dom/resources/class.resource"

const TargetCache: Map<HTMLElement, Map<string, HTMLElement>> = new Map()

export const Analyzers: Analyzer[] = []
export const Appliers: Applier[] = []

export const HANDLER_SIZE = 1
export const URL_SIZE = 1
export const SIZES = 3

export const URLs: ResourceRegistry<string> = new ResourceRegistry()
export const Strings: ResourceRegistry<string> = new ResourceRegistry()
export const Functions: ResourceRegistry<Function> = new ResourceRegistry()

export function Pack(handler: Handler, resources: Resource[], path: { Path: AnalyzisPath, URL: string }): number[] {
  const handler_size = 1
  const path_size = path.Path.length
  const resources_size = resources.length
  const total_size = resources_size + path_size + handler_size + SIZES + URL_SIZE

  return [total_size, resources_size, path_size, handler, ...resources, URLs.Register(path.URL), ...path.Path]
}

export function Register(analyzer: Analyzer, applier: Applier): Handler {
  const id = Analyzers.length

  Analyzers.push(analyzer)
  Appliers.push(applier)

  return id
}

export function GetTotalSize(offset: number, instructions: Instructions) {
  return instructions[offset]
}

export function GetResourcesSize(offset: number, instructions: Instructions) {
  return instructions[offset + 1]
}

export function GetResourceOffset(offset: number, instructions: Instructions) {
  return offset + SIZES + HANDLER_SIZE
}

export function GetResource(index: number, offset: number, instructions: Instructions): Resource {
  return instructions[GetResourceOffset(offset, instructions) + index]
}

export function GetPathSize(offset: number, instructions: Instructions) {
  return instructions[offset + 2]
}

export function GetPathOffset(offset: number, instructions: Instructions) {
  return offset + SIZES + URL_SIZE + HANDLER_SIZE + GetResourcesSize(offset, instructions)
}

export function GetHandler(offset: number, instructions: Instructions) {
  return instructions[offset + 3]
}

export function GetURL(offset: number, instructions: Instructions): string {
  return URLs.Get(instructions[GetPathOffset(offset, instructions) - URL_SIZE])
}

export function GetChild(element: HTMLElement, offset: number, instructions: Instructions): HTMLElement {
  const path_size = GetPathSize(offset, instructions)
  const path_offset = GetPathOffset(offset, instructions)
  const key = GetURL(offset, instructions)

  let targets = TargetCache.get(element)

  if (targets === undefined) {
    targets = new Map()
    TargetCache.set(element, targets)
  }

  let target = targets.get(key)

  if (target) {
    return target
  }

  target = element

  for (let index = 0; index < path_size; index++) {
    target = target.children[instructions[path_offset + index]] as HTMLElement
  }

  targets.set(key, target)

  return target
}

