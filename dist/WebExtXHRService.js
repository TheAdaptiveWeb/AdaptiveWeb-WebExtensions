"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * WebExtensions implementation of the XHRService.
 */
class WebExtXHRService {
    /**
     * Sends a XHR (AJAX) request and returns a promise.
     * @param url the url to send the request to. Can contain interpolations.
     * @param options The options of the request.
     */
    request(url, options) {
        return new Promise((resolve, reject) => {
            url = options.encodeUrlParameters(url);
            let method = options.method;
            let useBody = method !== 'GET' && method !== 'TRACE';
            let data = options.data;
            // add url parameters
            if (options.method == 'GET') {
                url += '?';
                for (let param in data) {
                    url += param + '=' + data[param] + '&';
                }
                ;
                url = url.slice(0, -1);
            }
            else if (useBody) {
                data = options.serialize(data);
            }
            let req = new XMLHttpRequest();
            req.open(options.method, url, options.async || true, options.user, options.password);
            req.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
            req.setRequestHeader('Accept', 'application/json, text/*');
            req.withCredentials = options.withCredentials || req.withCredentials;
            req.timeout = options.timeout || req.timeout;
            // Handle aborts
            let aborted = false;
            let _abort = req.abort;
            req.abort = function () {
                aborted = true;
                _abort();
            };
            req.onreadystatechange = () => {
                if (aborted)
                    return;
                if (req.readyState === 4) {
                    try {
                        let success = (req.status >= 200 && req.status < 300) || req.status == 304;
                        let response = options.deserialize(req.responseText);
                        if (success)
                            resolve(response);
                        else {
                            let err = new Error(req.responseText);
                            reject(err);
                        }
                    }
                    catch (e) {
                        reject(e);
                    }
                }
            };
            if (useBody)
                req.send(options.data);
            else
                req.send();
        });
    }
}
exports.WebExtXHRService = WebExtXHRService;
//# sourceMappingURL=WebExtXHRService.js.map