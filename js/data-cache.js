(function () {
    const CACHE_PREFIX = 'mcls_cache_';
    const DEFAULTS = {
        TTL: 5 * 60 * 1000,
        KEY_DRIVERS: 'drivers',
        KEY_ADS: 'ads',
        KEY_BLOG: 'blog',
        KEY_USER: 'user_profile'
    };

    function get(key) {
        try {
            const raw = localStorage.getItem(CACHE_PREFIX + key);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (Date.now() > parsed.expires) {
                localStorage.removeItem(CACHE_PREFIX + key);
                return null;
            }
            return parsed.data;
        } catch { return null }
    }

    function set(key, data, ttl) {
        try {
            const payload = { data, expires: Date.now() + (ttl || DEFAULTS.TTL) };
            localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(payload));
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                prune();
                try { localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(payload)) } catch {}
            }
        }
    }

    function remove(key) {
        localStorage.removeItem(CACHE_PREFIX + key);
    }

    function prune() {
        const now = Date.now();
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_PREFIX)) {
                try {
                    const parsed = JSON.parse(localStorage.getItem(key));
                    if (now > parsed.expires) localStorage.removeItem(key);
                } catch { localStorage.removeItem(key) }
            }
        }
    }

    function clear() {
        const toRemove = [];
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_PREFIX)) toRemove.push(key);
        }
        toRemove.forEach(k => localStorage.removeItem(k));
    }

    async function fetchAndCache(supabasePromise, cacheKey, ttl) {
        const cached = get(cacheKey);
        if (cached) {
            supabasePromise.then(result => {
                if (result.data) set(cacheKey, result.data, ttl);
            }).catch(() => {});
            return cached;
        }
        const result = await supabasePromise;
        if (result.data) set(cacheKey, result.data, ttl);
        return result.data || [];
    }

    window.DataCache = { get, set, remove, clear, prune, fetchAndCache, KEYS: DEFAULTS };
})();
