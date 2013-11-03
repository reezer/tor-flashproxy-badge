# Tor Flashproxy Badge

## Synopsis

*Tor Flash Proxy Badge* - a small Firefox extension turning
Firefox into a bridge for censored users in countries with
oppressive regimes

## Description

For more information on how it works see the
[Flash Proxy Web Page](http://crypto.stanford.edu/flashproxy/).

##  FAQ

### Will this cause a lot of bandwidth usage?

Most likely not. Currently connections are short-lived and
don't take up a lot of bandwidth. Should this become a problem
a feature to rate limit the bandwidth will be implemented.

### Will this mean I'll receive complaints about illegal activities (file sharing, etc.)

*No!* Per design the Tor Flashproxy Badge will not allow anyone
to exit over your internet connection. This extension only acts
as a provider for an uncensored connection. It transfers data
between the censored user and a server that otherwise is easier
to block.

### How does it work?

About every ten minutes this extension will ask a so called
Faciliator about whether there are any known clients that
need help. Should this be the case a connection to them and
a Tor relay (the server that will allow them to access the
uncensored internet) will be built.

Usually an opressive regieme would have to just find out the
IP address of a node and could block all the connections to
it (just like some employers block Youtube or Facebook), but
since the connection can between any user of this extension
it is going to be way harder then this and with everyone
installing this extension it will become even harder. So
even if there are no connections currently, but just being
a possible candidate helps a lot.

### But what about Chrome/Chromium/Iron/...?

There is a great extension that originally inspired Tor
Flashproxy Badge called [Cupcake](https://chrome.google.com/webstore/detail/cupcake/dajjbehmbnbppjkcnpdkaniapgdppdnc) by Griffin Boyce.
It looks a bit different, but does the very same thing.

### The icons becomes red all the time. What should I do?

If you are using an extension such as NoScript or RequestPolicy
please make sure to permit the execution of JavaScript for both
[https://crypto.stanford.edu/flashproxy/](https://crypto.stanford.edu/flashproxy/)
and [https://fp-facilitator.org/](https://fp-facilitator.org/).
Should there still be problems please file a new issue on
[GitHub](https://github.com/reezer/tor-flashproxy-badge/issues).

### TODO

* Write a description
* Write tests
* Logo
* Bandwidth limiting
* Check whether it plays along with NoScript
* Experiment with WebRTC/PeerConnection


## License

License is ISC, which means BSD license, with language that
was made unnecessary by the Berne convention removed.

Copyright (c) 2013, Christian Sturm <reezer@reezer.org>

Permission to use, copy, modify, and/or distribute this 
software for any purpose with or without fee is hereby
granted, provided that the above copyright notice and
this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS
ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO
EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER
RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION,
ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE
OF THIS SOFTWARE.
