import { useMemo, Component } from "react";
import { useDispatch, useSelector, connect } from "react-redux";
import { Dispatch } from "redux";

//対象オブジェクト選択用
type Head<U> = U extends [any, ...any[]]
  ? ((...args: U) => any) extends (head: infer H, ...args: any) => any
    ? H
    : never
  : never;
type Tail<U> = U extends [any, any, ...any[]]
  ? ((...args: U) => any) extends (head: any, ...args: infer T) => any
    ? T
    : never
  : never;
type Deeps<State, Paths extends any[]> = Head<Paths> extends keyof State
  ? {
      0: State[Head<Paths>];
      1: Deeps<State[Head<Paths>], Tail<Paths>>;
    }[Tail<Paths> extends never ? 0 : 1]
  : never;

//パラメータをオプション化
type AddOptionType<T> = {
  [M in keyof T]+?: T[M];
};
type map = { [key: string]: unknown };
type moduleType<T> = {
  new (
    dispatch: Dispatch,
    store: unknown,
    prefix: string,
    modules:
      | undefined
      | {
          [key: string]: ReduxModule;
        }
  ): T;
};

/**
 *Callback用アクション定義
 *
 * @interface Action
 */
interface Action {
  type: string;
  payload: {
    callback: (state: map) => map;
  };
}
//アクションタイプ名
const ActionName = "@CALLBACK";

/**
 *Storeデータ設定を行う
 *
 * @export
 * @template T
 * @param {(action: Action) => void} dispatch
 * @param {(string | string[])} name Storeのオブジェクト名(階層指定可能)
 * @param {AddOptionType<T>} params パラメータ
 */
export function setStoreState<T = map>(
  dispatch: (action: Action) => void,
  name: string | string[],
  params: AddOptionType<T>
) {
  function callback(state: map) {
    if (name instanceof Array) {
      const length = name.length;
      const newState = { ...state };
      let tempState = newState;
      let i;
      for (i = 0; i < length - 1; i++) {
        const n = name[i];
        if (typeof tempState[n] !== "object") {
          const obj = {};
          tempState[name[i]] = obj;
          tempState = obj;
        } else {
          tempState[n] = { ...tempState[n] };
          tempState = tempState[n] as map;
        }
      }
      if (typeof params === "object")
        tempState[name[i]] = { ...tempState[name[i]], ...params };
      else tempState[name[i]] = params;
      return newState;
    } else {
      const newState = { ...state };
      newState[name] = { ...newState[name], ...params };
      return newState;
    }
  }

  dispatch({
    type: ActionName,
    payload: {
      callback
    }
  });
}

/**
 *Reduxにモジュール機能を組み込む
 *
 * @export
 * @param {*} [state={}]
 * @param {Action} action
 * @returns
 */
export function ModuleReducer(state = {}, action: Action) {
  if (action.type === ActionName)
    return action.payload.callback(state as never);
  return state;
}

/**
 *ストアデータ操作用基本モジュールクラス
 *
 * @export
 * @class ReduxModule
 * @template State
 */
export class ReduxModule<State = { [key: string]: unknown }> {
  protected static defaultState?: unknown;
  public static includes?: (
    | typeof ReduxModule
    | { module: typeof ReduxModule; prefix: string })[];
  private dispatch: Dispatch;
  private store: unknown;
  private moduleName: string;
  private modules?: { [key: string]: ReduxModule };
  public constructor(
    dispatch: Dispatch,
    store: unknown,
    moduleName: string,
    modules: undefined | { [key: string]: ReduxModule }
  ) {
    this.dispatch = dispatch;
    this.moduleName = moduleName;
    this.modules = modules;
    if (store !== undefined) {
      this.store = store;
    } else {
      //初期値設定
      const defaultState = (this.constructor as Function & {
        defaultState: State;
      }).defaultState;
      if (defaultState) {
        const state = this.getState();
        if (state === undefined) this.setState(defaultState);
      }
    }
  }

  /**
   *includesに記述した外部参照モジュールを取得する
   *
   * @template T
   * @template C
   * @param {({
   *       new (
   *         dispatch: Dispatch,
   *         store: unknown,
   *         prefix: string,
   *         modules?: { [key: string]: ReduxModule }
   *       ): T;
   *     } & C)} module
   * @param {string} [prefix]
   * @returns
   * @memberof ReduxModule
   */
  getModule<T extends ReduxModule, C extends typeof ReduxModule>(
    module: {
      new (
        dispatch: Dispatch,
        store: unknown,
        prefix: string,
        modules?: { [key: string]: ReduxModule }
      ): T;
    } & C,
    prefix?: string
  ) {
    const moduleName: string = getStoreName(module, prefix);
    return this.modules![moduleName] as T;
  }
  /**
   *ReduxのDispachを取得
   *
   * @returns
   * @memberof ReduxModule
   */
  public getDispatch() {
    return this.dispatch;
  }

  /**
   *モジュールのStoreデータを返す
   *
   * @template T
   * @returns {(T | undefined)}
   * @memberof StoreModule
   */
  public getState<K extends string[], T = State>(): T | undefined;
  public getState<K extends string[], T = State>(
    ...name: K
  ): Deeps<T, K> | undefined;
  public getState<K extends string[], T = State>(
    ...name: K
  ): Deeps<T, K> | T | undefined {
    //パラメータ処理
    let names: string[] = [];
    if (name instanceof Array) names = name as never;
    let store: map = this.store as map;
    //初期値が無かった場合に仮設定
    if (store === undefined) {
      const defaultState = (this.constructor as Function & {
        defaultState: State;
      }).defaultState;
      if (defaultState) {
        store = defaultState as never;
      }
    }
    //対象のデータを検索
    const length = names.length;
    if (length === 0) return (store as never) as T;
    let i;
    for (i = 0; i < length - 1; i++) {
      if (store[names[i]] === undefined) return undefined;
      store = store[names[i]] as map;
    }
    return store[names[i]] as Deeps<T, K>;
  }

  // TypeScript3.6では対応できないため保留
  // public setState<K extends string[], T = State>(
  //   params: AddOptionType<Deeps<T, K>>,
  //   ...name: K
  // ): void;

  /**
   *モジュールのStoreデータの設定
   *
   * @template T
   * @param {(string | string[])} name
   * @param {AddOptionType<T>} params
   * @memberof StoreModule
   */
  public setState<T = State>(params: AddOptionType<T>): void;
  public setState<K extends string[], T = unknown>(
    params: unknown,
    ...name: K
  ): void;
  public setState<K extends string[], T = State>(
    params: AddOptionType<Deeps<T, K>>,
    ...name: K
  ): void {
    const storeName = this.moduleName;
    const names = [storeName];
    if (typeof name === "string") names.push(name);
    else if (name instanceof Array) names.push(...name);
    setStoreState(this.dispatch, names, params as never);
  }
}
//クラス識別用マップ
const modules = new Map<Function, number>();
/**
 *ストアに登録するモジュール名を生成する
 *
 * @export
 * @template T
 * @param {{
 *     new (dispatch: Dispatch, store: unknown, prefix: string): T;
 *   }} module
 * @param {string} [prefix]
 * @returns {string}
 */
export function getStoreName<T extends ReduxModule>(
  module: moduleType<T>,
  prefix?: string
): string {
  let count = modules.get(module);
  if (count === undefined) {
    count = modules.size;
    modules.set(module, count);
  }
  return "@Module-" + (prefix || "") + "-" + count;
}

/**
 *Redux操作用モジュールの取得(Hooks用)
 *
 * @export
 * @template T
 * @param  module StoreModule継承クラス
 * @param {string} [prefix] Storeデータ分離用装飾文字列
 * @returns {T}
 */
export function useModule<T extends ReduxModule, C extends typeof ReduxModule>(
  module: {
    new (
      dispatch: Dispatch,
      store: unknown,
      prefix: string,
      modules: undefined | { [key: string]: ReduxModule }
    ): T;
  } & C,
  prefix?: string
): T {
  const includes = module.includes;
  let modules: { [key: string]: ReduxModule } = {};
  if (includes) {
    includes.forEach(inc => {
      if (inc instanceof Function) modules[getStoreName(inc)] = useModule(inc);
      else
        modules[getStoreName(inc.module, inc.prefix)] = useModule(
          inc.module,
          inc.prefix
        );
    });
  }

  const moduleName = getStoreName(module, prefix);
  const store = useSelector(store => (store as map)[moduleName]) as
    | map
    | undefined;
  const dispatch = useDispatch();
  return useMemo(() => {
    return new module(dispatch, store, moduleName, modules);
  }, [store, ...Object.values(modules)]);
}
/**
 * モジュールを取得(Classコンポーネント用)
 *
 * @export
 * @template T
 * @param {unknown} props
 * @param {moduleType<T>} module
 * @param {string} [prefix]
 * @returns
 */
export function mapModule<T extends ReduxModule>(
  props: unknown,
  module: moduleType<T>,
  prefix?: string,
  modules?: {
    [key: string]: ReduxModule;
  }
) {
  const moduleName = getStoreName(module, prefix);
  return (props as { modules: map }).modules[moduleName] as T;
}

/**
 *Classコンポーネントから機能を利用するときに使用する
 *
 * @export
 * @template T
 * @template C
 * @param {C} component
 * @param {(moduleType<T>
 *     | { module: moduleType<T>; prefix?: string }
 *     | (moduleType<T> | { module: moduleType<T>; prefix?: string })[])} module
 * @returns
 */
export function mapConnect<T extends ReduxModule, C extends typeof Component>(
  component: C,
  module:
    | moduleType<T>
    | { module: moduleType<T>; prefix?: string }
    | (moduleType<T> | { module: moduleType<T>; prefix?: string })[]
) {
  const modules = module instanceof Array ? module : [module];

  function mapStateToProps(state: map) {
    const newState: map = {};

    function addStoreState(
      src:
        | typeof ReduxModule
        | {
            module: typeof ReduxModule;
            prefix?: string | undefined;
          }
    ) {
      let module: typeof ReduxModule;
      let prefix: string | undefined;
      if (src instanceof Function) {
        module = src;
      } else {
        module = src.module;
        prefix = src.prefix;
      }
      const moduleName = getStoreName(module, prefix);
      newState[moduleName] = state[moduleName];
      if (module.includes) {
        module.includes.forEach(src => addStoreState(src));
      }
    }

    modules.forEach(src => {
      addStoreState(src);
    });
    return newState;
  }

  function mapMargeToProps(
    store: map,
    { dispatch }: { dispatch: Dispatch },
    props: unknown
  ) {
    function addStreModule(
      state: map,
      src:
        | typeof ReduxModule
        | {
            module: typeof ReduxModule;
            prefix?: string | undefined;
          }
    ) {
      let module, prefix;
      if (src instanceof Function) {
        module = src;
      } else {
        module = src.module;
        prefix = src.prefix;
      }
      const modules = {};
      if (module.includes) {
        module.includes.forEach(src => {
          addStreModule(modules, src);
        });
      }
      const moduleName = getStoreName(module, prefix);
      const inst = new module(dispatch, store[moduleName], moduleName, modules);
      (state as map)[moduleName] = inst;
      return inst;
    }
    const state = {};
    modules.forEach(src => addStreModule(state, src));
    return { ...store, ...{ modules: state }, ...props };
  }
  return connect(
    mapStateToProps,
    (dispatch: Dispatch) => ({ dispatch }),
    mapMargeToProps
  )(component);
}
