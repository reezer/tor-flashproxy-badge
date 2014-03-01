var data = require("sdk/self").data;
exports.proxyPanel = require("sdk/panel").Panel({
  id: "proxyPanel",
    label: "Tor Flashproxy Panel",
    width: 300,
    height: 220,
    contentURL: data.url("proxyPanel.html")
});

