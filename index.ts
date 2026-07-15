import { Interpretator, DOM } from "@/core/interpretator"
import { Services } from "@/core/services"
import { jsx, jsxs } from "@/runtime/jsx-runtime"
import { Singular, Batch, ArrayOf } from "@/core/stateful"

export default {
  jsx,
  jsxs,
  Services,
  DOM,
  Batch,
  ArrayOf,
  Singular,
  Interpretator,
}

export {
  Services,
  Singular,
  Batch,
  ArrayOf,
  Interpretator,
  DOM,
  jsx,
  jsxs
}