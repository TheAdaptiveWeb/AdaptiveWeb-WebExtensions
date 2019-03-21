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
import { XHRService, XHROptions } from "adaptiveweb";

/**
 * WebExtensions implementation of the XHRService.
 */
export class WebExtXHRService implements XHRService {

    /**
     * Sends a XHR (AJAX) request and returns a promise.
     * @param url the url to send the request to. Can contain interpolations.
     * @param options The options of the request.
     */
    request(url: string, options: XHROptions | any): Promise<any> {
        return new Promise<any>((resolve, reject) => {

            if (!(options instanceof XHROptions)) options = new XHROptions(options);

            url = options.encodeUrlParameters(url);

            let method = options.method;
            let useBody = method !== 'GET' && method !== 'TRACE'; 
            let data = options.data;

            // add url parameters
            if (options.method == 'GET') {
                url += '?'
                for (let param in data) {
                    url += param + '=' + data[param] + '&';
                };
                url = url.slice(0, -1);
            } else if (useBody) {
                data = options.serialize(data);
            }

            let req = new XMLHttpRequest();
            req.open(options.method, url, options.async || true, options.user, options.password);
            req.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
            req.setRequestHeader('Accept', 'application/json, text/*')
            req.withCredentials = options.withCredentials || req.withCredentials;
            req.timeout = options.timeout || req.timeout;

            // Handle aborts
            let aborted: boolean = false;
            let _abort: Function = req.abort;
            req.abort = function() {
                aborted = true;
                _abort();
            }

            req.onreadystatechange = () => {
                if (aborted) return;

                if (req.readyState === 4) {
                    try {
                        let success = (req.status >= 200 && req.status < 300) || req.status == 304;
                        let response = options.deserialize(req.responseText);
                        if (success) resolve(response);
                        else {
                            let err: Error = new Error(req.responseText);
                            reject(err);
                        }
                    } catch (e) {
                        reject(e);
                    }
                }
            }

            if (useBody) req.send(options.data);
            else req.send();
        });
   }

}