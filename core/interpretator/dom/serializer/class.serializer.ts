export class Serializer {
  private static _registry: Map<string, Function> = new Map()
  private static _id: number = 0

  private static Register(fn: Function): string {
    const id = `fn-${this._id++}`
    this._registry.set(id, fn)
    return id
  }

  public static Serialize(object: Record<string, any>): string {
    return JSON.stringify(object, (key, value) => {
      if (typeof value === 'function') {
        return this.Register(value)
      } else {
        return value
      }
    })
  }

  public static Deserialize(object: string): Record<string, any> {
    return JSON.parse(object, (key, value) => {
      if (typeof value === 'string' && value.startsWith('fn')) {
        return this._registry.get(value)!
      } else {
        return value
      }
    })
  }
}