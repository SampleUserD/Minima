export type Action = () => void

export class Scheduler {
  private static Batch: Set<Action> = new Set()
  private static Pending: boolean = false

  private static Update(): void {
    this.Batch.forEach(action => action())
    this.Batch.clear()
  }

  private static Schedule(): void {
    if (this.Pending == false) {
      this.Pending = true

      requestAnimationFrame(() => {
        this.Update()
        this.Pending = false
      })
    }
  }

  public static Tick(action: Action): void {
    this.Batch.add(action)
    this.Schedule()
  }
}