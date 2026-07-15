import { jsx } from "@/index"
import minima from "@/index"

const App = () => {
  const count = new minima.Batch(0)
  const list = new minima.ArrayOf([])
  const increment = v => v + 1

  console.time('Update state')

  for (let i = 0; i < 1_000_000; i++) {
    count.Set(increment)
  }

  function update() {
    for (let i = 0; i < list.Length; i += 10) {
      list.At(i).Set(v => v + 1)
    }
  }

  console.timeEnd('Update state')

  list.Append(...new Array(10000).fill(0).map((_, i) => i))

  return (
    <div class={count}>
      <span onclick={() => list.Swap(1, 998)}>Hello, {count}</span>
      <ul each={list} item={row => <li>{row}</li>}></ul>
    </div>
  )
}

document.addEventListener("DOMContentLoaded", () => {
  const interpreter = new minima.DOM(document.body)

  interpreter.Render(App())
})