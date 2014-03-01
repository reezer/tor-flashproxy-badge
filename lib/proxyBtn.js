var data = require("sdk/self").data;
var proxyPanel = require("./proxyPanel").proxyPanel;
exports.proxyBtn = require("sdk/widget").Widget({
  id: "proxyBtn",
    label: "Tor Flashproxy Badge",
    contentURL: data.url("inactive.png"),
    panel: proxyPanel,
    tooltip: "Tor Flashproxy Badge\n" + "Active: 0, Total: 0"
});

exports.proxyBtn.updateTooltip = function() {
  this.tooltip = "Tor Flashproxy Badge\n" + "Active: " + connactive + ", Total: " + conntotal;
}
