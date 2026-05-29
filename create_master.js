const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = Buffer.from(process.env.VITE_APP_S_URL || '', 'base64').toString('ascii').trim();
const supabaseKey = Buffer.from(process.env.VITE_APP_S_KEY || '', 'base64').toString('ascii').trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function createMaster() {
  console.log("Iniciando cadastro do Master...");

  try {
    // 1. Procurar ou criar o Tenant
    let { data: tenant } = await supabase.from('tenants').select('id').eq('domain', 'master').single();
    
    if (!tenant) {
      console.log("Tenant master não encontrado, criando...");
      const { data: newTenant, error: tErr } = await supabase.from('tenants').insert([{
        name: 'Master Estamparia Pro',
        domain: 'master',
        active: true,
        plan: 'Enterprise',
        billing_cycle: 'Anual'
      }]).select().single();
      
      if (tErr) throw new Error("Erro ao criar tenant: " + tErr.message);
      tenant = newTenant;
    }

    // 2. Criar ou encontrar o usuário
    console.log("Criando usuário no Auth...");
    let userId;
    const { data: adminData, error: authErr } = await supabase.auth.admin.createUser({
      email: 'master@estamparia.com',
      password: 'Master123!',
      email_confirm: true
    });

    if (authErr && authErr.message.includes('already registered')) {
       console.log("Usuário já existe, buscando ID...");
       const { data: usersData } = await supabase.auth.admin.listUsers();
       const existingUser = usersData.users.find(u => u.email === 'master@estamparia.com');
       userId = existingUser.id;
       // Forçar atualização da senha
       await supabase.auth.admin.updateUserById(userId, { password: 'Master123!' });
    } else if (authErr) {
       throw new Error("Erro Auth: " + authErr.message);
    } else {
       userId = adminData.user.id;
    }

    // 3. Atualizar Profile
    console.log("Atualizando profile para role='master'...");
    const { error: pErr } = await supabase.from('profiles').upsert({
      id: userId,
      tenant_id: tenant.id,
      role: 'master',
      full_name: 'Administrador Master',
      active: true
    });
    if (pErr) throw new Error("Erro profile: " + pErr.message);

    // 4. Inserir todas as permissões
    console.log("Concedendo todas as permissões...");
    const { error: permErr } = await supabase.from('user_permissions').upsert({
      profile_id: userId,
      tenant_id: tenant.id,
      can_view_dashboard: true, can_view_orders: true, can_view_kanban: true, can_view_art_queue: true,
      can_view_products: true, can_view_catalog: true, can_view_clients: true, can_view_crm: true,
      can_view_inventory: true, can_view_finance: true, can_view_settings: true,
      can_create_orders: true, can_edit_orders: true, can_delete_orders: true,
      can_move_kanban: true, can_manage_products: true, can_manage_clients: true,
      can_manage_inventory: true, can_manage_finance: true, can_manage_settings: true,
      can_view_store_manager: true, can_manage_store: true
    });
    if (permErr) throw new Error("Erro permissões: " + permErr.message);

    console.log("SUCESSO! master@estamparia.com cadastrado com senha: Master123!");
    
  } catch (e) {
    console.error("FALHA:", e);
  }
}

createMaster();
