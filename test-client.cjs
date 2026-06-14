const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mdpsrbmfzaosuvhamvbs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kcHNyYm1memFvc3V2aGFtdmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNTkxNjgsImV4cCI6MjA4NDkzNTE2OH0.FieQkWGUZ-iRx6XHqk8vNaa9NnNuPtkSFn6f7W5vO_U';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const payload = {
        name: "Test Client",
        whatsapp: "1234567890",
        email: "test@example.com",
        document: "",
        address: "",
        password: "123"
    };
    
    console.log("Attempting to insert:", payload);
    const { data, error } = await supabase.from('clients').insert([payload]);
    
    if (error) {
        console.error("SUPABASE ERROR:", JSON.stringify(error, null, 2));
    } else {
        console.log("SUCCESS:", data);
        await supabase.from('clients').delete().eq('email', 'test@example.com');
    }
}

test();
