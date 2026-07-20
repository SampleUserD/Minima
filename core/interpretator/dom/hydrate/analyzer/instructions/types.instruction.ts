export interface BaseInstruction {

}

export interface AttributeInstruction extends BaseInstruction {
  Name: string
}

export interface TextInstruction extends BaseInstruction {
  Getter: () => string
}

export interface SlotInstruction extends AttributeInstruction {
  Getter: () => any
  Name: string
}

export interface EventInstruction extends AttributeInstruction {
  Callback: (event: Event) => void
  Name: string
}

export interface Instructions {
  Hollow: boolean,
  Text: TextInstruction[]
  Slot: SlotInstruction[]
  Fixed: SlotInstruction[]
  Events: EventInstruction[]
}

export function MutableConcatInstructions(a: Instructions, b: Instructions): Instructions {
  a.Text = a.Text.concat(b.Text)
  a.Slot = a.Slot.concat(b.Slot)
  a.Fixed = a.Fixed.concat(b.Fixed)
  a.Events = a.Events.concat(b.Events)

  return a
}

export function CreateHollowInstructions(): Instructions {
  return {
    Hollow: true,
    Text: [],
    Slot: [],
    Fixed: [],
    Events: []
  }
}

export function Touch(object: Instructions): void {
  object.Hollow = false
}

export function IsTouched(object: Instructions): boolean {
  return object.Hollow === false
}