var data = require("sdk/self").data;
var { ToggleButton } = require("sdk/ui/button/toggle");
var { Panel } = require("sdk/panel")

proxyPanel = Panel({
  id: "proxyPanel",
  label: "Tor Flashproxy Panel",
  width: 300,
  height: 220,
  contentURL: data.url("proxyPanel.html"),
  onHide: handleHide
});

function handleHide() {
  proxyBtn.state('window', {checked: false});
}


proxyBtn = ToggleButton({
  id: "proxyBtn",
  label: "Tor Flashproxy Badge",
  icon: data.url("inactive.png"),
  tooltip: "Tor Flashproxy Badge\n" + "Active: 0, Total: 0",
  onChange: handleChange
});

function handleChange(state) {
    if (state.checked) {
      proxyPanel.show({
        position: this
      });
    }
}

proxyBtn.updateTooltip = function() {
  this.tooltip = "Tor Flashproxy Badge\n" + "Active: " + connactive + ", Total: " + conntotal;
}

exports.proxyPanel = proxyPanel;
exports.proxyBtn = proxyBtn;
