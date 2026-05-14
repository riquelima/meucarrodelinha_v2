(function () {
    const PREFIX = 'mcls_cache_';
    const DEFAULTS = {
        TTL_STATIC: 30 * 60 * 1000,
        TTL_DYNAMIC: 2 * 60 * 1000,
        KEYS: {
            DRIVERS: 'drivers',
            ADS: 'ads',
            BLOG: 'blog',
            USER_PROFILE: 'user_profile',
            MESSAGES: 'messages',
            TRIPS: 'trips',
            NOTIFICATIONS: 'notifications',
        }
    };

    function get(key) {
        try {
            const raw = localStorage.getItem(PREFIX + key);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (Date.now() > parsed.expires) {
                localStorage.removeItem(PREFIX + key);
                return null;
            }
            return parsed.data;
        } catch { return null }
    }

    function set(key, data, ttl) {
        try {
            const payload = { data, expires: Date.now() + (ttl || DEFAULTS.TTL_STATIC) };
            localStorage.setItem(PREFIX + key, JSON.stringify(payload));
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                prune();
                try { localStorage.setItem(PREFIX + key, JSON.stringify(payload)) } catch {}
            }
        }
    }

    function remove(key) {
        localStorage.removeItem(PREFIX + key);
    }

    function prune() {
        const now = Date.now();
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && key.startsWith(PREFIX)) {
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
            if (key && key.startsWith(PREFIX)) toRemove.push(key);
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

    async function fetchFresh(supabasePromise, cacheKey, ttl) {
        const result = await supabasePromise;
        if (result.data) set(cacheKey, result.data, ttl);
        return result;
    }

    function invalidate(key) {
        remove(key);
    }

    function invalidateAll() {
        clear();
    }

    window.DataCache = {
        get, set, remove, clear, prune,
        fetchAndCache, fetchFresh,
        invalidate, invalidateAll,
        KEYS: DEFAULTS.KEYS,
        TTL: { STATIC: DEFAULTS.TTL_STATIC, DYNAMIC: DEFAULTS.TTL_DYNAMIC }
    };
})();
