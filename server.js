var host = 'localhost';
var port = 7070;

require('./proxy').createServer({
  redirects: 10,
  fixheads: true,
  headers: {
    'access-control-allow-origin': '*',
    'access-control-allow-options': 'get, post, put, delete, options'
  }
}).listen(port, host, function() {
  console.log('Running Proxy on ' + host + ':' + port);
});
