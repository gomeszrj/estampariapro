import { supabase } from './services/supabase';

async function test() {
    const { data: cols, error: err } = await supabase
        .rpc('get_schema_info') || await supabase.from('order_items').select('*').limit(1);
    
    // Actually let's just insert a fake item to test constraints
    const { data, error } = await supabase.from('order_items').insert({
        order_id: '00000000-0000-0000-0000-000000000000', // invalid but we'll see the error
        product_id: null,
        product_name: "ARTE CAMISA",
        fabric_id: null,
        fabric_name: "Não especificado",
        grade_label: "MASCULINO",
        size: "ESP2",
        quantity: 1,
        unit_price: 35
    }).select();

    console.log(error);
}

test();
