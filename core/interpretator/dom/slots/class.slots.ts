const Slots: WeakMap<HTMLElement, Record<string, Slot>> = new WeakMap()

export type Slot = () => any

export function GetSlots(node: HTMLElement): Record<string, Slot> {
  return Slots.get(node)! || {}
}

export function RegisterSlots(node: HTMLElement, slots: Record<string, Slot>): void {
  Slots.set(node, slots)
}