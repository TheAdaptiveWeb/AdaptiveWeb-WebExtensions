"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const b = chrome || browser;
/**
 * Sends a message
 * @param messageName the name of the message
 * @param data the data to send with the message
 */
function sendMessage(messageName, data) {
    return new Promise((resolve, reject) => {
        let resolved = false;
        let promise = b.runtime.sendMessage({
            message: messageName,
            data: data
        }, function (response) {
            if (!resolved)
                resolve(response);
        });
        if (promise != undefined) {
            resolved = true;
            promise.then((res) => resolve(res));
        }
    });
}
exports.sendMessage = sendMessage;
/**
 * Registers an event listener to listen for messages of a given name.
 * @param messageName the name of the message to listen for
 * @param callback the callback for handling the message
 */
function handleMessage(callback) {
    /**
     * NOTE: sendResponse is being deprecated in favour of promises, but browsers
     * including Chrome still use sendResponse. As a temporary measure, both
     * promises and sendResponse are being used here.
     *
     * See https://github.com/mozilla/webextension-polyfill/issues/16#issuecomment-296693219
     */
    b.runtime.onMessage.addListener((bundle, sender, sendResponse) => {
        let promise = callback(bundle, sender);
        if (promise == undefined)
            return;
        if (sendResponse != undefined)
            promise.then(res => sendResponse(res));
        return promise;
    });
}
exports.handleMessage = handleMessage;
//# sourceMappingURL=util.js.map