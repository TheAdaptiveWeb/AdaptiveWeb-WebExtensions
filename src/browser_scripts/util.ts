import { Adapter } from 'adaptiveweb';

/**
 *  Copyright 2019 The Adaptive Web. All Rights Reserved.
 * 
 *  Licensed under the Mozilla Public License 2.0 (the "License"). 
 *  You may not use this file except in compliance with the License.
 *  A copy of the License is located at
 *  
 *      https://www.mozilla.org/en-US/MPL/2.0/
 *  
 *  or in the "license" file accompanying this file. This file is distributed 
 *  on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either 
 *  express or implied. See the License for the specific language governing 
 *  permissions and limitations under the License.
 */
declare var chrome: any, browser: any;
const b: any = chrome || browser;

/**
 * Sends a message
 * @param messageName the name of the message
 * @param data the data to send with the message
 */
export function sendMessage(intent: string, data?: any): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        let resolved = false;
        let promise = b.runtime.sendMessage({
            intent, data
        }, function(bundle: any) {
            if (bundle === undefined) {
                reject('Bundle is undefined');
                return;
            }
            let { message, isError } = bundle;
            if (!resolved) {
                if (isError) reject(message);
                else         resolve(message);
            }
        });

        if (promise != undefined) {
            resolved = true;
            return promise;
        }
    });
}

export function compressAdapter(adapter: Adapter | Object) {
    let whitelist = [
        'id',
        'name',
        'description',
        'version',
        'tags',
        'preferenceSchema',
        'about'
    ];

    let compressed: any = {};

    whitelist.forEach(w => {
        if ((<any>adapter)[w] !== undefined) compressed[w] = (<any>adapter)[w];
    });

    return compressed;
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
        if (sendResponse != undefined) { // For chrome
            promise.then(
                res => sendResponse({ message: res, isError: false }), 
                err => sendResponse({ message: err, isError: true })
            );
            return true; // Return true tells Chrome this is async
        } else return promise; // Firefox
    });
}

export function encodeBlob(blob: Blob): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = (event) => {
            if (event === null || event.target === null) 
                return reject('Could not read blob');
            resolve('aw-blob;' + (<any> event.target).result);
        }
        reader.readAsDataURL(blob);
    });
}

export function decodeBlob(raw: string): Blob {
    raw = raw.slice(22);

    let contentType = 'image/png';
    let sliceSize = 512;

    let bytes = atob(raw);
    let byteArrays = [];

    for (let offset = 0; offset < bytes.length; offset += sliceSize) {
        let slice = bytes.slice(offset, offset + sliceSize);

        let byteN = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) 
            byteN[i] = slice.charCodeAt(i);
        
        let byteArr = new Uint8Array(byteN);
        byteArrays.push(byteArr);
    }
    
    return new Blob(byteArrays, { type: contentType });
}