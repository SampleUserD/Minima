import { AbstractState } from "@/core/state/abstract.state"

export type Version = number
export const START_VERSION = 0

export function NextVersion<T>(state: AbstractState<T>): Version {
  return state.Version + 1
}
