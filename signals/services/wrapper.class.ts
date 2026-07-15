import { AsTuple } from "../types/astuple.type"

export class Wrapper {
  public static Wrap<T>(object: T): AsTuple<T> {
    const value = Array.isArray(object) ? object : [object]
    return value as AsTuple<T>
  }
}