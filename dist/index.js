"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_redux_1 = require("react-redux");
var react_1 = require("react");
//アクションタイプ名
var ActionName = "@CALLBACK";
/**
 *Storeデータ設定用
 *
 * @export
 * @template T
 * @param {(action: Action) => void} dispatch
 * @param {(string | string[])} name Storeのオブジェクト名(階層指定可能)
 * @param {AddOptionType<T>} params パラメータ
 */
function setStoreState(dispatch, name, params) {
    function callback(state) {
        if (name instanceof Array) {
            var length_1 = name.length;
            var newState = __assign({}, state);
            var tempState = newState;
            var i = void 0;
            for (i = 0; i < length_1 - 1; i++) {
                var n = name[i];
                if (typeof tempState[n] !== "object") {
                    var obj = {};
                    tempState[name[i]] = obj;
                    tempState = obj;
                }
                else
                    tempState = tempState[n];
            }
            tempState[name[i]] = __assign(__assign({}, tempState[name[i]]), params);
            return newState;
        }
        else {
            var newState = __assign({}, state);
            newState[name] = __assign(__assign({}, newState[name]), params);
            return newState;
        }
    }
    dispatch({
        type: ActionName,
        payload: {
            callback: callback
        }
    });
}
exports.setStoreState = setStoreState;
/**
 *Reduxにモジュール機能を組み込む
 *
 * @export
 * @param {*} [state={}]
 * @param {Action} action
 * @returns
 */
function ModuleReducer(state, action) {
    if (state === void 0) { state = {}; }
    if (action.type === ActionName)
        return action.payload.callback(state);
    return state;
}
exports.ModuleReducer = ModuleReducer;
/**
 *ストアデータ操作用基本モジュールクラス
 *
 * @export
 * @class ReduxModule
 * @template State
 */
var ReduxModule = /** @class */ (function () {
    function ReduxModule(dispatch, store, moduleName) {
        this.dispatch = dispatch;
        this.moduleName = moduleName;
        if (store !== undefined) {
            this.store = store;
        }
        else {
            //初期値設定
            var defaultState = this.constructor.defaultState;
            if (defaultState) {
                var state = this.getState();
                if (state === undefined)
                    this.setState(defaultState);
            }
        }
    }
    ReduxModule.prototype.getDispatch = function () {
        return this.dispatch;
    };
    ReduxModule.prototype.getState = function (name) {
        //パラメータ処理
        var names = [];
        if (typeof name === "string")
            names.push(name);
        else if (name instanceof Array)
            names.push.apply(names, name);
        var store = this.store;
        //初期値が無かった場合に仮設定
        if (store === undefined) {
            var defaultState = this.constructor.defaultState;
            if (defaultState) {
                store = defaultState;
            }
        }
        if (name === undefined)
            return store;
        //対象のデータを検索
        var length = names.length;
        var i;
        for (i = 0; i < length - 1; i++) {
            if (store[names[i]] === undefined)
                return undefined;
            store = store[names[i]];
        }
        return store[names[i]];
    };
    ReduxModule.prototype.setState = function (a, b) {
        if (b === undefined) {
            this._setState([], a);
        }
        else {
            this._setState(a, b);
        }
    };
    ReduxModule.prototype._setState = function (name, params) {
        var storeName = this.moduleName;
        var names = [storeName];
        if (typeof name === "string")
            names.push(name);
        else if (name instanceof Array)
            names.push.apply(names, name);
        setStoreState(this.dispatch, names, params);
    };
    return ReduxModule;
}());
exports.ReduxModule = ReduxModule;
//クラス識別用マップ
var modules = new Map();
/**
 *Redux操作用モジュールの生成
 *
 * @export
 * @template T
 * @param  module StoreModule継承クラス
 * @param {string} [prefix] Storeデータ分離用装飾文字列
 * @returns {T}
 */
function useModule(module, prefix) {
    var count = modules.get(module);
    if (count === undefined) {
        count = modules.size;
        modules.set(module, count);
    }
    var moduleName = "@Module-" + (prefix || "") + "-" + count;
    var dispatch = react_redux_1.useDispatch();
    var store = react_redux_1.useSelector(function (store) { return store[moduleName]; });
    return react_1.useMemo(function () {
        return new module(dispatch, store, moduleName);
    }, [store]);
}
exports.useModule = useModule;
//# sourceMappingURL=index.js.map