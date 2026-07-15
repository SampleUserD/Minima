import { Duration, Time, Listener } from "./@types"

export type Descriptor = Subscription<any>

export class Subscription<T> {
  public constructor(private _listener: Listener<T>, private _duration: Duration, private _start: Time) { }

  public Extend(duration: Duration): void {
    this._duration += duration
  }

  public Cancel(): void {
    this._duration = Number.NEGATIVE_INFINITY
  }

  public Execute(data: T): void {
    this._listener(data)
  }

  public get Alive(): boolean {
    return Date.now() - this._start <= this._duration
  }
}