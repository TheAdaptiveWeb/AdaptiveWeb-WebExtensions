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
import { encodeBlob, sendMessage } from './browser_scripts/util';

/**
 * WebExtensions implementation of the XHRService.
 */
export class WebExtXHRService implements XHRService {

    /**
     * Sends a XHR (AJAX) request and returns a promise.
     * @param url the url to send the request to. Can contain interpolations.
     * @param options The options of the request.
     */
    request(url: string, options: XHROptions | Object = {}): Promise<any> {
        if ((<any>options).data instanceof Blob) {
            return encodeBlob((<any>options).data).then((blobStr: string) => {
                (<any>options).data = blobStr;
                return sendMessage('request', { url, options })
            });
        } else {
            return sendMessage('request', { url, options })
        }
   }

}