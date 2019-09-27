import { useDispatch, useSelector } from "react-redux";
import { Dispatch } from "redux";
import { useMemo } from "react";

//パラメータをオプション化
type AddOptionType<T> = {
  [M in keyof T]+?: T[M];
};
type map = { [key: string]: unknown };

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
 *Storeデータ設定用
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
        } else tempState = tempState[n] as map;
      }
      tempState[name[i]] = { ...tempState[name[i]], ...params };
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
  private dispatch: Dispatch<any>;
  private store: unknown;
  private moduleName: string;
  public constructor(dispatch: Dispatch<any>, store: unknown, moduleName: string) {
    this.dispatch = dispatch;
    this.moduleName = moduleName;
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
  public getState<T = State>(): T | undefined;
  public getState<T = unknown>(name?: string | string[]): T | undefined {
    //パラメータ処理
    let names = [];
    if (typeof name === "string") names.push(name);
    else if (name instanceof Array) names.push(...name);
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
    if (name === undefined) return (store as never) as T;
    //対象のデータを検索
    const length = names.length;
    let i;
    for (i = 0; i < length - 1; i++) {
      if (store[names[i]] === undefined) return undefined;
      store = store[names[i]] as map;
    }
    return store[names[i]] as T;
  }

  /**
   *モジュールのStoreデータの設定
   *
   * @template T
   * @param {(string | string[])} name
   * @param {AddOptionType<T>} params
   * @memberof StoreModule
   */
  public setState<T = State>(
    name: string | string[],
    params: AddOptionType<T>
  ): void;
  public setState<T = { [key: string]: unknown }>(
    params: AddOptionType<T>
  ): void;
  public setState<T = { [key: string]: unknown }>(
    a: unknown,
    b?: unknown
  ): void {
    if (b === undefined) {
      this._setState<T>([], a as never);
    } else {
      this._setState<T>(a as never, b as never);
    }
  }
  private _setState<T = { [key: string]: unknown }>(
    name: string | string[],
    params: AddOptionType<T>
  ) {
    const storeName = this.moduleName;
    const names = [storeName];
    if (typeof name === "string") names.push(name);
    else if (name instanceof Array) names.push(...name);
    setStoreState(this.dispatch, names, params);
  }
}

//クラス識別用マップ
const modules = new Map<Function,number>();
/**
 *Redux操作用モジュールの生成
 *
 * @export
 * @template T
 * @param  module StoreModule継承クラス
 * @param {string} [prefix] Storeデータ分離用装飾文字列
 * @returns {T}
 */
export function useModule<T extends ReduxModule>(
  module: {
    new (dispatch: Dispatch<any>, store: unknown, prefix: string): T;
  },
  prefix?: string
): T {
  let count = modules.get(module);
  if(count === undefined){
    count = modules.size;
    modules.set(module,count);
  }
  const moduleName = "@Module-"+(prefix || "")+"-"+count;
  const dispatch = useDispatch();
  const store = useSelector(
    store => (store as map)[moduleName]
  ) as map | undefined;
  return useMemo(() => {
    return new module(dispatch, store, moduleName);
  }, [store]);
}
