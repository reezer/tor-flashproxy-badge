var data = require("sdk/self").data;
var proxyPanel = require("./proxyPanel").proxyPanel;
var proxyBtn = require("./proxyBtn").proxyBtn;

// Wrapper class for a hidden page containing a FlashProxy badge
exports.FP = function() {
  // The page we load the badge on
  this.page = require("sdk/page-worker").Page({
    contentURL: "http://crypto.stanford.edu/flashproxy/embed.html?debug",
    contentScriptFile: data.url("controller.js"),
    contentScriptWhen: "ready"
  });
  proxyBtn.contentURL = data.url("inactive.png");
  proxyPanel.port.emit("status", "waiting");

  // Wrap destructor method for cleaning up
  this.destroy = this.page.destroy

  // Log and parse messages
  this.page.port.on("msg", function(msg) {
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
}
