"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adaptiveweb_1 = require("adaptiveweb");
const WebExtStorageService_1 = require("./WebExtStorageService");
const WebExtXHRService_1 = require("./WebExtXHRService");
/**
 * WebExtentions wrapper for AdaptiveWeb
 */
class WebExtWrapper extends adaptiveweb_1.Wrapper {
    constructor() {
        super(...arguments);
        // Name - Used for tracking and reporting
        this.name = 'WebExtensions';
        // Services
        this.storage = new WebExtStorageService_1.WebExtStorageService;
        this.xhr = new WebExtXHRService_1.WebExtXHRService;
    }
}
exports.WebExtWrapper = WebExtWrapper;
//# sourceMappingURL=WebExtWrapper.js.map