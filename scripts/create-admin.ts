import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load env vars
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split(/\r?\n/).forEach(line => {
        if (!line.trim()) return;
        const firstEq = line.indexOf('=');
        if (firstEq > 0) {
            const key = line.substring(0, firstEq).trim();
            let value = line.substring(firstEq + 1).trim();
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            process.env[key] = value;
        }
    });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase keys");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdmin() {
    const email = 'admin@estamparia.com';
    const password = 'admin123';

    console.log(`Creating user: ${email}...`);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        console.error('Error creating user:', error.message);
    } else {
        console.log('✅ User created successfully!');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('User ID:', data.user?.id);

        if (!data.session) {
            console.log('⚠️ Note: Session not created immediately. Please check if email confirmation is required in your Supabase project settings.');
        }
    }
}

createAdmin();
