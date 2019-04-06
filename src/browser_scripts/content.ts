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

import { Wrapper, AWClient, Adapter } from 'adaptiveweb';
import { WebExtWrapper } from '../WebExtWrapper';
import { AWMessage } from '../AWMessage';
import { AWCLIClient } from '../AWCLIClient';

/**
 * Load required fonts
 */
import * as WebFont from 'webfontloader';
import { configurationBaseURI } from './config';
import { compressAdapter } from './util';

WebFont.load({
    google: {
        families: ['Nunito']
    }
});

let wrapper: Wrapper = new WebExtWrapper;
let awClient: AWClient = new AWClient(wrapper);

let adapters: Adapter[] = [];
let options: any;

let awcli: AWCLIClient;

let enableMessaging: boolean = location.href.startsWith(configurationBaseURI) || location.href.startsWith('http://localhost');
let messageQueue: AWMessage[] = [];

awClient.init()
.then((_adapters: { [key: string] : Adapter }) => {
    adapters = Object.keys(_adapters).map(key => Adapter.fromObject(_adapters[key]));
    return awClient.getGlobalOptions();
}).then((globalOptions) => {
    options = globalOptions;
    
    if (options && options.developerMode) awcli = new AWCLIClient(awClient, options.autoReload);

    if (messageQueue.length > 0) {
        messageQueue.forEach(handleMessage);
    }

    adapters.forEach(adapter => {
        adapter.execute(awClient.getAdapterContext(adapter));
    });

    sendReply({ message: 'initAdaptiveWebPlugin' });
});

if (enableMessaging) {
    addEventListener('message', (message: MessageEvent) => {
        handleMessage(message.data);
    });
}

function handleMessage(message: AWMessage) {
    if (!message.outbound) return;
    if (!awClient.initiated) messageQueue.push(message);
    else {
        switch (message.type) {
            case 'requestAdapters': {
                let adapters = awClient.getAdapters();
                sendReply({ 
                    messageId: message.messageId, 
                    data: Object.keys(adapters).map(k => compressAdapter(adapters[k]))
                });
                break;
            }
            case 'installAdapter': {
                awClient.attachAdapter(message.data.adapter, message.data.replace);
                break;
            }
            case 'removeAdapter': {
                awClient.detachAdapter(message.data.adapterId);
                if (awcli !== undefined) awcli.removeAdapter(message.data.adapterId);
                break;
            }
            case 'updatePreferences': {
                awClient.updateAdapterPreferences(message.data.adapterId, message.data.preferences);
                break;
            }
            case 'getAdapterPreferences': {
                awClient.getAdapterPreferences(message.data.adapterId)
                    .then((preferences: any) => {
                        sendReply({
                            messageId: message.messageId,
                            data: preferences
                        })
                    });
                break;
            }
            case 'setGlobalOptions': {
                awClient.setGlobalOptions(message.data);
                break;
            }
            case 'getGlobalOptions': {
                awClient.getGlobalOptions()
                    .then(options => { 
                        sendReply({ 
                            messageId: message.messageId, 
                            data: options
                        }) 
                    }); 
                break;
            } 
        }
    }
}

function sendReply(message: any) {
    postMessage(message, '*');
}