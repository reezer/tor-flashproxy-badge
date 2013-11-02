var data = require("sdk/self").data;
var hiddenFrames = require("sdk/frame/hidden-frame");

var conntotal = 0;
var connactive = 0;

// force cookie creation to ensure maximum compatibility
// (users might have manually set a cookie which disabled the proxy
// on the script's options page)
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
  contentURL: "http://crypto.stanford.edu/flashproxy/embed.html?debug",
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
    panel: proxyPanel,
    tooltip: "Tor Flashproxy Badge\n" + "Active: 0, Total: 0"
});

proxyBtn.updateTooltip = function() {
  this.tooltip = "Tor Flashproxy Badge\n" + "Active: " + connactive + ", Total: " + conntotal;
}

// Log and parse messages
fp.port.on("msg", function(msg) {
  console.log(msg);
  if (msg === "Relay: connecting.") {
    connactive++;
    proxyBtn.contentURL = data.url("active.png");
    proxyPanel.port.emit("status", "connecting");
  }
  else if (msg === "Relay: closed.") {
    connactive--;
    proxyBtn.updateTooltip();
    if (connactive === 0) {
      proxyBtn.contentURL = data.url("inactive.png");
      proxyPanel.port.emit("status", "waiting");
    }
  }
  else if (msg === "Relay: connected.") {
    conntotal++;
    proxyBtn.updateTooltip();
    proxyPanel.port.emit("connections", conntotal);
  } else if (msg === "Dying.") {
    proxyPanel.port.emit("status", "error");
    proxyBtn.contentURL = data.url("error.png");
  } else if (msg.indexOf("Starting") === 0) {
    proxyPanel.port.emit("status", "starting");
  }
});
