# @jswf/redux-module

[![npm version](https://badge.fury.io/js/%40jswf%2Fredux-module.svg)](https://badge.fury.io/js/%40jswf%2Fredux-module)

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

```tsx:index.tsx
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

```tsx
import React, { Component } from "react";
import * as ReactDOM from "react-dom";
import { createStore } from "redux";
import { Provider } from "react-redux";
import {
  ModuleReducer,
  useModule,
  ReduxModule,
  mapModule,
  mapConnect
} from "@jswf/redux-module";

/**
 *Data structure definition (when using TypeScript)
 *
 * @export
 * @interface TestState
 */
export interface TestState {
  msg: string;
}
/**
 * Store access class
 * (Automatically allocate space in the store for each class)
 * @export
 * @class TestModule
 * @extends {ReduxModule<TestState>}
 */
export class TestModule extends ReduxModule<TestState> {
  //Initial value can be set here
  protected static defaultState: TestState = {
    msg: "初期値"
  };
  // It is not always necessary to create the following access methods
  // getState and setState are public so you can rewrite directly from the outside
  public getMessage() {
    return this.getState("msg")!;
  }
  public setMessage(msg: string) {
    this.setState({ msg });
  }
}

/**
 *Sample for Hooks
 *
 * @returns
 */
function HooksApp() {
  // Receive module instance
  // The limit of the useModule can be used is the same as other hooks
  const testModule = useModule(TestModule);
  // The same class can have different areas by attaching a prefix as shown below
  //const testModule = useModule(TestModule,"Prefix");
  return (
    <>
      <div>FunctionComponent</div>
      <input
        value={testModule.getMessage()}
        onChange={e => testModule.setMessage(e.target.value)}
      />
      <hr />
    </>
  );
}

/**
 *Sample for Class
 *
 * @class _ClassApp
 * @extends {Component}
 */
class _ClassApp extends Component {
  render() {
    // Receive module instance
    // Note that the name and argument are slightly different from Hooks
    const testModule = mapModule(this.props, TestModule);
    return (
      <>
        <div>ClassComponent</div>
        <input
          value={testModule.getMessage()}
          onChange={e => testModule.setMessage(e.target.value)}
        />
        <hr />
      </>
    );
  }
}
// When using class components, map as follows
// Only modules declared here can be used in classes
// Multiple modules can be specified in an array
const ClassApp = mapConnect(_ClassApp, TestModule);

// Associate a dedicated reducer with Redux
// Can be used with other reducers
const store = createStore(ModuleReducer);
ReactDOM.render(
  <Provider store={store}>
    <HooksApp />
    <ClassApp />
  </Provider>,
  document.getElementById("root") as HTMLElement
);

```

## ２．license

MIT
