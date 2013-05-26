const data = require("sdk/self").data
const { on, once, off, emit } = require('sdk/event/core');
const FlashProxy = require("./flashproxy").FlashProxy;
const hiddenFrames = require("sdk/frame/hidden-frame");

var conncount = 0;

var proxyPanel = require("sdk/panel").Panel({
  id: "proxyPanel",
    label: "Tor Flashproxy Panel",
    width: 300,
    height: 220,
    contentURL: data.url("proxyPanel.html")
});

var proxyBtn = require("widget").Widget({
  id: "proxyBtn",
    label: "Tor Flashproxy Badge",
    contentURL: data.url("inactive.png"),
    panel: proxyPanel
});


let hiddenFrame = hiddenFrames.add(hiddenFrames.HiddenFrame({
  onReady: function() {
    fp = new FlashProxy({window: this.element.contentWindow});
    on(fp, "warn", function(msg){
      console.warn(msg);
    });
    on(fp, "debug", function(msg){
      console.log(msg);
    });
    on(fp, "status", function(status){
      if (status === "proxyEnd"){
        if (fp.proxy_pairs.length === 0) {
          proxyBtn.contentURL = data.url("inactive.png");
          proxyPanel.port.emit("msg", "status", "up and running, waiting for connections");
        }
      }
      else if (status === "proxyBegin") {
        connected = true;
        proxyBtn.contentURL = data.url("active.png");
        conncount++;
        proxyPanel.port.emit("msg", "connections", conncount / 2); // Hack because two connections will be opened
        proxyPanel.port.emit("msg", "status", "serving a client right now");
      }
      else if (status === "die") {
        proxyPanel.port.emit("msg", "status", "having a problem. If you keep reading this after browser restart, please report this");
        proxyBtn.contentURL = data.url("error.png");
      }
      else if (status === "started") {
        proxyPanel.port.emit("msg", "status", "running and waiting for connections");
      }
      else {
        console.error('Got unknown status "' + status + '". This should NEVER happen!');
      }
    });
    fp.start();
  }
}));
