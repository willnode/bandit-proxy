var httpProxy = require('http-proxy');
var net = require('net');
var url = require('url');
var insensitiveObject = require('./insensitive-object');

/**
 * Bandit proxy options
 * @typedef {Object} ProxyOptions
 * @property {number} redirects Set max auto redirection (default is 10)
 * @property {Object} headers Custom headers to be set (or remove if a prop set empty)
 * @property {boolean} fixheads Should headers prepended 'x-' upon request are transformed? (default is true)
 * @property {*} httpProxy Custom http-proxy options
 */

/**
 * This creates a http proxy instance with custom headers.
 * @param {ProxyOptions} options custom headers upon sending
 */
exports.createServer = function (options) {
    options = Object.assign({
        headers: {},
        redirects: 10,
        fixheads: true,
        httpProxy: {},
    }, options || {});

    var proxy = httpProxy.createServer(options.httpProxy);
    var requestHandler = getHandler(options, proxy);
    var server = require('http').createServer(requestHandler);

    // When the server fails, just show a 404 instead of 5xx
    proxy.on('error', function (err, req, res) {
        if (res.headersSent) {
            // Do not write the headers or it would generate an error.
            return;
        }

        res.writeHead(404, options.headers);
        res.end('Not found because of proxy error: ' + err);
    });

    return server;
};

/**
 * Generate HTTP server
 * @param {ProxyOptions} options options
 * @param {Server} proxy proxy
 * @returns {{req:IncomingMessage, res:ServerResponse}} HTTP functions
 */
function getHandler(options, proxy) {

    return function (req, res) {

        if (req.method === 'OPTIONS') {
            // CORS Pre-flight request.
            res.writeHead(200, options.headers);
            res.end();
            return;
        }

        var location = url.parse(req.url.slice(1));

        if (!location || location.port > 65535 || (!/^\/https?:/.test(req.url))) {
            // Anything invalid dumped here
            res.writeHead(400, options.headers);
            res.end('Something wrong with your request.');
            return;
        }

        req.headers = injectRequest(req.headers);

        proxyRequest(req, res, options, proxy, {
            times: 0,
            url: location,
        });
    }
}

/**
 * Bandit proxy state
 * @typedef {Object} ProxyState
 * @property {number} times number of redirects
 * @property {UrlWithStringQuery|string} url Current url
 */

/**
 * Actual proxy system
 * @param {IncomingMessage} req
 * @param {ServerResponse} res
 * @param {ProxyOptions} options
 * @param {Server} proxy
 * @param {ProxyState} state
 */
function proxyRequest(req, res, options, proxy, state) {
    var location = state.url;
    req.url = location.path;

    var proxyOptions = {
        changeOrigin: false,
        prependPath: false,
        target: location,
        headers: {
            host: location.host,
        },
        // HACK: Get hold of the proxyReq object, because we need it later.
        // https://github.com/nodejitsu/node-http-proxy/blob/v1.11.1/lib/http-proxy/passes/web-incoming.js#L144
        buffer: {
            pipe: function (proxyReq) {
                var proxyReqOn = proxyReq.on;
                // Intercepts the handler that connects proxyRes to res.
                // https://github.com/nodejitsu/node-http-proxy/blob/v1.11.1/lib/http-proxy/passes/web-incoming.js#L146-L158
                proxyReq.on = function (eventName, listener) {
                    if (eventName !== 'response') {
                        return proxyReqOn.call(this, eventName, listener);
                    }
                    return proxyReqOn.call(this, 'response', function (proxyRes) {
                        if (onProxyResponse(req, res, options, proxy, proxyReq, proxyRes, state)) {
                            try {
                                listener(proxyRes);
                            } catch (err) {
                                // Wrap in try-catch because an error could occur
                                proxyReq.emit('error', err);
                            }
                        }
                    });
                };
                return req.pipe(proxyReq);
            },
        },
    }


  var proxyThroughUrl = require('proxy-from-env').getProxyForUrl(location.href);
  if (proxyThroughUrl) {
    proxyOptions.target = proxyThroughUrl;
    proxyOptions.toProxy = true;
    // If a proxy URL was set, req.url must be an absolute URL. Then the request will not be sent
    // directly to the proxied URL, but through another proxy.
    req.url = location.href;
  }

  // Start proxying the request
  proxy.web(req, res, proxyOptions);
}

/**
 * Internal Proxy modifier
 * @param {IncomingMessage} req
 * @param {ServerResponse} res
 * @param {ProxyOptions} options
 * @param {Server} proxy
 * @param {ProxyState} state
 */
function onProxyResponse(req, res, options, proxy, proxyReq, proxyRes, state) {

    var statusCode = proxyRes.statusCode;

    if (!state.times) {
        res.setHeader('x-request-url', state.url.href);
    }
    // Handle redirects
    if (statusCode === 301 || statusCode === 302 || statusCode === 303 || statusCode === 307 || statusCode === 308) {
        var locationHeader = proxyRes.headers.location;
        if (locationHeader) {
            locationHeader = url.resolve(state.url.href, locationHeader);

            if (statusCode === 301 || statusCode === 302 || statusCode === 303) {
                // Exclude 307 & 308, because they are rare, and require preserving the method + request body
                state.times++;
                if (state.times <= options.redirects) {
                    // Handle redirects within the server, because some clients (e.g. Android Stock Browser)
                    // cancel redirects.
                    // Set header for debugging purposes. Do not try to parse it!
                    res.setHeader('x-redirect-' + state.times, statusCode + ' ' + locationHeader);

                    req.method = 'GET';
                    req.headers['content-length'] = '0';
                    state.url = url.parse(locationHeader);

                    // Remove all listeners (=reset events to initial state)
                    req.removeAllListeners();

                    // Remove the error listener so that the ECONNRESET "error" that
                    // may occur after aborting a request does not propagate to res.
                    // https://github.com/nodejitsu/node-http-proxy/blob/v1.11.1/lib/http-proxy/passes/web-incoming.js#L134
                    proxyReq.removeAllListeners('error');
                    proxyReq.once('error', function catchAndIgnoreError() { });
                    proxyReq.abort();

                    // Initiate a new proxy request.
                    proxyRequest(req, res, options, proxy, state);
                    return false;
                }
            }
           // proxyRes.headers.location = requestState.proxyBaseUrl + '/' + locationHeader;
        }
    }

    proxyRes.headers['x-head-raw'] = JSON.stringify(proxyRes.headers);
    proxyRes.headers = injectResponse(proxyRes.headers, options.headers);
    return true;
}

/**
 *
 * @param {Object} target
 * @param {Object} source
 */
var injectResponse = function (target, source) {
   return insensitiveObject.assign(target, source);
}

var injectRequest = function (target) {
    if (insensitiveObject.get(target, 'x--custom')) {
        // clear all requests that have no `x--` in beginning
        for (const key in target) {
            if (!/[xX]--/.test(key)) {
                delete target[key];
            }
        }
    }
    for (const key in target) {
        if (/[xX]--/.test(key)) {
            var alias = key.substring(3);
            insensitiveObject.set(target, alias, target[key]);
            delete target[key];
        }
    }
    return target;
}

