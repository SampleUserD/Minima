import { Scheduler } from "@/core/scheduler/class.scheduler"
import { Signal } from "@/signals/signal.class"

export class Trigger {
  private static _trigger: Signal<string> = new Signal()
  private static _flushing: boolean = false

  public static On(callback: () => void): void {
    this._trigger.Listen(callback)
  }

  public static Trigger(operation: string): void {
    if (this._flushing === false) {
      this._flushing = true

      Scheduler.Tick(() => {
        this._trigger.Emit(operation)
        this._flushing = false
      })
    }
  }
}