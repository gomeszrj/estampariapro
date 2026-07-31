import { createClient } from '@supabase/supabase-js';  
import * as dotenv from 'dotenv';  
import { resolve } from 'path';  
dotenv.config({ path: resolve(process.cwd(), '.env.local') });  
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);  
async function run() { const {data} = await supabase.from('products').select('name, allowed_grades'); console.log(JSON.stringify(data, null, 2)); }  
run();  
