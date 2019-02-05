"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adaptiveweb_1 = require("adaptiveweb");
const util_1 = require("./util");
require("adaptiveweb/dist/reporting");
(function () {
    /**
     * Routes AdapterContext calls through the background script
     */
    class ProxyAdapterContext {
        constructor(adapter) {
            this.adapter = adapter;
        }
        request(url, options) {
            return util_1.sendMessage('request', { uuid: this.adapter.uuid, args: [url, options] });
        }
        getPreferences() {
            return util_1.sendMessage('getPreferences', this.adapter.uuid);
        }
    }
    /**
     * Callback for executing the adapters
     * @param adapters the adapters to execute
     */
    function executeAdapters(adapters) {
        adapters.forEach(adapter => {
            adapter.execute(new ProxyAdapterContext(adapter));
        });
    }
    // Fetch the adapters from the
    util_1.sendMessage('requestAdapters')
        .then(rawAdapters => {
        let adapters = [];
        (rawAdapters || []).forEach((raw) => {
            adapters.push(adaptiveweb_1.Adapter.fromObject(raw));
        });
        return adapters;
    }, err => {
        throw new Error(err);
    })
        .then(adapters => {
        executeAdapters(adapters);
    });
})();
//# sourceMappingURL=content.js.map