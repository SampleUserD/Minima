type Listener = (event: Event) => void

const Active = new Set<string>()
const Listeners = new WeakMap<HTMLElement, Map<string, Listener>>()

function EnsureListener(name: string): void {
  if (Active.has(name)) {
    return
  }

  Active.add(name)

  document.body.addEventListener(name, function (event: Event) {
    let target = event.target as HTMLElement

    while (target && target !== document.body) {
      const listeners = Listeners.get(target)

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

export function RegisterListener(element: HTMLElement, name: string, listener: Listener) {
  const listeners = Listeners.get(element)! || new Map()

  listeners.set(name, listener)
  Listeners.set(element, listeners)

  EnsureListener(name)
}