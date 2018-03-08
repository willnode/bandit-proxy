# bandit-proxy

A proxy for web testing. Accompanying willnode/bandit XHR tools.

With this proxy **any website** that opened in your browser can:

+ Making XHR Bypassing CORS + Cache Control
+ Inject to protected HTTP Request Header (cookie, hostname, dsb.)
+ Fully read HTTP Response returned from XHR

All done without any rate-limitation, without compromising browser security.

## Installation

```
git clone https://github.com/willnode/bandit-proxy
cd bandit-proxy
yarn
node server
```

Then set the [bandit XHR](https://wellosoft.net/bandit/send.html) proxy to the address shown (e.g. `localhost:7070`).

## TODO

More options, more fine-grained testing features.

## A Securiy Breach

Don't leave this proxy run on casual browsing, please.
