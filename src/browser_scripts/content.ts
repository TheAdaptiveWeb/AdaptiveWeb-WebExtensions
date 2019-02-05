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
import { Adapter, XHROptions, IAdapterContext } from "adaptiveweb";
import { sendMessage } from "./util";
import 'adaptiveweb/dist/reporting';

(function() {

    /**
     * Routes AdapterContext calls through the background script
     */
    class ProxyAdapterContext implements IAdapterContext {
        adapter: Adapter;
        constructor(adapter: Adapter) {
            this.adapter = adapter;
        }

        request(url: string, options: XHROptions): Promise<any> {
            return sendMessage('request', { uuid: this.adapter.uuid, args: [url, options] });
        }

        getPreferences(): Promise<any> {
            return sendMessage('getPreferences', this.adapter.uuid);
        }
    }

    /**
     * Callback for executing the adapters
     * @param adapters the adapters to execute
     */
    function executeAdapters(adapters: Adapter[]) {
        adapters.forEach(adapter => {
            adapter.execute(new ProxyAdapterContext(adapter));
        });
    }

    // Fetch the adapters from the
    sendMessage('requestAdapters')
        .then(rawAdapters => {
            let adapters: Adapter[] = [];
            (rawAdapters || []).forEach((raw: any) => {
                adapters.push(Adapter.fromObject(raw));
            });
            return adapters;
        }, err => {
            throw new Error(err);
        })
        .then(adapters => {
            executeAdapters(adapters);
        });

    /**
     * Handle messages from page
     */
    window.addEventListener('message', event => {
        if (event.source != window) return;
        let allowedOrigins = /https:\/\/adaptiveweb\.io(\/.+)*(\/)?/;
        if (allowedOrigins.exec(event.origin) == undefined) return;

        let { message, data } = event.data;
        sendMessage(message, data);
    });

})();