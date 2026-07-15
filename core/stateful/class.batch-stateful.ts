import { Scheduler } from "@/core/scheduler/class.scheduler"
import { Stateful } from "@/core/stateful/class.stateful"

export class BatchStateful<T> extends Stateful<T> {
  private _flushing: boolean = false

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