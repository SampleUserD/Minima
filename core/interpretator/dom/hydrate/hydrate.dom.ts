import { VNode } from "@/core/adapters/type.v-node";
import { DOMListHydrator } from "@/core/interpretator/dom/hydrate/list.hydrator.dom";
import { RegisterSubscription } from "@/core/interpretator/dom/subscriptions/dom.manager";
import { ApplyEvents, ClearEvents, EnsureGlobalListener } from "@/core/interpretator/dom/transform/transform.dom";
import { Stateful } from "@/core/stateful/class.stateful";

const BIND_ATTRIBUTE_PREFIX = 'bind'
const FN_ATTRIBUTE_PREFIX = 'fn'
const FN_DEPS_ATTRIBUTE_PREFIX = 'fn-deps'
const M_TEXT_ATTRIBUTE = 'm-text'
const M_EX_ATTRIBUTE = 'm-ex'
const M_ON_ATTRIBUTE = 'm-on'
const M_SLOT_ATRRIBUTE = 'm-slot'
const M_SLOT_FIX_ATRRIBUTE = 'm-slot-fix'

function HydrateTextAttribute(node: VNode, element: HTMLElement, key: string) {
  if (key === M_TEXT_ATTRIBUTE) {
    const value = node.Properties[M_TEXT_ATTRIBUTE]

    element.textContent = value()
  }
}

function HydrateSlotAttribute(node: VNode, element: HTMLElement, key: string) {
  if (key.startsWith(M_SLOT_FIX_ATRRIBUTE)) {
    const name = key.slice(M_SLOT_FIX_ATRRIBUTE.length + 1)
    const value = node.Properties[key]
    const patch = element as any

    if (patch.slots === undefined) {
      patch.slots = {}
    }

    if (name in patch.slots == false) {
      patch.slots[name] = value()
    }
  } else if (key.startsWith(M_SLOT_ATRRIBUTE)) {
    const name = key.slice(M_SLOT_ATRRIBUTE.length + 1)
    const value = node.Properties[key]
    const patch = element as any

    if (patch.slots === undefined) {
      patch.slots = {}
    }

    patch.slots[name] = value()
  }
}

function HydrateBindAttribute(node: VNode, element: HTMLElement, key: string) {
  if (key.startsWith(BIND_ATTRIBUTE_PREFIX)) {
    const name = key.slice(BIND_ATTRIBUTE_PREFIX.length + 1)
    const value = node.Properties[key]
    const update = () => element.setAttribute(name, value.Value)

    update()

    RegisterSubscription(element, value.Subscribe(update))
  }
}

function HydrateFunctionalAttribute(node: VNode, element: HTMLElement, key: string) {
  if (key.startsWith(FN_ATTRIBUTE_PREFIX)) {
    const name = key.slice(FN_ATTRIBUTE_PREFIX.length + 1)
    const value = node.Properties[key]

    element.setAttribute(name, value())
  }
}

function HydrateAttributes(node: VNode, element: HTMLElement) {
  for (const key of Object.keys(node.Properties)) {
    HydrateSlotAttribute(node, element, key)
    HydrateBindAttribute(node, element, key)
    HydrateTextAttribute(node, element, key)
    HydrateFunctionalAttribute(node, element, key)
  }
}

function HydrateTextContent(node: VNode, element: HTMLElement) {
  const singular = node.Children.filter(r => r instanceof Stateful)

  const update = () => element.textContent = node.Children.map(r => r instanceof Stateful ? r.Get() : r).join(String())

  singular.forEach(r => {
    const stateful = r as Stateful<any>

    update()

    const unsubscribe = stateful.Subscribe(update)

    RegisterSubscription(element, unsubscribe)
  })
}

function HydrateList(node: VNode, element: HTMLElement) {
  const each = node.Properties.each
  const item = node.Properties.item

  const exists = each === undefined || item === undefined

  if (exists === false) {
    const hydrator = new DOMListHydrator(each, item, element)

    hydrator.Hydrate()
  }
}

export function Hydrate(node: VNode, element: HTMLElement) {
  HydrateAttributes(node, element)
  HydrateTextContent(node, element)
  HydrateList(node, element)

  ClearEvents(element)
  ApplyEvents(node, element)
}

export function DeepHydrate(node: VNode, element: HTMLElement) {
  Hydrate(node, element)

  for (let index = 0, length = node.Children.length; index < length; index++) {
    const child = node.Children[index]
    const child_element = element.children[index]

    if (typeof child !== 'object' || child instanceof Stateful) {
      continue
    }

    DeepHydrate(child as VNode, child_element as HTMLElement)
  }
}