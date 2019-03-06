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
import { AWClient } from '../../../AdaptiveWeb-Core/dist/main';
import { WebExtWrapper } from '../WebExtWrapper';
import { handleMessage } from './util';
import { Adapter } from 'adaptiveweb';

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

handleMessage((bundle: any, sender: any) => {
    console.log(bundle.message);
    switch (bundle.message) {
        case 'requestAdapters':
        console.log('starting resolve');
        return new Promise<any>((resolve, reject) => {
            console.log('resolving');
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

function validate(next: Function, bundle: any, sender: any): Promise<any> {
    let allowedOrigins = /https:\/\/adaptiveweb\.io(\/.+)*(\/)?/;
    if (allowedOrigins.exec(sender.url) != undefined) return next(bundle);
    return new Promise<any>((resolve, reject) => {
        console.warn('Configuration intent received from disallowed origin');
        resolve();
    });
}

function request(bundle: any) {
    let uuid = bundle.data.uuid;
    let args = bundle.data.args;
    let context = awClient.getAdapterContext(awClient.getAdapters()[uuid]);
    return context.request(args.url, args.options);
}

function attachAdapter(rawAdapter: string) {
    let adapter = Adapter.fromObject(rawAdapter);
    awClient.attachAdapter(adapter);
}

function removeAdapter(uuid: string) {
    awClient.detachAdapter(uuid);
}

function getPreferences(bundle: any) {
    let context = awClient.getAdapterContext(awClient.getAdapters()[bundle.data]);
    return context.getPreferences();
}

function updatePreferences(bundle: any) {
    awClient.setAdapterPreferences(bundle.uuid, bundle.preferences);
}