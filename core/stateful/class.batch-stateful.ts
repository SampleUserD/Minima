import { Scheduler } from "@/core/scheduler/class.scheduler"
import { Stateful } from "@/core/stateful/class.stateful"

export class BatchStateful<T> extends Stateful<T> {
  private _flushing: boolean = false

  public If<U>(predicate: (value: T) => boolean, then: (value: T) => U, otherwise: (value: T) => U, factory?: (value: U) => Stateful<U>): Stateful<U> {
    return super.If(predicate, then, otherwise, v => new BatchStateful(v))
  }

  public Notify(): void {
    if (this._flushing == false) {
      this._flushing = true

      Scheduler.Tick(() => {
        super.Notify()
        this._flushing = false
      })
    }
  }
}