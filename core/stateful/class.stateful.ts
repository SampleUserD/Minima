export type StatefulSubscriber<T> = (value: T) => void
export type StatefulSetter<T> = (value: T) => T

export class Stateful<T> {
  private _subscribers: Set<StatefulSubscriber<T>> = new Set()

  public constructor(private _value: T) {
    this.Notify()
  }

  public Get(): T {
    return this._value
  }

  public Set(fabric: StatefulSetter<T>): void {
    this._value = fabric(this._value)
    this.Notify()
  }

  public Subscribe(subscriber: StatefulSubscriber<T>): void {
    this._subscribers.add(subscriber)
  }

  public Notify(): void {
    for (const subscriber of this._subscribers) {
      subscriber(this._value)
    }
  }

  public Dispose(): void {
    this._subscribers.clear()
  }
}