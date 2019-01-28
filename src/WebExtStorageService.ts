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
    set(key: string, value: any, type: StorageType = StorageType.SYNC): Promise<any> {
        if (type == StorageType.SYNC) {
            return this.browser.storage.sync.set({ [key] : value });
        } else {
            return this.browser.storage.local.set({ [key] : value });
        }
    }

    /**
     * Fetches the value stored at the given key
     * @param key the key to retrieve
     */
    get(key: string, type: StorageType = StorageType.SYNC): Promise<any> {
        if (type == StorageType.SYNC) {
            return this.browser.storage.sync.get(key);
        } else {
            return this.browser.storage.local.get(key);
        }
    }

}