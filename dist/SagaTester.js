'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.resetAction = undefined;

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _extends3 = require('babel-runtime/helpers/extends');

var _extends4 = _interopRequireDefault(_extends3);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _reduxSaga = require('redux-saga');

var _reduxSaga2 = _interopRequireDefault(_reduxSaga);

var _redux = require('redux');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var RESET_TESTER_ACTION_TYPE = '@@RESET_TESTER';
var makeResettable = function makeResettable(reducer, initialStateSlice) {
    return function (state, action) {
        switch (action.type) {
            case RESET_TESTER_ACTION_TYPE:
                return reducer(initialStateSlice, action);
            default:
                return reducer(state, action);
        }
    };
};
var resetAction = exports.resetAction = { type: RESET_TESTER_ACTION_TYPE };

var SagaIntegrationTester = function () {
    function SagaIntegrationTester(_ref) {
        var _this = this;

        var _ref$initialState = _ref.initialState,
            initialState = _ref$initialState === undefined ? {} : _ref$initialState,
            reducers = _ref.reducers,
            _ref$middlewares = _ref.middlewares,
            middlewares = _ref$middlewares === undefined ? [] : _ref$middlewares,
            _ref$combineReducers = _ref.combineReducers,
            combineReducers = _ref$combineReducers === undefined ? _redux.combineReducers : _ref$combineReducers;
        (0, _classCallCheck3.default)(this, SagaIntegrationTester);

        this.actionsCalled = [];
        this.actionLookups = {};
        this.sagaMiddleware = (0, _reduxSaga2.default)();

        // Wrap reducers so they can be reset, or supply identity reducer as default
        var finalReducer = reducers ? combineReducers((0, _keys2.default)(reducers).reduce(function (rc, reducerName) {
            return (0, _extends4.default)({}, rc, (0, _defineProperty3.default)({}, reducerName, makeResettable(reducers[reducerName], initialState[reducerName])));
        }, {})) : function (state) {
            return state;
        };

        // Middleware to store the actions and create promises
        var testerMiddleware = function testerMiddleware(store) {
            return function (next) {
                return function (action) {
                    // Don't monitor redux actions
                    if (!action.type.startsWith('@@redux')) {
                        _this.actionsCalled.push(action);
                        var actionObj = _this._addAction(action.type);
                        actionObj.count++;
                        actionObj.callback(action);
                    }
                    return next(action);
                };
            };
        };

        var allMiddlewares = [].concat((0, _toConsumableArray3.default)(middlewares), [testerMiddleware, this.sagaMiddleware]);
        this.store = (0, _redux.createStore)(finalReducer, initialState, _redux.applyMiddleware.apply(undefined, (0, _toConsumableArray3.default)(allMiddlewares)));
    }

    (0, _createClass3.default)(SagaIntegrationTester, [{
        key: '_addAction',
        value: function _addAction(actionType) {
            var futureOnly = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

            var action = this.actionLookups[actionType];
            if (!action || futureOnly) {
                action = { count: 0 };
                action.promise = new _promise2.default(function (resolve, reject) {
                    return action.callback = resolve;
                });
                this.actionLookups[actionType] = action;
            }
            return action;
        }
    }, {
        key: 'start',
        value: function start() {
            var sagas = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

            this.sagaMiddleware.run(sagas);
        }
    }, {
        key: 'reset',
        value: function reset() {
            var _this2 = this;

            var clearActionList = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

            this.store.dispatch(resetAction);
            if (clearActionList) {
                // Clear existing array in case there are other references to it
                this.actionsCalled.length = 0;
                // Delete object keys in case there are other references to it
                (0, _keys2.default)(this.actionLookups).forEach(function (key) {
                    return delete _this2.actionLookups[key];
                });
            }
        }
    }, {
        key: 'dispatch',
        value: function dispatch(action) {
            this.store.dispatch(action);
        }
    }, {
        key: 'getState',
        value: function getState() {
            return this.store.getState();
        }
    }, {
        key: 'getActionsCalled',
        value: function getActionsCalled() {
            return this.actionsCalled;
        }
    }, {
        key: 'wasCalled',
        value: function wasCalled(actionType) {
            return !!this.actionLookups[actionType];
        }
    }, {
        key: 'numCalled',
        value: function numCalled(actionType) {
            var action = this.actionLookups[actionType];
            return action && action.count || 0;
        }
    }, {
        key: 'waitFor',
        value: function waitFor(actionType) {
            var futureOnly = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

            return this._addAction(actionType, futureOnly).promise;
        }
    }]);
    return SagaIntegrationTester;
}();

exports.default = SagaIntegrationTester;