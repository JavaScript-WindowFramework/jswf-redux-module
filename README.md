# @jswf/redux-module

Make Redux operations modular

## １．Usage

```ts:
import React  from "react";
import * as ReactDOM from "react-dom";
import { createStore } from "redux";
import { Provider } from "react-redux";
import { ModuleReducer, useModule, ReduxModule } from "@jswf/redux-module";
export interface State {
  msg: string;
  count: number;
}
export class TestModule extends ReduxModule<State> {
  static defaultState: State = {
    msg: "init",
    count: 0
  };
}
export function AppComponent() {
  const module = useModule(TestModule);
  const value = module.getState()!;
  return (
    <div>
      <div>AppComponent</div>
      <button
        onClick={() => {
          module.setState({ msg: "click!", count: value.count + 1 });
        }}>
        button
      </button>
      <div>{value.msg}</div>
      <div>{value.count}</div>
    </div>
  );
}

const store = createStore(ModuleReducer);
function App() {
  return (
    <Provider store={store}>
      <AppComponent />
    </Provider>
  );
}
ReactDOM.render(<App />, document.getElementById("root") as HTMLElement);

```

## ２．license

MIT
