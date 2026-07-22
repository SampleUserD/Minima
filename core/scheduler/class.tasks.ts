import { Scheduler } from "@/core/scheduler/class.scheduler"

export type Operation<T> = {
  Priority: number,
  Name: string,
  Create: () => T
  Options: {
    Cancel: string[]
  }
}

export class Tasks {

}