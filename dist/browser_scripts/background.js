"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const main_1 = require("../../../AdaptiveWeb-Core/dist/main");
const WebExtWrapper_1 = require("../WebExtWrapper");
const util_1 = require("./util");
const adaptiveweb_1 = require("adaptiveweb");
const b = chrome || browser;
// Handles user clicking on browser icon.
let customisationUrl = 'https://adaptiveweb.io/customize';
b.browserAction.onClicked.addListener(() => {
    b.tabs.create({ url: customisationUrl });
});
// Initiate the client
const wrapper = new WebExtWrapper_1.WebExtWrapper();
const awClient = new main_1.AWClient(wrapper);
util_1.handleMessage((bundle, sender) => {
    console.log(bundle);
    switch (bundle.message) {
        case 'requestAdapters':
            return new Promise((resolve, reject) => {
                let adapters = awClient.getAdapters();
                resolve(Object.keys(adapters).map(key => adapters[key]));
            });
        case 'request': return request(bundle);
        case 'installAdapter': return validate(attachAdapter, bundle, sender);
        case 'removeAdapter': return validate(removeAdapter, bundle, sender);
        case 'getPreferences': return getPreferences(bundle);
        case 'updatePreferences': return validate(updatePreferences, bundle, sender);
        default: return undefined;
    }
});
function validate(next, bundle, sender) {
    let allowedOrigin = 'https://adaptiveweb.io';
    if (sender.url.startsWith(allowedOrigin))
        return next(bundle);
    return new Promise((resolve, reject) => {
        console.warn('Configuration intent received from disallowed origin');
        resolve();
    });
}
function request(bundle) {
    let uuid = bundle.data.uuid;
    let args = bundle.data.args;
    let context = awClient.getAdapterContext(awClient.getAdapters()[uuid]);
    return context.request(args.url, args.options);
}
function attachAdapter(rawAdapter) {
    let adapter = adaptiveweb_1.Adapter.fromObject(rawAdapter);
    awClient.attachAdapter(adapter);
}
function removeAdapter(uuid) {
    awClient.detachAdapter(uuid);
}
function getPreferences(bundle) {
    let context = awClient.getAdapterContext(awClient.getAdapters()[bundle.data]);
    return context.getPreferences();
}
function updatePreferences(bundle) {
    awClient.setAdapterPreferences(bundle.uuid, bundle.preferences);
}
//# sourceMappingURL=background.js.map