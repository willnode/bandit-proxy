var httpolyglot = require('httpolyglot');
var fs = require('fs');

httpolyglot.createServer({
    key: fs.readFileSync('./ssl/ssl_key.pem'),
    cert: fs.readFileSync('./ssl/ssl_cert.pem'),
    passphrase: "password"
}, function(req, res) {
  res.writeHead(200, { 'Content-Type': 'text/plain', 'Hostname': 'Bandit' });
  res.end((req.socket.encrypted ? 'HTTPS' : 'HTTP') + ' Connection!');
}).listen(7070, 'localhost', function() {
  console.log('httpolyglot server listening on port 7070');
});
