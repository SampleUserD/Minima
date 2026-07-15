# Minima
### Note [1]
  > Hello, it's **@minima-dev**. I was testing the package for personal uses only and didn't expect any downloads. Sorry, if my previous versions didn't work, they were experimental. I don't drop the project on a halfway. So I hope you will continue use Minima from now on. Please, use versions from at least **0.1.17**/ Please do not use **0.1.19**, **0.1.20**. Thank you for downloading my package! Much love from **@minima-dev**!
### Note [2]
  > The English/Russian documentations will update along each other, in order to not miss a important update!
## English documentation
### 630 LoC. 80ms for 1 million updates. No-VDOM solution.

Minima is a minimalistic frontend framework with reactive state, DI-container out of the box and swift DOM-updates by assigning URL-address for every node. The solution doesn't use Virtual DOM, doesn't need compilation shenanigans and outperforms React by ~1.4x-10x in benchmarks.

> **No React, Vue, Svelte or Solid.** Minima is written from scratch as an instrument for high-performance UI applications.

---

# Feautures
- ⚡ **Swift performance**  
  1 000 000 sync update for about **80 ms**
- 📦 **Minimal size**  
  The whole solution is **630 LoC** compiled JavaScript (~3 KB gzip)
- 🧩 **Component approach**  
  JSX-syntax, effect and state decorators
- 🎯 **Update by URL**  
  Every node has URL like `/div[0]/span[0]`
- 🧠 **FIOI-scheduler**  
  Batching by `requestAnimationFrame` with philosophy "Flushing Independent of Instance" (FIOI)
- 🧬 **Auto-collecting dependencies in effects**  
  `@Effect` derives its dependencies from usage
- 🏗 **Out of the box DI-container**  
  `@Inject` for dependency injection
- 🖼 **Two backends for rendering**  
  DOM and Canvas out of the box
- 📍 **ContextProvider + fabric**  
  Via attribute `fabric` and jsx-tag `ContextProvider`
 
## 🚀 Swift start

```bash
npm i @minima-dev/minima-js
```

### Barebone tsconfig.json
```json

{
  "compilerOptions": {
    "jsx": "react",
    "outDir": "./dist",
    "noImplicitAny": false,
    "module": "esnext",
    "moduleResolution": "bundler",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "useDefineForClassFields": false,
    "rootDir": ".",
    "allowSyntheticDefaultImports": true
  },
  "include": [
    /* Include your project files */  
  ],
  "exclude": [
    "node_modules"
  ]
}

```

### Barebone esbuild config

```js

import esbuild from 'esbuild'

const ctx = await esbuild.context({
  entryPoints: [/* Include your project files */],
  bundle: true,
  outfile: 'dist/index.js',
  format: 'esm',
  platform: 'browser',
  jsx: 'automatic',
  jsxFactory: 'jsx',
  target: 'esnext',
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts'
  }
})

try {
  ctx.watch()
} catch (e) {
  console.log(e)

  process.exit(1)
}

```

### Barebone package.json

```json

{
  "dependencies": {
    "@minima-dev/minima-js": "^0.1.17",
    "esbuild": "^0.28.1",
    "typescript": "^6.0.3"
  },
  "scripts": {
    "watch": "node esbuild.watch.config.js"
  },
  "type": "module"
}

```

## Custom component example

```jsx
import { Component, State, Effect, jsx } from '@minima-dev/minima-js';

class Counter extends Component {
  @State(0) count = 0;

  @Effect
  logOnChange() {
    console.log(`Counter changed to ${this.count()}`);
  }

  increment = () => {
    this.count = () => this.count() + 1;
  };

  Create() {
    return (
      <div>
        <span>Count: {this.count}</span>
        <button onClick={this.increment}>+1</button>
      </div>
    );
  }
}
```

---

## 📊 Benchmarks

| Framework | Time estimated (1 million updates) | Size (min+gzip) | Optimizations  |
|-----------|--------------------------|-------------------|----------------|
| **Minima** | **80 мс** ⚡ | **~3 KB** | Delayed mode (Scheduled DOM)
| React 18  | ~223 мс | ~40 KB | Manual flushSync() + unstable_batchUpdates()

## 🧩 Decorators

### `@State(initialValue)`
Creates reactive field. Returns lambda for reading.

```ts
@State(0) count = 0;
// this.count() — get
// this.count = () => 5 — set
```

### `@Effect`
Subscribes on all fields `@State`, which it uses within its function.

```ts
@Effect
log() {
  console.log(this.count()); // Auto subscription
}
```

### `@Inject(token)`
Injects dependency by token (constructor)

```ts
@Inject(Backend) backend;
```

---

## 🖥 Backends

### DOM
```ts
import { DOMB } from 'minima';
const backend = new DOMB.Base(document.body);
```

### Canvas
I am working on it, it will be released on version 0.2.0

---

## 🔗 URL

Every node is assigned URL relative to its root:
```
/div[0]/span[0]/button[2]
```

It allows:
- Debuggins
- Update the node without diffing
- Virtual scroll and dynamic lists

## Contacts

I am 21 year old boy and I am working on this framework for about 7 days total. Didn't expect somebody will take an interest in my project. I hope your days will be better!

---

## Russian documentation
### 630 строк. 80 мс на 1 млн обновлений. Без виртуалки.

Minima — это минималистичный фронтенд-фреймворк с реактивным состоянием, встроенным DI-контейнером и точечными обновлениями DOM по URL-адресации узлов. 
Он не использует Virtual DOM, не требует сложной компиляции и при этом обходит React по скорости в 1,4-10 раз.

> **Никакого React, Vue, Svelte или Solid.** Minima написан с нуля как инструмент для высокопроизводительных интерфейсов, и это полностью изменило подход автора к фронтенду.

---

## 🔥 Особенности

- ⚡ **Молниеносная производительность**  
  1 000 000 синхронных обновлений за **80 мс**
- 📦 **Минимальный размер**  
  Всего **630 строк** скомпилированного JavaScript (~3 KB gzip)
- 🧩 **Компонентный подход**  
  JSX-синтаксис, декораторы состояния и эффектов
- 🎯 **Точечные обновления по URL**  
  Каждый узел дерева имеет уникальный URL вида `/div[0]/span[0]`
- 🧠 **FIOI-планировщик**  
  Батчинг через `requestAnimationFrame` с философией Flushing Independent of Instance
- 🧬 **Автоматический сбор зависимостей**  
  `@Effect` сам подписывается на используемые поля состояния
- 🏗 **Встроенный DI-контейнер**  
  `@Inject` для внедрения зависимостей
- 🖼 **Два бекенда рендеринга**  
  DOM и Canvas из коробки
- 📍 **Контекст + фабрика**  
  Через атрибут `fabric` и `ContextProvider`

---

## 🚀 Быстрый старт

```bash
npm i @minima-dev/minima-js
# или просто скопируйте index.js в проект
```

### Пример компонента

```jsx
import { Component, State, Effect, jsx } from 'minima';

class Counter extends Component {
  @State(0) count = 0;

  @Effect
  logOnChange() {
    console.log(`Counter changed to ${this.count()}`);
  }

  increment = () => {
    this.count = () => this.count() + 1;
  };

  Create() {
    return (
      <div>
        <span>Count: {this.count}</span>
        <button onClick={this.increment}>+1</button>
      </div>
    );
  }
}
```

---

## 📊 Бенчмарк

| Фреймворк | Время (1 млн обновлений) | Размер (min+gzip) | Optimizations  |
|-----------|--------------------------|-------------------|----------------|
| **Minima** | **80 мс** ⚡ | **~3 KB** | Delayed mode (Scheduled DOM)
| React 18  | ~223 мс | ~40 KB | Ручной flushSync() + unstable_batchUpdates()

> Тест проводился на синхронных обновлениях состояния с точечным ререндером по URL.

---

## 🧠 Как это работает

1. **Статическое дерево** — компоненты рендерятся один раз, URL узлов фиксируются.
2. **Прямые ссылки на DOM** — бекенд хранит Map<URL, DOM-элемент>.
3. **Планировщик через rAF** — все мутации батчатся в один кадр.
4. **@State → DependencyGraph → URL** — изменение состояния обновляет только связанные узлы.
5. **FIOI** — Flushing Independent of Instance, обновления не зависят от дерева.

---

## 🧩 Декораторы

### `@State(initialValue)`
Создаёт реактивное поле. Доступ через геттер возвращает лямбду для чтения.

```ts
@State(0) count = 0;
// this.count() — читаем
// this.count = () => 5 — записываем
```

### `@Effect`
Автоматически подписывается на все `@State`, которые используются внутри.

```ts
@Effect
log() {
  console.log(this.count()); // автоматическая подписка
}
```

### `@Inject(token)`
Внедряет зависимость из DI-контейнера.

```ts
@Inject(Backend) backend;
```

---

## 🖥 Бекенды

### DOM
```ts
import { DOMB } from 'minima';
const backend = new DOMB.Base(document.body);
```

### Canvas
На текущий момент его нет, я его выпущу в версии 0.2.0

---

## 🔗 URL-адресация

Каждый узел получает уникальный URL относительно корня:
```
/div[0]/span[0]/button[2]
```

Это позволяет:
- Отлаживать изменения через консоль
- Обновлять конкретный узел без диффинга
- Строить виртуальный скролл и динамические списки

---

## 📄 Лицензия

MIT © SampleUserD 2026

---

## 🤝 Вклад

Если ты нашёл баг или хочешь предложить фичу — создавай Issue или Pull Request.  
Мы очень скромны, но всегда рады помощи ❤️

---

## 💬 Контакты

Автор — анонимный 21-летний разработчик, который никогда не программировал на React, Vue, Svelte или Solid.  
Но это не помешало ему сделать Minima.

Спасибо за внимание. Надеюсь, этот код сделает чей-то день чуточку лучше. 🚀
