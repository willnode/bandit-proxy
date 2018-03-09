var host = 'localhost';
var port = 7070;

require('./proxy').createServer({
  redirects: 10,
  fixheads: true,
  headers: {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': '*', // only supported by chrome 63+
    'access-control-expose-headers': '*, x-raw-head', // only supported by chrome 63+
    'access-control-allow-options': 'get, post, put, delete, options',
    'cache-control': 'no-store, must-revalidate'
  }
}).listen(port, host, function() {
  console.log('Running Proxy on ' + host + ':' + port);
});
