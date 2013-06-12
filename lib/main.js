var data = require("sdk/self").data;
var hiddenFrames = require("sdk/frame/hidden-frame");

var conntotal = 0;
var connactive = 0;

let optionFrame = hiddenFrames.add(hiddenFrames.HiddenFrame({
  onReady: function() {
    this.element.contentWindow.location = "http://crypto.stanford.edu/";
    let self = this;
    this.element.addEventListener("DOMContentLoaded", function() {
      self.element.contentDocument.cookie = "flashproxy-allow=1";
      hiddenFrames.remove(self);
    }, true, true);
  }
}));

var fp = require("sdk/page-worker").Page({
  contentURL: "http://crypto.stanford.edu/flashproxy/embed.html?debug&initial_facilitator_poll_interval=3",
  contentScriptFile: data.url("controller.js"),
  contentScriptWhen: "ready"
});

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

// Log and parse messages
fp.port.on("msg", function(msg) {
  console.log(msg);
  if (msg.indexOf("Facilitator: got client:") === 0) {
    connactive++;
    conntotal++;
    proxyBtn.contentURL = data.url("active.png");
    proxyPanel.port.emit("msg", "connections", conntotal);
    proxyPanel.port.emit("msg", "status", "serving a client right now");
  }
  else if (msg === "Complete.") {
    connactive--;
    if (connactive === 0) {
      proxyBtn.contentURL = data.url("inactive.png");
      proxyPanel.port.emit("msg", "status", "up and running, waiting for connections");
    }
  } else if (msg === "Dying.") {
    proxyPanel.port.emit("msg", "status", "having a problem. If you keep reading this after browser restart, please report this");
    proxyBtn.contentURL = data.url("error.png");
  } else if (msg.indexOf("Starting") === 0) {
    proxyPanel.port.emit("msg", "status", "running and waiting for connections");
  }
});
