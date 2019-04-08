import { handleMessage } from "./util";
import request from './request';

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

declare var chrome: any, browser: any;
const browse: any = chrome || browser;

// Handles user clicking on browser icon.
let customisationUrl = 'https://adaptiveweb.io/configure/#/adapters';
browse.browserAction.onClicked.addListener(() => {
    browse.tabs.create({ url: customisationUrl });
});

handleMessage((bundle: any, sender: any) => {

    if (bundle.intent === 'request') {
        return request(bundle.data.url, bundle.data.options);
    }

    return Promise.reject('Unrecognised intent.');

});