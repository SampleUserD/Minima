import { VNode } from "@/core/adapters/type.v-node";
import { BIND_ATTRIBUTE_PREFIX, FN_ATTRIBUTE_PREFIX } from "@/core/interpretator/dom/hydrate/hydrate.dom";
import { PatchDOM } from "@/core/interpretator/dom/patch.dom";
import { Stateful } from "@/core/stateful/class.stateful";

export const EVENT_PREFIX = 'on'

const ACTIVE_EVENTS: Set<string> = new Set()

function IsSpecialAttribute(key: string) {
  return key === 'each' || key === 'item' || key.startsWith(EVENT_PREFIX) || key.startsWith(BIND_ATTRIBUTE_PREFIX) || key.startsWith(FN_ATTRIBUTE_PREFIX)
}

function EnsureGlobalListener(name: string) {
  if (ACTIVE_EVENTS.has(name)) {
    return
  }

  ACTIVE_EVENTS.add(name)

  document.body.addEventListener(name, (event: Event) => {
    let target = event.target as HTMLElement

    while (target && target !== document.body) {
      const listeners = (target as any).listeners

      if (listeners != undefined) {
        const callback = listeners.get(name)

        callback?.(event)

        if (event.cancelBubble) {
          break
        }
      }

      target = target.parentElement!
    }
  })
}

export function ClearEvents(element: HTMLElement) {
  const patch = element as any

  if (patch.listeners !== undefined) {
    patch.listeners.clear()
  }
}

export function ApplyEvents(node: VNode, element: HTMLElement) {
  for (const [key, value] of Object.entries(node.Properties)) {
    if (key.startsWith(EVENT_PREFIX)) {
      const name = key.slice(EVENT_PREFIX.length).toLowerCase()
      const patch = element as any

      if (patch.listeners === undefined) {
        patch.listeners = new Map<string, (event: Event) => void>()
      }

      patch.listeners.set(name, value)

      EnsureGlobalListener(name)
    }
  }
}

function ApplyAttributes(node: VNode, element: HTMLElement) {
  for (const [key, value] of Object.entries(node.Properties)) {
    if (IsSpecialAttribute(key) == false) {
      element.setAttribute(key, value)
    }
  }
}

function ApplyTextContent(node: VNode, element: HTMLElement) {
  element.textContent = node.Children.filter(r => typeof r !== 'object').join(String())
}

export function Transform(node: VNode): HTMLElement {
  if (typeof node.Type === 'string') {
    const element = document.createElement(node.Type) as any

    PatchDOM(node, element)

    ApplyAttributes(node, element)
    ApplyTextContent(node, element)
    ApplyEvents(node, element)

    for (const child of node.Children) {
      if (typeof child === 'object') {
        if (child instanceof Stateful == false) {
          element.appendChild(Transform(child as VNode))
        }
      }
    }

    return element
  }

  if (typeof node.Type === 'function') {
    return Transform(node.Type({ Properties: node.Properties }))
  }

  throw new Error(`No such type as ${node.Type}`)
}