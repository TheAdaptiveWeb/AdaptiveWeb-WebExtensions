

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
WebFont.load({
    google: {
        families: ['Nunito']
    }
});

let wrapper: Wrapper = new WebExtWrapper;
let awClient: AWClient = new AWClient(wrapper);

let adapters: Adapter[] = [];
let options: any;

let messageQueue: AWMessage[] = [];

awClient.init()
.then((_adapters: { [key: string] : Adapter }) => {
    console.log('Adapters: ', _adapters)
    adapters = Object.keys(_adapters).map(key => Adapter.fromObject(_adapters[key]));
    return awClient.getGlobalOptions();
}).then((globalOptions) => {
    options = globalOptions;

    if (options.developerMode) new AWCLIClient(awClient, options.autoReload);

    if (messageQueue.length > 0) {
        messageQueue.forEach(handleMessage)
    }

    adapters.forEach(adapter => {
        if (!adapter.developer)
            adapter.execute(awClient.getAdapterContext(adapter));
    });
});

if (location.href.startsWith(configurationBaseURI) || location.href.startsWith('http://localhost')) {
    addEventListener('message', (message: MessageEvent) => {
        if (!message.origin.startsWith(configurationBaseURI) || !location.href.startsWith('http://localhost')) return;
    });
}

function handleMessage(message: AWMessage) {
    if (!awClient.initiated) messageQueue.push(message);
    else {
        switch (message.type) {
            case 'requestAdapter': {
                sendReply({ id: message.messageId, data: awClient.getAdapters() });
                break;
            }
            case 'installAdapter': {
                awClient.attachAdapter(message.data.adapter);
                break;
            } 
            case 'removeAdapter': {
                awClient.detachAdapter(message.data.adapterId);
                break;
            }
            case 'updatePreferences': {
                awClient.updateAdapterPreferences(message.data.adapterId, message.data.preferences);
                break;
            }
            case 'setGlobalOptions': {
                awClient.setGlobalOptions(message.data.globalOptions);
                break;
            }
            case 'getGlobalOptions': {
                awClient.getGlobalOptions()
                    .then(options => { 
                        sendReply({ id: message.messageId, data: options }) 
                    }); 
                break;
            } 
        }
    }
}

function sendReply(message: any) {
    postMessage(message, '*')
}