var host = 'localhost';
var port = 7070;

require('./lib/cors-anywhere').createServer({
  originBlacklist: [],
  originWhitelist: [],
  requireHeader: [],
  checkRateLimit: null,
  removeHeaders: [],
  redirectSameOrigin: true,
  httpProxyOptions: {
    // Do not add X-Forwarded-For, etc. headers, because Heroku already adds it.
    xfwd: false,
  },
}).listen(port, host, function() {
  console.log('Running CORS Anywhere on ' + host + ':' + port);
});
