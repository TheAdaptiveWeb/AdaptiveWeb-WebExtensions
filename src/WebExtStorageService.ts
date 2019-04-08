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
import { StorageService, StorageType } from "adaptiveweb";

declare var chrome: any, browser: any;

/**
 * WebExtensions implementation of the StorageService.
 */
export class WebExtStorageService implements StorageService {

    browser: any = chrome || browser;

    /**
     * Sets a key in the store to a given value.
     * @param key the key to set in the store
     * @param value the value to set the given entry to
     * @param type the type of storage, defaults to StorageType.SYNC
     */
    set(key: string, value: any, type: StorageType = StorageType.LOCAL): Promise<any> {
        let storage = (type === StorageType.SYNC) ? this.browser.storage.sync : this.browser.storage.local;
        
        return new Promise<any>((resolve, reject) => {
            let promise = storage.set({ [key] : value }, (result: any) => {
                resolve(result);
            });

            if (promise !== undefined) {
                return promise;
            }
        });
    }

    /**
     * Fetches the value stored at the given key
     * @param key the key to retrieve
     */
    get(key: string, type: StorageType = StorageType.LOCAL): Promise<any> {
        let storage = (type === StorageType.SYNC) ? this.browser.storage.sync : this.browser.storage.local;
        
        return new Promise<any>((resolve, reject) => {
            let promise = storage.get(key, (result: any) => {
                resolve(result[key]);
            });

            if (promise !== undefined) {
                promise.then((result: any) => {
                    resolve(result[key]);
                })
            }
        });
    }

}