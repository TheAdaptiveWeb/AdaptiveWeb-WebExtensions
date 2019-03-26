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
import { decodeBlob } from './browser_scripts/util';

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

            let _opts: XHROptions = (options instanceof XHROptions) ? options : new XHROptions(options);

            let isDataBlob: boolean = false;

            if (_opts.data && typeof(_opts.data) === 'string' && _opts.data.startsWith('aw-blob;')) {
                _opts.data = decodeBlob(_opts.data.slice(8));
                isDataBlob = true;
            }

            url = _opts.encodeUrlParameters(url);

            let method = _opts.method;
            let useBody = method !== 'GET' && method !== 'TRACE'; 
            let data = _opts.data;

            // add url parameters
            if (_opts.method == 'GET' && !(data instanceof Blob) && typeof data !== 'string') {
                url += '?'
                for (let param in data) {
                    url += param + '=' + (<any>data)[param] + '&';
                };
                url = url.slice(0, -1);
            } else if (useBody && !isDataBlob) {
                data = _opts.serialize(data);
            }

            let req = new XMLHttpRequest();
            req.open(_opts.method, url, _opts.async || true, _opts.user, _opts.password);
            Object.keys(_opts.headers).forEach(key => {
                let val = _opts.headers[key];
                req.setRequestHeader(key, val);
            });
            req.withCredentials = _opts.withCredentials || req.withCredentials;
            req.timeout = _opts.timeout || req.timeout;

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

            if (useBody) req.send(<Blob | string> data);
            else req.send();
        });
   }

}