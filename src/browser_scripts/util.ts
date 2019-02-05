declare var chrome: any, browser: any;
const b: any = chrome || browser;

/**
 * Sends a message
 * @param messageName the name of the message
 * @param data the data to send with the message
 */
export function sendMessage(messageName: string, data?: any): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        let resolved = false;
        let promise = b.runtime.sendMessage({
            message: messageName,
            data: data
        }, function(response: any) {
            if (!resolved) resolve(response);
        });

        if (promise != undefined) {
            resolved = true;
            promise.then((res: any) => resolve(res));
        }
    });
}

/**
 * Registers an event listener to listen for messages of a given name.
 * @param messageName the name of the message to listen for
 * @param callback the callback for handling the message
 */
export function handleMessage(callback: Function) {
    /**
     * NOTE: sendResponse is being deprecated in favour of promises, but browsers
     * including Chrome still use sendResponse. As a temporary measure, both
     * promises and sendResponse are being used here.
     * 
     * See https://github.com/mozilla/webextension-polyfill/issues/16#issuecomment-296693219
     */
    b.runtime.onMessage.addListener((bundle: any, sender: any, sendResponse: Function) => {
        let promise: Promise<any> = callback(bundle, sender);
        if (promise == undefined) return;
        if (sendResponse != undefined)
            promise.then(res => sendResponse(res));
        return promise;
    });
}