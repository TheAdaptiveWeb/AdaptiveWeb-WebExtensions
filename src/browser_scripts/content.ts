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