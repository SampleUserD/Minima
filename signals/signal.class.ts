import { Duration, Listener } from "./@types"
import { Subscription } from "./subscription.class"
import { Descriptor } from "./subscription.class"
import { Wrapper } from "./services/wrapper.class"
import { AsTuple } from "./types/astuple.type"

export class Signal<T> {
  private _subscriptions: Subscription<T>[] = []

  private Clean(): void {
    this._subscriptions = this._subscriptions.filter(subscription => subscription.Alive == true)
  }

  public Derive(old: Signal<T>): Signal<T> {
    this._subscriptions = old._subscriptions
    return this
  }

  public Copy(): Signal<T> {
    return this
  }

  public Clear(): void {
    this.Clean()
  }

  public Listen(listener: Listener<T>, duration: Duration = Number.MAX_SAFE_INTEGER) {
    const subscription = new Subscription<T>(listener, duration, Date.now())

    this._subscriptions.push(subscription)

    return subscription
  }

  public Emit(data: T) {
    this.Clean()

    this._subscriptions.forEach(subscription => subscription.Execute(data))
  }

  public Then<U>(signal: Signal<U>) {
    return new Connector(signal, this)
  }

  public Until<U>(signal: Signal<U>) {
    return new Interruptor(signal, this)
  }

  public When(condition: (event: T) => boolean) {
    return new When(this, condition)
  }

  public Map<U>(map: (event: T) => U) {
    return new Mapper<U, T>(this, map)
  }

  public Along<U>(signal: Signal<U>, map: (event: T) => U) {
    return new Synchronizator(signal, this, map)
  }
}

export class Tracker<A, B> extends Signal<[...AsTuple<B>, ...AsTuple<A>]> {
  private _actives: Descriptor[] = []
  private _setups: Descriptor[] = []

  public constructor(private _signal: Signal<A>, private _parent: Signal<B>) {
    super()
  }

  protected TrackSetup(setup: Descriptor) {
    this._setups.push(setup)
    return setup
  }

  protected TrackActive(active: Descriptor) {
    this._actives.push(active)
    return active
  }

  protected ClearActives() {
    this._actives.forEach(active => active.Cancel())
    this._actives = []
  }

  public Clear() {
    this.ClearActives()

    this._parent.Clear()
  }

  public Dispose() {
    this.Clear()

    this._setups.forEach(setup => setup.Cancel())
    this._setups = []
  }

  public get Signal() {
    return this._signal
  }

  public get Parent() {
    return this._parent
  }
}

export class Synchronizator<A, B> extends Signal<B> {
  private _subscription: Subscription<B>

  public constructor(signal: Signal<A>, parent: Signal<B>, map: (event: B) => A) {
    super()

    this._subscription = parent.Listen(event => {
      signal.Emit(map(event))
    })
  }

  public Dispose(): void {
    this._subscription.Cancel()
  }
}

export class Connector<A, B> extends Tracker<A, B> {
  public constructor(signal: Signal<A>, parent: Signal<B>) {
    super(signal, parent)

    this.TrackSetup(
      this.Parent.Listen(ex => {
        this.ClearActives()
        this.TrackActive(
          this.Signal.Listen(ey => this.Emit([...Wrapper.Wrap(ex), ...Wrapper.Wrap(ey)]))
        )
      })
    )
  }
}

export class Interruptor<A, B> extends Tracker<A, B> {
  public constructor(signal: Signal<A>, parent: Signal<B>) {
    super(signal, parent)

    let transmit: A

    this.TrackSetup(
      signal.Listen(e => {
        transmit = e
        this.Clear()
      })
    )

    this.TrackSetup(
      parent.Listen(e => this.Emit([...Wrapper.Wrap(e), ...Wrapper.Wrap(transmit)]))
    )
  }
}

export class When<T> extends Signal<T> {
  private _subscription: Subscription<T>

  public constructor(signal: Signal<T>, condition: (event: T) => boolean) {
    super()

    this._subscription = signal.Listen(
      event => {
        if (condition(event)) {
          this.Emit(event)
        }
      }
    )
  }

  public Dispose(): void {
    this._subscription.Cancel()
    this.Clear()
  }
}

export class Mapper<U, T> extends Signal<U> {
  private _subscription: Subscription<T>

  public constructor(signal: Signal<T>, map: (event: T) => U) {
    super()

    this._subscription = signal.Listen(event => this.Emit(map(event)))
  }

  public Dispose(): void {
    this._subscription.Cancel()
    this.Clear()
  }
}