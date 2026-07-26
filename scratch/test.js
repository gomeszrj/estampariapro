import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mdpsrbmfzaosuvhamvbs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kcHNyYm1memFvc3V2aGFtdmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNTkxNjgsImV4cCI6MjA4NDkzNTE2OH0.FieQkWGUZ-iRx6XHqk8vNaa9NnNuPtkSFn6f7W5vO_U';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    try {
        const { data, error } = await supabase.from('order_items').select('*').limit(1);
        console.log("DATA:", JSON.stringify(data, null, 2));
        if (error) console.log("ERROR:", error);
    } catch (e) {
        console.log("EXCEPTION:", e);
    }
}
run();
