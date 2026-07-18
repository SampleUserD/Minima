type Action = () => void
type Subscribers = Set<Action>

export function InitializeSubscriptions(element: HTMLElement): void {
  const patch = element as any

  if (patch.subscribers === undefined) {
    patch.subscribers = new Set<Action>()
  }
}

export function RegisterSubscription(element: HTMLElement, action: Action): void {
  InitializeSubscriptions(element)

  const patch = element as any
  const subscribers = patch.subscribers as Subscribers

  subscribers.add(action)
}

export function ClearSubscriptions(element: HTMLElement): void {
  InitializeSubscriptions(element)

  const patch = element as any
  const subscribers = patch.subscribers as Subscribers

  subscribers.forEach(subscriber => subscriber())
  subscribers.clear()
}