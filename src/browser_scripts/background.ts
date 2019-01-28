
import { AWClient } from '../../../AdaptiveWeb-Core/dist/main';
import { WebExtWrapper } from '../WebExtWrapper';
import { handleMessage } from './util';

declare var chrome: any, browser: any;
const b: any = chrome || browser;

// Handles user clicking on browser icon.
let customisationUrl = 'https://adaptiveweb.io/customize';
b.browserAction.onClicked.addListener(() => {
    b.tabs.create({ url: customisationUrl });
});

// Initiate the client
const wrapper = new WebExtWrapper();
const awClient = new AWClient(wrapper);

handleMessage((bundle: any) => {
    switch (bundle.message) {
        case 'requestAdapters':
        return new Promise<any>((resolve, reject) => {
            let adapters = awClient.getAdapters();
            resolve(Object.keys(adapters).map(key => adapters[key]));
        });
        case 'request': return request(bundle);
        case 'getPreferences': return getPreferences(bundle);
        default: return undefined;
    }
});

function request(bundle: any) {
    let uuid = bundle.data.uuid;
    let args = bundle.data.args;
    let context = awClient.getAdapterContext(awClient.getAdapters()[uuid]);
    return context.request(args.url, args.options);
}

function getPreferences(bundle: any) {
    let context = awClient.getAdapterContext(awClient.getAdapters()[bundle.data]);
    return context.getPreferences();
}