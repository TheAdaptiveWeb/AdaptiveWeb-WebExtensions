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

import * as io from 'socket.io-client';

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
let developerMode: boolean;
let socket;

function init() {
    // Setup developer mode if applicable
    awClient.getGlobalOptions().then(options => {
        developerMode = options && options.developerMode;
        if (options && options.developerMode) {
            initDeveloperMode();
        }
    })
}

/**
 * Connects to the native interface
 */
function initDeveloperMode() {
    socket = io('http://localhost:13551');
    
    socket.on('connect', () => { console.log('Connected to development server'); });
    
    socket.on('adapterUpdate', ((msg: any) => {
        console.log('Adapter update from awcli:', msg);
        // Install the adapter
        let adapter = Adapter.fromObject(msg);
        awClient.attachAdapter(adapter, true);
    }));

    socket.on('disconnect', () => {
        console.log('Disconnected from native interface.');
    });
}

// Handle messages sent from content script
handleMessage((bundle: any, sender: any) => {
    switch (bundle.message) {
        case 'requestAdapters':
        return new Promise<any>((resolve, reject) => {
            let adapters = awClient.getAdapters();
            resolve(Object.keys(adapters).map(key => adapters[key]));
        });
        case 'installAdapter': return validate(attachAdapter, bundle.data, sender);
        case 'removeAdapter': return validate(removeAdapter, bundle.data, sender);
        case 'updatePreferences': return validate(updatePreferences, bundle.data, sender);
        case 'setGlobalOptions': return validate(setGlobalOptions, bundle.data, sender);
        case 'getGlobalOptions': return validate(getGlobalOptions, bundle.data, sender); 
        default: {
            if (bundle.data.uuid) return handleAdapterContextCall(bundle.message, bundle.data);
            return new Promise<any>((_, reject) => reject(new Error('Command not found: ' + bundle.message)));
        }
    }
});

init();

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
    return new Promise((resolve, reject) => {
        let { uuid, args = [] } = bundle;
        let context: AdapterContext = awClient.getAdapterContext(awClient.getAdapters()[uuid]);
        console.log('prototype', <any> AdapterContext.prototype);
        console.log('prototype fn', fn, (<any> AdapterContext.prototype)[fn]);
        // Handle function not found
        if ((<any> AdapterContext.prototype)[fn] === undefined) { 
            reject(new Error('Could not find function "' + fn + '"')); 
            return; 
        }
        // Resolve with response to adapter call
        (<any> AdapterContext.prototype)[fn].call(context, ...args).then((res: any) => {
            resolve(res);
        }, (err: any) => reject(err));
    });
    
}

/**
 * Attaches an adapter
 * @param adapter the adapter to attach
 */
function attachAdapter(rawAdapter: any) {
    let adapter = Adapter.fromObject(rawAdapter);
    return awClient.attachAdapter(adapter);
}

/**
 * Detach an adapter
 * @param uuid the uuid of the adapter to detach
 */
function removeAdapter(uuid: string) {
    awClient.detachAdapter(uuid);
}

/**
 * Sets the preferences for an adapter
 * @param bundle the bundle
 */
function updatePreferences(bundle: any) {
    awClient.setAdapterPreferences(bundle.uuid, bundle.preferences);
}

/**
 * Saves global options (used by the configuration site and interacting with awcli)
 * @param bundle the bundle
 */
function setGlobalOptions(bundle: any) {
    if (bundle && bundle.developerMode && !developerMode) {
        initDeveloperMode();
    }
    return awClient.setGlobalOptions(bundle);
}

/**
 * Fetch the global options.
 */
function getGlobalOptions() {
    return awClient.getGlobalOptions();
}