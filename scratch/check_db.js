
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gnhsfrwixhhcdsbyyqhg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduaHNmcndpeGhoY2RzYnl5cWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMTcwOTAsImV4cCI6MjA4ODU5MzA5MH0.ff0jyDlmN-Er6Pykp2BGt3wNNYMsv5sYNv6K5vX4w38';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSupport() {
    console.log('Checking suporte table...');
    const { data, error, count } = await supabase
        .from('suporte')
        .select('*', { count: 'exact' });

    if (error) {
        console.error('Error fetching suporte:', error.message);
    } else {
        console.log('Total tickets in suporte:', count);
        console.log('Data sample:', data.slice(0, 2));
    }

    console.log('\nChecking viagens table...');
    const { data: vData, error: vError, count: vCount } = await supabase
        .from('viagens')
        .select('*', { count: 'exact' });

    if (vError) {
        console.error('Error fetching viagens:', vError.message);
    } else {
        console.log('Total viagens:', vCount);
    }
}

checkSupport();
