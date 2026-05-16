// URL e Anon Key do seu projeto Supabase
const SUPABASE_URL = 'https://gnhsfrwixhhcdsbyyqhg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduaHNmcndpeGhoY2RzYnl5cWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMTcwOTAsImV4cCI6MjA4ODU5MzA5MH0.ff0jyDlmN-Er6Pykp2BGt3wNNYMsv5sYNv6K5vX4w38';

// Inicializa o cliente do Supabase com persistência de sessão
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: localStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

// Função utilitária global para padronização de IDs (Legado -> UUID)
window._toUUID = function (id) {
    if (!id) return id;
    var s = String(id);
    if (s.length === 36 && s.indexOf('-') > 0) return s;
    var hex = s.replace(/[^0-9a-fA-F]/g, '');
    if (hex.length === 32) return hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20,32);
    hex = hex.padEnd(32, '0').slice(0, 32);
    return hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20,32);
};

