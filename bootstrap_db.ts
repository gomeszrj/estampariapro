import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Parse .env.local BEFORE initializing
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

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mdpsrbmfzaosuvhamvbs.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function bootstrap() {
    console.log("🚀 Starting database bootstrap...");
    console.log("Supabase URL:", supabaseUrl);

    // 1. Create a Default Tenant
    const tenantId = '00000000-0000-0000-0000-000000000001'; // static UUID to be easy
    const tenantData = {
        id: tenantId,
        name: 'Minha Estamparia',
        domain: 'minha-estamparia',
        plan: 'premium',
        active: true,
        created_at: new Date().toISOString()
    };

    console.log("\n1. Bootstrapping Tenant...");
    const { data: tenant, error: tenantErr } = await supabase
        .from('tenants')
        .upsert([tenantData])
        .select()
        .single();

    if (tenantErr) {
        console.error("❌ Error upserting tenant:", tenantErr.message, tenantErr);
    } else {
        console.log("✅ Tenant bootstrapped successfully:", tenant);
    }

    // 2. Check if admin@estamparia.com is registered in Auth
    console.log("\n2. Checking Admin auth account...");
    const email = 'admin@estamparia.com';
    const password = 'admin123';

    // Sign up the admin
    const { data: authData, error: signupErr } = await supabase.auth.signUp({
        email,
        password
    });

    let adminUserId: string | undefined;

    if (signupErr) {
        console.log("Admin account signup error or already exists:", signupErr.message);
        // Try to sign in to get the user ID
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (signInErr) {
            console.error("❌ Failed to register or log in as admin:", signInErr.message);
        } else {
            adminUserId = signInData.user?.id;
            console.log("✅ Admin logged in successfully, User ID:", adminUserId);
        }
    } else {
        adminUserId = authData.user?.id;
        console.log("✅ Admin registered successfully, User ID:", adminUserId);
    }

    if (!adminUserId) {
        console.error("❌ Cannot proceed without admin user ID");
        return;
    }

    // 3. Create Profile for Admin
    console.log("\n3. Bootstrapping Admin Profile...");
    const profileData = {
        id: adminUserId,
        tenant_id: tenantId,
        full_name: 'Administrador Master',
        role: 'admin',
        created_at: new Date().toISOString()
    };

    const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .upsert([profileData])
        .select()
        .single();

    if (profileErr) {
        console.error("❌ Error upserting profile:", profileErr.message, profileErr);
    } else {
        console.log("✅ Admin Profile bootstrapped successfully:", profile);
    }

    // 4. Create default saas_plans if the table exists
    console.log("\n4. Bootstrapping Default SaaS Plans...");
    const defaultPlans = [
        { id: '1', name: 'Starter', price: 99 },
        { id: '2', name: 'Pro Plus', price: 199 },
        { id: '3', name: 'Enterprise', price: 399 }
    ];

    for (const plan of defaultPlans) {
        const { error: planErr } = await supabase.from('saas_plans').upsert([plan]);
        if (planErr) {
            console.log(`Note: Could not upsert plan ${plan.name} (table saas_plans might not exist or be structured differently):`, planErr.message);
        } else {
            console.log(`✅ SaaS Plan ${plan.name} bootstrapped`);
        }
    }

    console.log("\n🎉 BOOTSTRAP PROCESS FINISHED!");
}

bootstrap();
