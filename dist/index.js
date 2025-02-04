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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
var cssesc = require("cssesc");
var Limit;
(function (Limit) {
    Limit[Limit["All"] = 0] = "All";
    Limit[Limit["Two"] = 1] = "Two";
    Limit[Limit["One"] = 2] = "One";
})(Limit || (Limit = {}));
var config;
var rootDocument;
var fnNameToPriorityName = {
    'id': id,
    'attr': attr,
    'className': classNames,
    'tagName': tagName,
    'any': any,
};
function default_1(input, options) {
    if (input.nodeType !== Node.ELEMENT_NODE) {
        throw new Error("Can't generate CSS selector for non-element node type.");
    }
    if ('html' === input.tagName.toLowerCase()) {
        return 'html';
    }
    var defaults = {
        root: document.body,
        idName: function (name, input, index) { return true; },
        className: function (name, input, index) { return true; },
        tagName: function (name, input, index) { return true; },
        attr: function (name, value, input, index) { return false; },
        seedMinLength: 1,
        optimizedMinLength: 2,
        threshold: 1000,
        priorityList: ['id', 'attr', 'className', 'tagName'],
        penalties: {
            id: 0,
            attr: 0.5,
            className: 1,
            tagName: 2,
            any: 3
        }
    };
    config = __assign({}, defaults, options);
    rootDocument = findRootDocument(config.root, defaults);
    var path = bottomUpSearch(input, Limit.All, function () {
        return bottomUpSearch(input, Limit.Two, function () {
            return bottomUpSearch(input, Limit.One);
        });
    });
    if (path) {
        var optimized = sort(optimize(path, input));
        if (optimized.length > 0) {
            path = optimized[0];
        }
        return selector(path);
    }
    else {
        throw new Error("Selector was not found.");
    }
}
exports.default = default_1;
function findRootDocument(rootNode, defaults) {
    if (rootNode.nodeType === Node.DOCUMENT_NODE) {
        return rootNode;
    }
    if (rootNode === defaults.root) {
        return rootNode.ownerDocument;
    }
    return rootNode;
}
function getNodeLevel(input, index) {
    var fnName;
    var result;
    var filteredResult;
    for (var i = 0; i < config.priorityList.length; i++) {
        fnName = config.priorityList[i];
        result = fnNameToPriorityName[fnName](input, index);
        filteredResult = fnName === 'id' || fnName === 'tagName' ? maybe(result) : maybe.apply(void 0, result);
        if (filteredResult) {
            return filteredResult;
        }
    }
    return [any()];
}
function bottomUpSearch(input, limit, fallback) {
    var path = null;
    var stack = [];
    var current = input;
    var i = 0;
    var _loop_1 = function () {
        var level = getNodeLevel(current, i);
        var nth = index(current);
        if (limit === Limit.All) {
            if (nth) {
                level = level.concat(level.filter(dispensableNth).map(function (node) { return nthChild(node, nth); }));
            }
        }
        else if (limit === Limit.Two) {
            level = level.slice(0, 1);
            if (nth) {
                level = level.concat(level.filter(dispensableNth).map(function (node) { return nthChild(node, nth); }));
            }
        }
        else if (limit === Limit.One) {
            var node = (level = level.slice(0, 1))[0];
            if (nth && dispensableNth(node)) {
                level = [nthChild(node, nth)];
            }
        }
        for (var _i = 0, level_1 = level; _i < level_1.length; _i++) {
            var node = level_1[_i];
            node.level = i;
        }
        stack.push(level);
        if (stack.length >= config.seedMinLength) {
            path = findUniquePath(stack, fallback);
            if (path) {
                return "break";
            }
        }
        current = current.parentElement;
        i++;
    };
    while (current && current !== config.root.parentElement) {
        var state_1 = _loop_1();
        if (state_1 === "break")
            break;
    }
    if (!path) {
        path = findUniquePath(stack, fallback);
    }
    return path;
}
function findUniquePath(stack, fallback) {
    var paths = sort(combinations(stack));
    if (paths.length > config.threshold) {
        return fallback ? fallback() : null;
    }
    for (var _i = 0, paths_1 = paths; _i < paths_1.length; _i++) {
        var candidate = paths_1[_i];
        if (unique(candidate)) {
            return candidate;
        }
    }
    return null;
}
function selector(path) {
    var node = path[0];
    var query = node.name;
    for (var i = 1; i < path.length; i++) {
        var level = path[i].level || 0;
        if (node.level === level - 1) {
            query = path[i].name + " > " + query;
        }
        else {
            query = path[i].name + " " + query;
        }
        node = path[i];
    }
    return query;
}
function penalty(path) {
    return path.map(function (node) { return node.penalty; }).reduce(function (acc, i) { return acc + i; }, 0);
}
function unique(path) {
    switch (rootDocument.querySelectorAll(selector(path)).length) {
        case 0:
            throw new Error("Can't select any node with this selector: " + selector(path));
        case 1:
            return true;
        default:
            return false;
    }
}
function id(input, index) {
    var elementId = input.getAttribute('id');
    if (elementId && config.idName(elementId, input, index)) {
        return {
            name: '#' + cssesc(elementId, { isIdentifier: true }),
            penalty: config.penalties.id
        };
    }
    return null;
}
function attr(input, index) {
    var attrs = Array.from(input.attributes).filter(function (attr) { return config.attr(attr.name, attr.value, input, index); });
    return attrs.map(function (attr) { return ({
        name: '[' + cssesc(attr.name, { isIdentifier: true }) + '="' + cssesc(attr.value) + '"]',
        penalty: config.penalties.attr
    }); });
}
function classNames(input, index) {
    var names = Array.from(input.classList)
        .filter(function (name) { return config.className(name, input, index); });
    return names.map(function (name) { return ({
        name: '.' + cssesc(name, { isIdentifier: true }),
        penalty: config.penalties.className
    }); });
}
function tagName(input, index) {
    var name = input.tagName.toLowerCase();
    if (config.tagName(name, input, index)) {
        return {
            name: name,
            penalty: config.penalties.tagName
        };
    }
    return null;
}
function any() {
    return {
        name: '*',
        penalty: config.penalties.any
    };
}
function index(input) {
    var parent = input.parentNode;
    if (!parent) {
        return null;
    }
    var child = parent.firstChild;
    if (!child) {
        return null;
    }
    var i = 0;
    while (child) {
        if (child.nodeType === Node.ELEMENT_NODE) {
            i++;
        }
        if (child === input) {
            break;
        }
        child = child.nextSibling;
    }
    return i;
}
function nthChild(node, i) {
    return {
        name: node.name + (":nth-child(" + i + ")"),
        penalty: node.penalty + 1
    };
}
function dispensableNth(node) {
    return node.name !== 'html' && !node.name.startsWith('#');
}
function maybe() {
    var level = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        level[_i] = arguments[_i];
    }
    var list = level.filter(notEmpty);
    if (list.length > 0) {
        return list;
    }
    return null;
}
function notEmpty(value) {
    return value !== null && value !== undefined;
}
function combinations(stack, path) {
    var _i, _a, node;
    if (path === void 0) { path = []; }
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!(stack.length > 0)) return [3 /*break*/, 5];
                _i = 0, _a = stack[0];
                _b.label = 1;
            case 1:
                if (!(_i < _a.length)) return [3 /*break*/, 4];
                node = _a[_i];
                return [5 /*yield**/, __values(combinations(stack.slice(1, stack.length), path.concat(node)))];
            case 2:
                _b.sent();
                _b.label = 3;
            case 3:
                _i++;
                return [3 /*break*/, 1];
            case 4: return [3 /*break*/, 7];
            case 5: return [4 /*yield*/, path];
            case 6:
                _b.sent();
                _b.label = 7;
            case 7: return [2 /*return*/];
        }
    });
}
function sort(paths) {
    return Array.from(paths).sort(function (a, b) { return penalty(a) - penalty(b); });
}
function optimize(path, input) {
    var i, newPath;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(path.length > 2 && path.length > config.optimizedMinLength)) return [3 /*break*/, 5];
                i = 1;
                _a.label = 1;
            case 1:
                if (!(i < path.length - 1)) return [3 /*break*/, 5];
                newPath = path.slice();
                newPath.splice(i, 1);
                if (!(unique(newPath) && same(newPath, input))) return [3 /*break*/, 4];
                return [4 /*yield*/, newPath];
            case 2:
                _a.sent();
                return [5 /*yield**/, __values(optimize(newPath, input))];
            case 3:
                _a.sent();
                _a.label = 4;
            case 4:
                i++;
                return [3 /*break*/, 1];
            case 5: return [2 /*return*/];
        }
    });
}
function same(path, input) {
    return rootDocument.querySelector(selector(path)) === input;
}
//# sourceMappingURL=index.js.map