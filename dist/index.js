"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.name = exports.version = void 0;
exports.version = require("../package.json").version;
exports.name = require("../package.json").name;
__exportStar(require("./src/entity/Player"), exports);
__exportStar(require("./src/core/Manager"), exports);
__exportStar(require("./src/typings/Interfaces"), exports);
__exportStar(require("./src/entity/Node"), exports);
__exportStar(require("./src/entity/Rest"), exports);
__exportStar(require("./src/Utils"), exports);
__exportStar(require("./src/entity/Queue"), exports);
__exportStar(require("./src/structure/SearchResult"), exports);
__exportStar(require("./src/typings/Enums"), exports);
__exportStar(require("./src/entity/Track"), exports);
