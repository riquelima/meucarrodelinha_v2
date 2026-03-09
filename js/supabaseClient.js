// URL e Anon Key do seu projeto Supabase
const SUPABASE_URL = 'https://gnhsfrwixhhcdsbyyqhg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduaHNmcndpeGhoY2RzYnl5cWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMTcwOTAsImV4cCI6MjA4ODU5MzA5MH0.ff0jyDlmN-Er6Pykp2BGt3wNNYMsv5sYNv6K5vX4w38';

// Inicializa o cliente do Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
