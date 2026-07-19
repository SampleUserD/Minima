import { Stateful } from '@/core/stateful/class.stateful'
import minima, { Abstract, jsx } from '@/index'

let ID = 1

function _random(max) {
  return Math.round(Math.random() * 1000) % max
}

function buildData(count = 1000) {
  const adjectives: string[] = [
    'pretty',
    'large',
    'big',
    'small',
    'tall',
    'short',
    'long',
    'handsome',
    'plain',
    'quaint',
    'clean',
    'elegant',
    'easy',
    'angry',
    'crazy',
    'helpful',
    'mushy',
    'odd',
    'unsightly',
    'adorable',
    'important',
    'inexpensive',
    'cheap',
    'expensive',
    'fancy'
  ]
  const colours: string[] = [
    'red',
    'yellow',
    'blue',
    'green',
    'pink',
    'brown',
    'purple',
    'brown',
    'white',
    'black',
    'orange'
  ]
  const nouns: string[] = [
    'table',
    'chair',
    'house',
    'bbq',
    'desk',
    'car',
    'pony',
    'cookie',
    'sandwich',
    'burger',
    'pizza',
    'mouse',
    'keyboard'
  ]
  const data: { id: number, label: string }[] = []
  for (let i = 0; i < count; i++) {
    data.push({
      id: ID++,
      label: (
        adjectives[_random(adjectives.length)] +
        ' ' +
        colours[_random(colours.length)] +
        ' ' +
        nouns[_random(nouns.length)]
      )
    })
  }
  return data
}

function App() {
  const rows = new minima.ArrayOf<{ id: number, label: string }>([], item => new Stateful(item))
  const selected = new minima.Singular<number | null>(null)
  const counter = new minima.Singular<number>(0)

  function create1000th() {
    rows.Replace(...buildData(1000))
  }

  function create10000th() {
    rows.Replace(...buildData(10000))
  }

  function append1000th() {
    rows.Append(...buildData(1000))
  }

  function update10th() {
    for (let i = 0; i < rows.Length; i += 10) {
      rows.Update(i, v => {
        v.label += ' !!!'

        return v
      })
    }
  }

  function clear() {
    rows.Clear()
  }

  function swap() {
    if (rows.Length > 998) {
      rows.Swap(1, 998)
    }
  }

  function select_row(index) {
    rows.SelectIndex(index)
  }

  function delete_row(id) {
    const idx = rows.Value.findIndex(row => row.Value.id == id)

    rows.Remove(idx)
  }

  return (
    <div class="container">
      <div class="jumbotron">
        <div class="row">
          <div class="col-md-6">
            <h1>Minima performance {counter}</h1>
          </div>
          <div class="col-md-6">
            <div class="row">
              <div class="col-sm-6 smallpad"><button type="button" class="btn btn-primary btn-block" id="run" onclick={create1000th}>Create 1,000 rows</button></div>
              <div class="col-sm-6 smallpad"><button type="button" class="btn btn-primary btn-block" id="runlots" onclick={create10000th}>Create 10,000 rows</button></div>
              <div class="col-sm-6 smallpad"><button type="button" class="btn btn-primary btn-block" id="add" onclick={append1000th}>Append 1,000 rows</button></div>
              <div class="col-sm-6 smallpad"><button type="button" class="btn btn-primary btn-block" id="update" onclick={update10th}>Update every 10th row</button></div>
              <div class="col-sm-6 smallpad"><button type="button" class="btn btn-primary btn-block" id="clear" onclick={clear}>Clear</button></div>
              <div class="col-sm-6 smallpad"><button type="button" class="btn btn-primary btn-block" id="swaprows" onclick={swap}>Swap Rows</button></div>
            </div>
          </div>
        </div>
      </div>
      <table class="table table-hover table-striped test-data">
        <tbody
          each={rows}
          item={
            (row: Abstract<{ id: number, label: string }>, index: Abstract<number>) => {
              return (
                <tr
                  m-select={(element: HTMLElement) => element.className = "danger"}
                  m-unselect={(element: HTMLElement) => element.className = String()}>
                  <td class="col-md-1" m-text={() => row.Value.id}></td>
                  <td class="col-md-4">
                    <a
                      m-slot-index={() => index.Value}
                      onclick={event => select_row(event.target.slots.index)}
                      m-text={() => row.Value.label}>
                    </a>
                  </td>
                  <td class="col-md-1">
                    <a
                      onclick={event => delete_row(event.target.slots.index)}>
                      <span
                        m-slot-fix-index={() => row.Value.id}
                        class="glyphicon glyphicon-remove"
                        aria-hidden="true">
                      </span>
                    </a>
                  </td>
                  <td class="col-md-6"></td>
                </tr>
              )
            }
          }
        >
        </tbody>
      </table>
    </div>
  )
}

document.addEventListener("DOMContentLoaded", () => {
  const dom = new minima.DOM(document.body)

  dom.Render(App())
})