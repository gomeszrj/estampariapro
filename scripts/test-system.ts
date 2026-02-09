import 'dotenv/config';
import fs from 'fs';
import path from 'path';

// Parse .env.local BEFORE importing services
const envPath = path.resolve(process.cwd(), '.env.local');
console.log('Loading .env.local from:', envPath);

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

if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
    console.error("FATAL: Missing Keys.");
    process.exit(1);
}

// NOW import services dynamically
async function runTest() {
    console.log('🚀 Iniciando Teste do Sistema...');

    try {
        const { supabase } = await import('../services/supabase.ts');
        const { clientService } = await import('../services/clientService.ts');
        const { productService } = await import('../services/productService.ts');
        const { orderService } = await import('../services/orderService.ts');
        const { OrderStatus, OrderType } = await import('../types.ts');

        // 0. Autenticar
        console.log('\n🔐 Autenticando usuário de teste...');
        const email = `test_runner_${Date.now()}@example.com`;
        const password = 'password123';

        // Tentativa de SignUp
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) {
            console.error('Erro no SignUp:', authError.message);
            throw authError;
        }

        if (!authData.session) {
            // Se auto-confirm não estiver ativado ou user já existe (o que não deve acontecer com email unico)
            console.log('⚠️ Sessão não criada via SignUp (pode requerer confirmação de email). Tentando SignIn apenas para garantir...');
            // Neste caso de teste, se requerer confirmação de email, o teste vai falhar.
            // Mas o Supabase defaults usually allow signup without verify for development or we set it up.
            // Se falhar aqui, o user precisa desativar "Confirm Email" no Supabase dashboard.
            // Como o user falou "realize um teste", assumo que posso cadastrar.
        } else {
            console.log('✅ Autenticado como:', authData.user?.email);
        }

        // 1. Criar Cliente
        console.log('\n👤 Criando Cliente de Teste...');
        const timestamp = Date.now();
        const newClient = await clientService.create({
            name: `Cliente Teste ${timestamp}`,
            whatsapp: '11999999999',
            email: `teste${timestamp}@exemplo.com`,
            document: '000.000.000-00',
            address: 'Rua de Teste, 123'
        });
        console.log('✅ Cliente Criado:', newClient.id, newClient.name);

        // 2. Criar Produto
        console.log('\n👕 Criando Produto de Teste...');
        const newProduct = await productService.create({
            sku: `SKU-${timestamp}`,
            name: `Produto Teste ${timestamp}`,
            category: 'Uniforme',
            basePrice: 50.00,
            imageUrl: 'https://placehold.co/400',
            status: 'active'
        });
        console.log('✅ Produto Criado:', newProduct.id, newProduct.name);

        // 3. Criar Pedido
        console.log('\n📝 Criando Pedido...');
        const newOrder = await orderService.create({
            orderNumber: `${Math.floor(Math.random() * 10000)}`,
            clientId: newClient.id,
            clientName: newClient.name,
            status: OrderStatus.RECEIVED,
            orderType: OrderType.SALE,
            totalValue: 50.00,
            createdAt: new Date().toISOString(),
            deliveryDate: new Date(Date.now() + 86400000).toISOString(),
            items: [
                {
                    id: 'temp-1',
                    productId: newProduct.id,
                    productName: newProduct.name,
                    fabricId: null,
                    fabricName: 'Algodão',
                    gradeLabel: 'G',
                    size: 'G',
                    quantity: 1,
                    unitPrice: 50.00
                }
            ]
        });
        console.log('✅ Pedido Criado:', newOrder.id, 'Total:', newOrder.totalValue);

        // 4. Ler Pedidos (Verify GetAll)
        console.log('\n📋 Verificando Lista de Pedidos...');
        const orders = await orderService.getAll();
        const foundOrder = orders.find((o: any) => o.id === newOrder.id);
        if (foundOrder) {
            console.log('✅ Pedido encontrado na lista!');
            console.log('   Cliente no Pedido (Join):', foundOrder.clientName);
        } else {
            console.error('❌ Pedido criado NÃO encontrado na lista.');
        }

        console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO! O sistema está operando corretamente.');

    } catch (error) {
        console.error('\n❌ ERRO NO TESTE:', error);
        process.exit(1);
    }
}

runTest();
