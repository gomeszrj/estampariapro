const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://mdpsrbmfzaosuvhamvbs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kcHNyYm1memFvc3V2aGFtdmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNTkxNjgsImV4cCI6MjA4NDkzNTE2OH0.FieQkWGUZ-iRx6XHqk8vNaa9NnNuPtkSFn6f7W5vO_U';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    const { data, error } = await supabase.from('order_items').select('*').limit(1);
    console.log(JSON.stringify({ data, error }, null, 2));
}
run();
