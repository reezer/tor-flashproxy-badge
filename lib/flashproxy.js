// Mozilla's Event Framework
var { on, once, off, emit } = require('sdk/event/core');
// Request
var Request = require("sdk/request").Request;
// Web like timers, cause we have no window object
var setTimeout = require('sdk/timers').setTimeout
// Replace parse_query_string with Mozilla's function
var querystring = require('sdk/querystring')

// The URL of the facilitator CGI script
const DEFAULT_FACILITATOR_URL = "https://fp-facilitator.org/";
// How many clients to serve concurrently
const DEFAULT_MAX_NUM_PROXY_PAIRS = 10;
// How long to wait before polling the facilitator the first time, in seconds
const DEFAULT_INITIAL_FACILITATOR_POLL_INTERVAL = 20.0;
// How often to poll the facilitator
//const DEFAULT_FACILITATOR_POLL_INTERVAL = 3600.0;
const DEFAULT_FACILITATOR_POLL_INTERVAL = 10.0;
// Minimum
const MIN_FACILITATOR_POLL_INTERVAL = 10.0;


/* Get an object value and parse it as an integer. Returns default_val if param
   is not a key. Return null on a parsing error. */
function get_param_integer(query, param, default_val) {
    var spec;
    var val;

    spec = query[param];
    if (spec === undefined) {
        return default_val;
    } else if (!spec.match(/^-?[0-9]+/)) {
        return null;
    } else {
        val = parseInt(spec, 10);
        return (isNaN(val)) ? null : val;
    }
}

/* Parse an address in the form "host:port". Returns an Object with
   keys "host" (String) and "port" (int). Returns null on error. */
function parse_addr_spec(spec) {
    var m, host, port;

    m = null;
    // IPv6 syntax.
    if (!m)
        m = spec.match(/^\[([\0-9a-fA-F:.]+)\]:([0-9]+)$/);
    // IPv4 syntax.
    if (!m)
        m = spec.match(/^([0-9.]+):([0-9]+)$/);
    if (!m)
        return null;
    host = m[1];
    port = parseInt(m[2], 10);
    if (isNaN(port) || port < 0 || port > 65535)
        return null;

    return { host: host, port: port }
}

exports.FlashProxy = function (settings) {
    settings = settings || {};
    this.proxy_pairs = [];
    this.fac_url = settings.fac_url || DEFAULT_FACILITATOR_URL;
    this.max_num_proxy_pairs = settings.max_num_proxy_pairs || DEFAULT_MAX_NUM_PROXY_PAIRS;
    this.initial_facilitator_poll_interval = settings.initial_facilitator_poll_interval || DEFAULT_INITIAL_FACILITATOR_POLL_INTERVAL;
    this.window = settings.window || window;

    this.start = function() {
        var client_addr;
        var relay_addr;

        setTimeout(this.proxy_main.bind(this), this.initial_facilitator_poll_interval * 1000);

        emit(this, "status", "started");
    };

    this.proxy_main = function() {
        var request;

        if (this.proxy_pairs.length >= this.max_num_proxy_pairs) {
            setTimeout(this.proxy_main.bind(this), this.facilitator_poll_interval * 1000);
            return;
        }
        emit(this, "debug", "Facilitator: connecting to " + this.fac_url + ".");
        _this = this;
        request = Request({
            url: _this.fac_url,
            onComplete: function(response) {
                if (response.status === 200) {
                    _this.fac_complete(response.text);
                } else {
                    emit(_this, 'warn', "Facilitator: can't connect: got status " + response.status + " and status text " + response.statusText + ".");;
                }
            },
        }).get();
    };

    this.fac_complete = function(text) {
        var response;
        var client_addr;
        var relay_addr;
        var poll_interval;

        response = querystring.parse(text);

        if (this.facilitator_poll_interval) {
            poll_interval = this.facilitator_poll_interval;
        } else {
            poll_interval = get_param_integer(response, "check-back-in", DEFAULT_FACILITATOR_POLL_INTERVAL);
            if (poll_interval === null) {
                emit(this, 'warn', "Error: can't parse polling interval from facilitator, " + poll_interval + ".");
                poll_interval = DEFAULT_FACILITATOR_POLL_INTERVAL;
            }
            if (poll_interval < MIN_FACILITATOR_POLL_INTERVAL)
                poll_interval = MIN_FACILITATOR_POLL_INTERVAL;
        }

        emit(this, 'debug', "Next check in " + poll_interval + " seconds.");
        setTimeout(this.proxy_main.bind(this), poll_interval * 1000);

        if (!response.client) {
            emit(this, 'debug', "No clients.");
            return;
        }
        client_addr = parse_addr_spec(response.client);
        if (client_addr === null) {
            emit(this, 'warn', "Error: can't parse client spec " + response.client + ".");
            return;
        }
        if (!response.relay) {
            emit(this, 'warn', "Error: missing relay in response.");
            return;
        }
        relay_addr = parse_addr_spec(response.relay);
        if (relay_addr === null) {
            emit(this, 'warn', "Error: can't parse relay spec " + response.relay + ".");
            return;
        }
        emit(this, "debug", "Facilitator: got client: " + response.client + " " + "relay:" + response.relay + ".");
        this.begin_proxy(client_addr, relay_addr);
    };

    this.begin_proxy = function(client_addr, relay_addr) {
        /* Start two proxy connections because of some versions of Tor making
           two pt connections:
           https://lists.torproject.org/pipermail/tor-dev/2012-December/004221.html */
        this.make_proxy_pair(client_addr, relay_addr);
        this.make_proxy_pair(client_addr, relay_addr);
    };

    this.make_proxy_pair = function(client_addr, relay_addr) {
        var proxy_pair;

        proxy_pair = new ProxyPair(client_addr, relay_addr, this.window);
        this.proxy_pairs.push(proxy_pair);
        proxy_pair.complete_callback = function(event) {
            emit(this, 'debug', "Complete.");
            /* Delete from the list of active proxy pairs. */
            this.proxy_pairs.splice(this.proxy_pairs.indexOf(proxy_pair), 1);
            emit(this, 'status', 'proxyEnd');
        }.bind(this);
        try {
            proxy_pair.connect();
        } catch (err) {
            emit(this, 'warn', "ProxyPair: exception while connecting: " + err.message + ".");
            this.die();
            return;
        }
        emit(this, 'status', 'proxyBegin');
    };

    this.die = function() {
        emit(this, 'warn', "Dying.");
        emit(this, 'status', 'die');
    };
}

/* An instance of a client-relay connection. */
function ProxyPair(client_addr, relay_addr, window) {
    var MAX_BUFFER = 10 * 1024 * 1024;

    this.client_addr = client_addr;
    this.relay_addr = relay_addr;

    this.c2r_schedule = [];
    this.r2c_schedule = [];

    this.running = true;
    this.flush_timeout_id = null;
    
    this.window = window;

    /* This callback function can be overridden by external callers. */
    this.complete_callback = function() {
    };

    /* Return a function that shows an error message and closes the other
       half of a communication pair. */
    this.make_onerror_callback = function(partner)
    {
        return function(event) {
            var ws = event.target;

            emit(this, 'warn', ws.label + ": error.");
            partner.close();
        }.bind(this);
    };

    this.onopen_callback = function(event) {
        var ws = event.target;

        emit(this, 'debug', ws.label + ": connected.");
    }.bind(this);

    this.onclose_callback = function(event) {
        var ws = event.target;

        emit(this, 'debug', ws.label + ": closed.");
        this.flush();

        if (this.running && is_closed(this.client_s) && is_closed(this.relay_s)) {
            this.running = false;
            this.complete_callback();
        }
    }.bind(this);

    this.onmessage_client_to_relay = function(event) {
        this.c2r_schedule.push(event.data);
        this.flush();
    }.bind(this);

    this.onmessage_relay_to_client = function(event) {
        this.r2c_schedule.push(event.data);
        this.flush();
    }.bind(this);
    
    this.make_websocket = function (addr) {
        var ws = new this.window.WebSocket('ws://' + addr.host + ':' + addr.port + '/');
        ws.binaryType = "arraybuffer";
        return ws;
    };

    this.connect = function() {
        emit(this, 'debug', "Client: connecting.");
        this.client_s = this.make_websocket(this.client_addr);

        emit(this, 'debug', "Relay: connecting.");
        this.relay_s = this.make_websocket(this.relay_addr);

        this.client_s.label = "Client";
        this.client_s.onopen = this.onopen_callback;
        this.client_s.onclose = this.onclose_callback;
        this.client_s.onerror = this.make_onerror_callback(this.relay_s);
        this.client_s.onmessage = this.onmessage_client_to_relay;

        this.relay_s.label = "Relay";
        this.relay_s.onopen = this.onopen_callback;
        this.relay_s.onclose = this.onclose_callback;
        this.relay_s.onerror = this.make_onerror_callback(this.client_s);
        this.relay_s.onmessage = this.onmessage_relay_to_client;
    };

    function is_open(ws)
    {
        return ws.readyState === ws.OPEN;
    }

    function is_closed(ws)
    {
        return ws.readyState === ws.CLOSED;
    }

    this.close = function() {
        this.client_s.close();
        this.relay_s.close();
    };

    /* Send as much data as the rate limit currently allows. */
    this.flush = function() {
        var busy;

        if (this.flush_timeout_id)
            clearTimeout(this.flush_timeout_id);
        this.flush_timeout_id = null;

        busy = true;
        while (busy) {
            var chunk;

            busy = false;
            if (is_open(this.client_s) && this.client_s.bufferedAmount < MAX_BUFFER && this.r2c_schedule.length > 0) {
                chunk = this.r2c_schedule.shift();
                this.client_s.send(chunk);
                busy = true;
            }
            if (is_open(this.relay_s) && this.relay_s.bufferedAmount < MAX_BUFFER && this.c2r_schedule.length > 0) {
                chunk = this.c2r_schedule.shift();
                this.relay_s.send(chunk);
                busy = true;
            }
        }

        if (is_closed(this.relay_s) && !is_closed(this.client_s) && this.client_s.bufferedAmount === 0 && this.r2c_schedule.length === 0) {
            emit(this, 'debug', "Client: closing.");
            this.client_s.close();
        }
        if (is_closed(this.client_s) && !is_closed(this.relay_s) && this.relay_s.bufferedAmount === 0 && this.c2r_schedule.length === 0) {
            emit(this, 'debug', "Relay: closing.");
            this.relay_s.close();
        }

        if (this.r2c_schedule.length > 0 || this.client_s.bufferedAmount > 0
            || this.c2r_schedule.length > 0 || this.relay_s.bufferedAmount > 0)
            this.flush_timeout_id = setTimeout(this.flush.bind(this), 0);
    };
}
