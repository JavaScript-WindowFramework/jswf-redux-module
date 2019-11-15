import { useMemo, Component } from "react";
import { useDispatch, useSelector, connect } from "react-redux";
import { AnyAction, Dispatch } from "redux";

//対象オブジェクト選択用
type Next<U> = U extends readonly [string, ...string[]]
  ? ((...args: U) => void) extends (top: any, ...args: infer T) => void
    ? T
    : never
  : never;

type Deeps<
  State,
  Paths extends readonly string[]
> = Paths[0] extends keyof State
  ? {
      0: State[Paths[0]];
      1: Deeps<State[Paths[0]], Next<Paths>>;
    }[Paths[1] extends undefined ? 0 : 1]
  : never;

type map = { [key: string]: unknown | object };
type moduleType<T> = {
  new (
    dispatch: Dispatch,
    store: unknown,
    prefix: string,
    modules:
      | undefined
      | {
          [key: string]: ReduxModule;
        },
    writeOnly: boolean
  ): T;
};

/**
 *Callback用アクション定義
 *
 * @interface Action
 */
interface Action extends AnyAction {
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
 * @param {Partial<T>} params パラメータ
 */
export function setStoreState<T = map>(
  dispatch: (action: Action) => void,
  name: string | string[],
  params: Partial<T>,
  defaultTop?: unknown
) {
  function callback(state: map) {
    const names = name instanceof Array ? name : [name];

    const length = names.length;
    const newState = { ...state };
    if (defaultTop !== undefined && newState[names[0]] === undefined)
      newState[names[0]] = defaultTop;

    let tempState = newState;
    let i;
    for (i = 0; i < length - 1; i++) {
      const n = names[i];
      const state = tempState[n];
      if (typeof state !== "object") {
        const obj = {};
        tempState[names[i]] = obj;
        tempState = obj;
      } else if (state instanceof Array) {
        tempState[n] = [...state];
        tempState = tempState[n] as map;
      } else {
        tempState[n] = { ...state };
        tempState = tempState[n] as map;
      }
    }
    if (
      typeof params === "object" &&
      !(params instanceof Array) &&
      typeof tempState[names[i]] === "object"
    )
      tempState[names[i]] = { ...(tempState[names[i]] as object), ...params };
    else tempState[names[i]] = params;
    return newState;
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
export function ModuleReducer(state = {}, action: AnyAction) {
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
    | { module: typeof ReduxModule; prefix?: string; writeOnly?: boolean }
  )[];
  private dispatch: Dispatch;
  private store: unknown;
  private moduleName: string;
  private modules?: { [key: string]: ReduxModule };
  private writeOnly: boolean;

  public constructor(
    dispatch: Dispatch,
    store: unknown,
    moduleName: string,
    modules: undefined | { [key: string]: ReduxModule },
    writeOnly: boolean
  ) {
    this.dispatch = dispatch;
    this.moduleName = moduleName;
    this.modules = modules;
    this.writeOnly = writeOnly;
    if (!this.writeOnly) {
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
    module: moduleType<T> & C,
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
    if (this.writeOnly) throw "This module is write only";

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

  /**
   *モジュールのStoreデータの設定
   *
   * @template T
   * @param {(string | string[])} name
   * @param {Partial<T>} params
   * @memberof StoreModule
   */
  public setState<T = State>(params: Partial<T>): void;
  public setState<K extends string[], T = State>(
    params: Partial<Deeps<T, K>>,
    ...name: K
  ): void;
  public setState<K extends string[], T = State>(
    params: Partial<Deeps<T, K>>,
    ...name: K
  ): void {
    const storeName = this.moduleName;
    const names = [storeName];
    if (typeof name === "string") names.push(name);
    else if (name instanceof Array) names.push(...name);

    const defaultState = (this.constructor as Function & {
      defaultState: State;
    }).defaultState;
    setStoreState(this.dispatch, names, params as never, defaultState);
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
  module: moduleType<T> & C,
  prefix?: string,
  writeOnly?: boolean
): T {
  const includes = module.includes;
  let modules: { [key: string]: ReduxModule } = {};
  if (includes) {
    includes.forEach(inc => {
      if (inc instanceof Function) modules[getStoreName(inc)] = useModule(inc);
      else
        modules[getStoreName(inc.module, inc.prefix)] = useModule(
          inc.module,
          inc.prefix,
          inc.writeOnly
        );
    });
  }

  const moduleName = getStoreName(module, prefix);
  const store = writeOnly
    ? undefined
    : (useSelector(store => (store as map)[moduleName]) as map | undefined);
  const dispatch = useDispatch();
  return new module(dispatch, store, moduleName, modules, !!writeOnly);
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
  prefix?: string
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
    | { module: moduleType<T>; prefix?: string; writeOnly?: boolean }
    | (
        | moduleType<any>
        | { module: moduleType<any>; prefix?: string; writeOnly?: boolean }
      )[]
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
            writeOnly?: boolean;
          }
    ) {
      let module: typeof ReduxModule;
      let prefix: string | undefined;
      let writeOnly: boolean = false;
      if (src instanceof Function) {
        module = src;
      } else {
        module = src.module;
        prefix = src.prefix;
        writeOnly = !!src.writeOnly;
      }
      const moduleName = getStoreName(module, prefix);
      //Store読み込みの判断
      if (!writeOnly) newState[moduleName] = state[moduleName];
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
    props: object
  ) {
    function addStreModule(
      state: map,
      src:
        | typeof ReduxModule
        | {
            module: typeof ReduxModule;
            prefix?: string | undefined;
            writeOnly?: boolean;
          }
    ) {
      let module, prefix;
      let writeOnly: boolean = false;
      if (src instanceof Function) {
        module = src;
      } else {
        module = src.module;
        prefix = src.prefix;
        writeOnly = !!src.writeOnly;
      }
      const modules = {};
      if (module.includes) {
        module.includes.forEach(src => {
          addStreModule(modules, src);
        });
      }
      const moduleName = getStoreName(module, prefix);
      const inst = new module(
        dispatch,
        store[moduleName],
        moduleName,
        modules,
        writeOnly
      );
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
