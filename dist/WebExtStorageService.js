"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adaptiveweb_1 = require("adaptiveweb");
/**
 * WebExtensions implementation of the StorageService.
 */
class WebExtStorageService {
    constructor() {
        this.browser = chrome || browser;
    }
    /**
     * Sets a key in the store to a given value.
     * @param key the key to set in the store
     * @param value the value to set the given entry to
     * @param type the type of storage, defaults to StorageType.SYNC
     */
    set(key, value, type = adaptiveweb_1.StorageType.SYNC) {
        if (type == adaptiveweb_1.StorageType.SYNC) {
            return this.browser.storage.sync.set({ [key]: value });
        }
        else {
            return this.browser.storage.local.set({ [key]: value });
        }
    }
    /**
     * Fetches the value stored at the given key
     * @param key the key to retrieve
     */
    get(key, type = adaptiveweb_1.StorageType.SYNC) {
        if (type == adaptiveweb_1.StorageType.SYNC) {
            return this.browser.storage.sync.get(key);
        }
        else {
            return this.browser.storage.local.get(key);
        }
    }
}
exports.WebExtStorageService = WebExtStorageService;
//# sourceMappingURL=WebExtStorageService.js.map