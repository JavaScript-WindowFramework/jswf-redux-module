import { Dispatch } from "redux";
declare type AddOptionType<T> = {
    [M in keyof T]+?: T[M];
};
declare type map = {
    [key: string]: unknown;
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
/**
 *Storeデータ設定用
 *
 * @export
 * @template T
 * @param {(action: Action) => void} dispatch
 * @param {(string | string[])} name Storeのオブジェクト名(階層指定可能)
 * @param {AddOptionType<T>} params パラメータ
 */
export declare function setStoreState<T = map>(dispatch: (action: Action) => void, name: string | string[], params: AddOptionType<T>): void;
/**
 *Reduxにモジュール機能を組み込む
 *
 * @export
 * @param {*} [state={}]
 * @param {Action} action
 * @returns
 */
export declare function ModuleReducer(state: {} | undefined, action: Action): map;
/**
 *ストアデータ操作用基本モジュールクラス
 *
 * @export
 * @class ReduxModule
 * @template State
 */
export declare class ReduxModule<State = {
    [key: string]: unknown;
}> {
    protected static defaultState?: unknown;
    private dispatch;
    private store;
    private moduleName;
    constructor(dispatch: Dispatch<any>, store: unknown, moduleName: string);
    getDispatch(): Dispatch<any>;
    /**
     *モジュールのStoreデータを返す
     *
     * @template T
     * @returns {(T | undefined)}
     * @memberof StoreModule
     */
    getState<T = State>(): T | undefined;
    /**
     *モジュールのStoreデータの設定
     *
     * @template T
     * @param {(string | string[])} name
     * @param {AddOptionType<T>} params
     * @memberof StoreModule
     */
    setState<T = State>(name: string | string[], params: AddOptionType<T>): void;
    setState<T = {
        [key: string]: unknown;
    }>(params: AddOptionType<T>): void;
    private _setState;
}
/**
 *Redux操作用モジュールの生成
 *
 * @export
 * @template T
 * @param  module StoreModule継承クラス
 * @param {string} [prefix] Storeデータ分離用装飾文字列
 * @returns {T}
 */
export declare function useModule<T extends ReduxModule>(module: {
    new (dispatch: Dispatch<any>, store: unknown, prefix: string): T;
}, prefix?: string): T;
export {};
