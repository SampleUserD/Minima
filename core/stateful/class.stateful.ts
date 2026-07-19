import { AbstractStateful } from "@/core/stateful/abstract.stateful"

export type StatefulSubscriber<T> = (value: T) => void
export type StatefulSetter<T> = (value: T) => T

export class Stateful<T> implements AbstractStateful<T> {
  private _subscribers: Set<StatefulSubscriber<T>> = new Set()
  private _version: number = 0

  public constructor(private _value: T) {
    this.Notify()
  }

  public Get(): T {
    return this._value
  }

  public If<U>(predicate: (value: T) => boolean, then: (value: T) => U, otherwise: (value: T) => U, factory: (value: U) => Stateful<U> = v => new Stateful(v)): Stateful<U> {
    const derived = factory(predicate(this._value) ? then(this._value) : otherwise(this._value))

    this.Subscribe(value => derived.Set(() => predicate(value) ? then(value) : otherwise(value)))

    return derived
  }

  public Set(fabric: StatefulSetter<T>): void {
    this._value = fabric(this._value)
    this.Notify()

    this._version++
  }

  public Subscribe(subscriber: StatefulSubscriber<T>): () => void {
    this._subscribers.add(subscriber)

    return () => this._subscribers.delete(subscriber)
  }

  public Notify(): void {
    for (const subscriber of this._subscribers) {
      subscriber(this._value)
    }
  }

  public Dispose(): void {
    this._subscribers.clear()

    this._version = 0
  }

  public get Value(): T {
    return this.Get()
  }

  public get Version(): number {
    return this._version
  }
}