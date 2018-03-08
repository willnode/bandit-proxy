// const http = require('http');
// const net = require('net');
// const url = require('url');

// // Create an HTTP tunneling proxy
// const proxy = http.createServer((req, res) => {
//   res.writeHead(200, { 'Content-Type': 'text/plain' });
//   res.end('okay');
// });

// proxy.on('connect', (req, cltSocket, head) => {
//   // connect to an origin server
//   const srvUrl = url.parse(`http://${req.url}`);
//   const srvSocket = net.connect(srvUrl.port, srvUrl.hostname, () => {
//     cltSocket.write('HTTP/1.1 200 Connection Established\r\n' +
//                     'Proxy-agent: Node.js-Proxy\r\n' +
//                     '\r\n');
//     srvSocket.write(head);
//     srvSocket.pipe(cltSocket);
//     cltSocket.pipe(srvSocket);
//   });
// });

// // now that proxy is running
// proxy.listen(7070, '127.0.0.1', () => {

//   // make a request to a tunneling proxy
//   const options = {
//     port: 7070,
//     hostname: '127.0.0.1',
//     method: 'CONNECT',
//     path: 'www.google.com:80'
//   };

//   const req = http.request(options);
//   req.end();

//   req.on('connect', (res, socket, head) => {
//     console.log('got connected!');

//     // make a request over an HTTP tunnel
//     socket.write('GET / HTTP/1.1\r\n' +
//                  'Host: www.google.com:80\r\n' +
//                  'Connection: close\r\n' +
//                  '\r\n');
//     socket.on('data', (chunk) => {
//       console.log(chunk.toString());
//     });
//     socket.on('end', () => {
//       proxy.close();
//     });
//   });
// });

// //import { IncomingMessage } from 'http';

var fs = require('fs');
var net = require('net');
var http = require('http');
var https = require('https');

var baseAddress = 7070;
var redirectAddress = 7071;
var httpsAddress = 7072;
var httpsOptions = {
  key: fs.readFileSync('./ssl/ssl_key.pem'),
  cert: fs.readFileSync('./ssl/ssl_cert.pem'),
  passphrase: "password"
};

net.createServer((conn) => {
  conn.once('data', function (buf) {

    var address = (buf[0] < 32 || buf[0] >= 127) ? httpsAddress : redirectAddress;
    var proxy = net.createConnection(address, function () {
      // if (buf[0] == 67) {
      //  // console.log(buf[0]);
      //   conn.write('HTTP/1.1 200 Connection Established\r\n' +
      //     'Proxy-agent: Node.js-Proxy\r\n' +
      //     'Connection: close\r\n\r\nDummydummy'
      //     );
      //   conn.end();
      // } else
      {
        proxy.write(buf);
        conn.pipe(proxy).pipe(conn);
      }
    });
  });
}).listen(baseAddress);

http.createServer((req, res) => {
  console.log(req.method);
  res.writeHead(200, { 'Content-Length': '4' });
  res.end('HTTP');
}).listen(redirectAddress);

https.createServer(httpsOptions, (req, res) => {
  console.log(req.method);
  console.log("SSS");

  res.writeHead(200, { 'Content-Length': '5' });
  res.end('HTTPS');
}).listen(httpsAddress);
