(function () {
    'use strict';
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function (registrations) {
            for (var i = 0; i < registrations.length; i++) {
                registrations[i].unregister();
                console.log('[SW] Service Worker desregistrado:', registrations[i].scope);
            }
        });
    }
})();
