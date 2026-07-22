import { Instructions } from "@/core/interpretator/dom/instructions/type.instructions"

export type Applier = (node: HTMLElement, offset: number, data: Instructions) => void