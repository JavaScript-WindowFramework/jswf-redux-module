# @jswf/redux-module

Make Redux operations modular

- Document
[https://ttis.croud.jp/?uuid=ed418ee1-730b-40d7-b748-f2969d8d430d](https://ttis.croud.jp/?uuid=ed418ee1-730b-40d7-b748-f2969d8d430d)

## １．Usage

### 1.1 createStore

Associate ModuleReducer with Store

```tsx
//Store create
const store = createStore(ModuleReducer);

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("root") as HTMLElement
);
```

### 1.2 Creating a store module

When using TypeScript, the structure of module data can be specified
defaultState can be omitted, but in that case undefined is returned when data is accepted.

```tsx
//Store module data type
export interface State {
  msg: string;
  count: number;
}
export class TestModule extends ReduxModule<State> {
  //init value
  static defaultState: State = {
    msg: "init",
    count: 0,
    other:{
      v:123
    }
  };
}
```

### 1.3 Reading and writing data with the Hooks component

```tsx
function HooksApp() {
  const module = useModule(TestModule);
  const value = module.getState()!;
  return (
    <div
      style={{ border: "solid 1px", display: "inline-block", padding: "1em" }}
    >
      <div>AppComponent</div>
      <button
        onClick={() => {
          module.setState({ msg: "click!", count: value.count + 1 });
        }}
      >
        button
      </button>
      <div>{value.msg}</div>
      <div>{value.count}</div>
    </div>
  );
}
```

### 1.4 Reading and writing data with the Class component

```tsx
class _ClassApp extends Component {
  render() {
    const module = mapModule(this.props, TestModule);
    const value = module.getState()!;
    return (
      <div
        style={{ border: "solid 1px", display: "inline-block", padding: "1em" }}
      >
        <div>AppComponent</div>
        <button
          onClick={() => {
            //Set data
            module.setState({ msg: "click!", count: value.count + 1 });
          }}
        >
          button
        </button>
        <div>{value.msg}</div>
        <div>{value.count}</div>
      </div>
    );
  }
}
const ClassApp = mapConnect(_ClassApp, TestModule);
```

### 1.5 Sample

```ts
import React from "react";
import * as ReactDOM from "react-dom";
import { createStore } from "redux";
import { Provider } from "react-redux";
import { ModuleReducer, useModule, ReduxModule } from "@jswf/redux-module";

//Store module data type
export interface State {
  msg: string;
  count: number;
}
export class TestModule extends ReduxModule<State> {
  //init value
  static defaultState: State = {
    msg: "init",
    count: 0
  };
}

function App() {
  //Use modules
  const module = useModule(TestModule);
  //Get data
  const value = module.getState()!;
  return (
    <div>
      <div>AppComponent</div>
      <button
        onClick={() => {
          //Set data
          module.setState({ msg: "click!", count: value.count + 1 });
        }}
      >
        button
      </button>
      <div>{value.msg}</div>
      <div>{value.count}</div>
    </div>
  );
}

//Store create
const store = createStore(ModuleReducer);

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("root") as HTMLElement
);

```

## ２．license

MIT
