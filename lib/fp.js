var data = require("sdk/self").data;
var { proxyPanel, proxyBtn } = require("./proxyWidgets.js");

// Wrapper class for a hidden page containing a FlashProxy badge
exports.FP = function() {
  // The page we load the badge on
  this.page = require("sdk/page-worker").Page({
    contentURL: "http://crypto.stanford.edu/flashproxy/embed.html?debug",
    //contentURL: "http://crypto.stanford.edu/flashproxy/embed.html?debug&facilitator=http://fsdfsffsd.om&initial_facilitator_poll_interval=2.0",
    contentScriptFile: data.url("controller.js"),
    contentScriptWhen: "ready"
  });
  proxyBtn.icon = data.url("inactive.png");
  proxyPanel.port.emit("status", "waiting");

  // Wrap destructor method for cleaning up
  this.destroy =  function() {
    this.page.destroy();
  }

  // Log and parse messages
  this.page.port.on("msg", function(msg) {
    //console.log(msg);
    if (msg === "Relay: connecting.") {
      connactive++;
      proxyBtn.icon = data.url("active.png");
      proxyPanel.port.emit("status", "connecting");
    }
    else if (msg === "Relay: closed.") {
      connactive--;
      proxyBtn.updateTooltip();
      if (connactive === 0) {
        proxyBtn.icon = data.url("inactive.png");
        proxyPanel.port.emit("status", "waiting");
      }
    }
    else if (msg === "Relay: connected.") {
      conntotal++;
      proxyBtn.updateTooltip();
      proxyPanel.port.emit("connections", conntotal);
    } else if (msg === "Dying.") {
      proxyPanel.port.emit("status", "error");
      proxyBtn.icon = data.url("error.png");
    } else if (msg.indexOf("Starting") >= 0) {
      proxyPanel.port.emit("status", "starting");
    } else if (msg.indexOf("Facilitator: can't connect") >= 0) {
      proxyPanel.port.emit("status", "error");
      proxyBtn.icon = data.url("error.png");
    }
  });
}
