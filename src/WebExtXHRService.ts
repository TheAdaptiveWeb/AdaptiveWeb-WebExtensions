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
    request(url: string, options: XHROptions | Object): Promise<any> {
        return new Promise<any>((resolve, reject) => {

            console.log('Checkpoint A');

            let _opts: XHROptions = (options instanceof XHROptions) ? options : new XHROptions(options);

            url = _opts.encodeUrlParameters(url);

            let method = _opts.method;
            let useBody = method !== 'GET' && method !== 'TRACE'; 
            let data = _opts.data;

            console.log('Checkpoint B');

            // add url parameters
            if (_opts.method == 'GET') {
                url += '?'
                for (let param in data) {
                    url += param + '=' + data[param] + '&';
                };
                url = url.slice(0, -1);
            } else if (useBody) {
                data = _opts.serialize(data);
            }


            console.log('Checkpoint C');

            let req = new XMLHttpRequest();
            req.open(_opts.method, url, _opts.async || true, _opts.user, _opts.password);
            Object.keys(_opts.headers).forEach(key => {
                let val = _opts.headers[key];
                req.setRequestHeader(key, val);
            });
            req.withCredentials = _opts.withCredentials || req.withCredentials;
            req.timeout = _opts.timeout || req.timeout;


            console.log('Checkpoint D');

            // Handle aborts
            let aborted: boolean = false;
            let _abort: Function = req.abort;
            req.abort = function() {
                aborted = true;
                _abort();
            }


            console.log('Checkpoint E');

            req.onreadystatechange = () => {

            console.log('Checkpoint F');
                if (aborted) return;

                if (req.readyState === 4) {
                    try {
                        let success = (req.status >= 200 && req.status < 300) || req.status == 304;
                        let response = _opts.deserialize(req.responseText);
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

            if (useBody) req.send(_opts.data);
            else req.send();
            console.log('Checkpoint G');
        });
   }

}