var data = require("sdk/self").data;
var hiddenFrames = require("sdk/frame/hidden-frame");

var proxyPanel = require("./proxyPanel.js").proxyPanel;
var FP = require("./fp").FP;

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

var fp = new FP;
proxyPanel.port.on("restart", function() {
  fp.destroy();
  fp = new FP;
});

