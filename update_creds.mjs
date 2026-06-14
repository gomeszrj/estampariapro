import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const urlB64 = process.env.VITE_APP_S_URL;
const keyB64 = process.env.VITE_APP_S_KEY;

if (!urlB64 || !keyB64) {
    console.error("Missing Supabase env vars");
    process.exit(1);
}

const supabaseUrl = Buffer.from(urlB64, 'base64').toString('utf-8');
const supabaseKey = Buffer.from(keyB64, 'base64').toString('utf-8');

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateSettings() {
    const { data, error } = await supabase.from('settings').select('*');
    if (error) {
        console.error("Error fetching settings:", error);
        return;
    }
    
    if (data && data.length > 0) {
        // Let's update all settings records with this new api key because we don't know the user's specific id from here.
        for (const row of data) {
            const updateRes = await supabase.from('settings').update({
                evolution_api_url: 'http://localhost:8080',
                evolution_api_key: '8934E33F0B88-4A11-BB3B-1FFBBFF0AE50',
                evolution_instance_name: 'GMZ PERFORMACE ATENDIMENTO'
            }).eq('id', row.id);
            console.log(`Updated setting ${row.id}:`, updateRes.status === 204 ? 'OK' : updateRes);
        }
    } else {
        console.log("No settings found to update.");
    }
}

updateSettings();
