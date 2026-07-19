import { Interpretator, DOM } from "@/core/interpretator"
import { Services } from "@/core/services"
import { jsx, jsxs } from "@/runtime/jsx-runtime"
import { Singular, ArrayOf, Abstract, DependentOf } from "@/core/stateful"

export default {
  jsx,
  jsxs,
  Services,
  DOM,
  ArrayOf,
  Singular,
  Interpretator,
  DependentOf
}

export {
  Abstract,
  Services,
  Singular,
  ArrayOf,
  Interpretator,
  DOM,
  jsx,
  jsxs
}