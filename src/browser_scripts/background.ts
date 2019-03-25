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
let developerMode: boolean, autoReload: boolean;
let socket: SocketIOClient.Socket;

let unfulfilled: any = [];

function init() {
    // Init the AWClient
    awClient.init().then(() => {
        unfulfilled.forEach((message: any) => {
            let { bundle, sender, resolve } = message;
            resolve(fulfilMessage(bundle, sender));
        });

        // Setup developer mode if applicable
        refreshOptions(initDeveloperMode);
    });
}

function refreshOptions(then: Function) {
    if (awClient === undefined) return;
    awClient.getGlobalOptions().then(options => {
        developerMode = options && options.developerMode;
        autoReload = options && options.autoReload;
        then();
    })
}

/**
 * Connects to the native interface
 */
function initDeveloperMode() {
    // Check if development server is online
    socket = io('http://localhost:13551');

    socket.io.on('connect_error', (err: any) => {
        console.log('Development server not online.', err);
        socket.close();
        return;
    });
    
    socket.on('connect', () => { 
        console.log('Connected to development server');
        socket.emit('requestAdapters', (adapters: any[]) => {
            console.log('Removing old development adapters');
            let devAdapters = awClient.getAdapters();
            let uninstallList = Object.keys(devAdapters).filter(k => devAdapters[k].developer);
            uninstallList.forEach((adapter: any) => awClient.detachAdapter(adapter.id));

            console.log('Adding adapters:', adapters);
            adapters.forEach(adapter => {
                adapter.developer = true;
                let a = Adapter.fromObject(adapter);
                awClient.attachAdapter(a, true);
            });
        });
    });
    
    socket.on('adapterUpdate', ((msg: any) => {
        refreshOptions(function() {
            if (!developerMode) socket.close();
            else {
                console.log('Adapter update from awcli:', msg);
                // Install the adapter
                msg.developer = true;
                let adapter = Adapter.fromObject(msg);
                awClient.attachAdapter(adapter, true);

                if (autoReload) {
                    let reloadTab = (tab: any) => {
                        b.tabs.reload(tab.id);
                    };

                    // Reload the current tab
                    let promise = b.tabs.query({ active: true, currentWindow: true }, (tabs: any) => reloadTab(tabs[0]));

                    if (promise != undefined) {
                        promise.then((tabs: any) => reloadTab(tabs[0]));
                    }
                }
            }
        });
    }));

    socket.on('disconnect', () => {
        console.log('Disconnected from native interface.');
    });
}

// Handle messages sent from content script
handleMessage((bundle: any, sender: any) => {
    if (!awClient.initiated) {
        return new Promise((resolve, _) => {
            unfulfilled.push({ bundle, sender, resolve });
        });
    } else {
        return fulfilMessage(bundle, sender);
    }
});

function fulfilMessage(bundle: any, sender: any) {
    switch (bundle.message) {
        case 'init':
        if (developerMode && (socket === undefined || !socket.connected))
            initDeveloperMode();
        return Promise.resolve();
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
            if (bundle.data.id) return handleAdapterContextCall(bundle.message, bundle.data);
            return new Promise<any>((_, reject) => reject(new Error('Command not found: ' + bundle.message)));
        }
    }
}

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
        let { id, args = [] } = bundle;
        let context: AdapterContext = awClient.getAdapterContext(awClient.getAdapters()[id]);

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
 * @param id the id of the adapter to detach
 */
function removeAdapter(id: string) {
    awClient.detachAdapter(id);
}

/**
 * Sets the preferences for an adapter
 * @param bundle the bundle
 */
function updatePreferences(bundle: any) {
    awClient.setAdapterPreferences(bundle.id, bundle.preferences);
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