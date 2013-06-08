var log = document.getElementById('flashproxy-badge');

var observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    for (var node of mutation.addedNodes) {
      self.port.emit("msg", node.textContent.trim());
    }
  });   
});
  
observer.observe(log, {childList: true});
