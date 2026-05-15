(function() {
    if (sessionStorage.getItem('mcl_cleaned')) return;
    sessionStorage.setItem('mcl_cleaned', '1');
    var limpos = false;
    if ('caches' in window) {
        caches.keys().then(function(nomes) {
            if (nomes.length > 0) {
                Promise.all(nomes.map(function(n) { return caches.delete(n); })).then(function() {
                    limpos = true;
                    if ('serviceWorker' in navigator) {
                        navigator.serviceWorker.getRegistrations().then(function(regs) {
                            Promise.all(regs.map(function(r) { return r.unregister(); })).then(function() {
                                window.location.reload(true);
                            });
                        });
                    } else {
                        window.location.reload(true);
                    }
                });
            } else if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(regs) {
                    if (regs.length > 0) {
                        Promise.all(regs.map(function(r) { return r.unregister(); })).then(function() {
                            window.location.reload(true);
                        });
                    }
                });
            }
        });
    } else if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(regs) {
            if (regs.length > 0) {
                Promise.all(regs.map(function(r) { return r.unregister(); })).then(function() {
                    window.location.reload(true);
                });
            }
        });
    }
})();