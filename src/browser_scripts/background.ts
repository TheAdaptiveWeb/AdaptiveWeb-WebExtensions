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
import { WebExtWrapper } from '../WebExtWrapper';
import { handleMessage, validateOrigin } from './util';
import { AWClient, Adapter, AdapterContext } from 'adaptiveweb';

declare var chrome: any, browser: any;
const b: any = chrome || browser;

// Handles user clicking on browser icon.
let customisationUrl = 'https://adaptiveweb.io/#/adapters';
b.browserAction.onClicked.addListener(() => {
    b.tabs.create({ url: customisationUrl });
});

// Initiate the client
const wrapper = new WebExtWrapper();
const awClient = new AWClient(wrapper);

// Handle messages sent from content script
handleMessage((bundle: any, sender: any) => {
    if (bundle && bundle.data && bundle.data.uuid) {
        // Assume this is an AdapterContext call
        return handleAdapterContextCall(bundle.message, bundle.data);
    }
    switch (bundle.message) {
        case 'requestAdapters':
        return new Promise<any>((resolve, reject) => {
            let adapters = awClient.getAdapters();
            resolve(Object.keys(adapters).map(key => adapters[key]));
        });
        case 'installAdapter': return validate(attachAdapter, bundle.data, sender);
        case 'removeAdapter': return validate(removeAdapter, bundle.data, sender);
        case 'updatePreferences': return validate(updatePreferences, bundle.data, sender);
        default: return new Promise<any>((_, reject) => reject(new Error('Command not found: ' + bundle.message)));
    }
});

/**
 * Validate that a message is coming from an allowed origin
 * @param next the next function to run
 * @param bundle the bundle to pass through
 * @param sender the sender of the message
 */
function validate(next: Function, bundle: any, sender: any): Promise<any> {
    if (validateOrigin(sender.url)) return next(bundle);
    return new Promise<any>((_, reject) => {
        reject('Configuration intent received from disallowed origin');
    });
}

/**
 * Handle a call to an AdapterContext
 * @param fn the name of the function to call
 * @param bundle the bundle
 */
function handleAdapterContextCall(fn: string, bundle: any): Promise<any> {
    let { uuid, args } = bundle;
    let context: AdapterContext = awClient.getAdapterContext(awClient.getAdapters()[uuid]);
    return (<any>context)[fn](...args);
}

function attachAdapter(rawAdapter: any) {
    let adapter = Adapter.fromObject(rawAdapter);
    return awClient.attachAdapter(adapter);
}

function removeAdapter(uuid: string) {
    awClient.detachAdapter(uuid);
}

function updatePreferences(bundle: any) {
    awClient.setAdapterPreferences(bundle.uuid, bundle.preferences);
}