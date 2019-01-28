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
    b.runtime.onMessage.addListener((bundle: any, {}, sendResponse: Function) => {
        let promise: Promise<any> = callback(bundle);
        if (promise == undefined) return;
        promise.then(res => sendResponse(res));
        return promise;
    });
}