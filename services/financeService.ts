import { supabase } from './supabase';
import { Transaction } from '../types';

export const financeService = {
    async getAll(startDate?: string, endDate?: string) {
        let query = supabase
            .from('transactions')
            .select('*')
            .order('date', { ascending: false });

        if (startDate) query = query.gte('date', startDate);
        if (endDate) query = query.lte('date', endDate);

        const { data, error } = await query;
        if (error) throw error;
        return data?.map(mapTransactionFromDB) as Transaction[];
    },

    async create(transaction: Omit<Transaction, 'id' | 'createdAt'>) {
        const dbItem = mapTransactionToDB(transaction);
        const { data, error } = await supabase
            .from('transactions')
            .insert([dbItem])
            .select()
            .single();

        if (error) throw error;
        return mapTransactionFromDB(data);
    },

    async getBalance() {
        // Simplified Balance: Sum of all transactions
        const { data, error } = await supabase
            .from('transactions')
            .select('type, amount');

        if (error) throw error;

        const balance = data.reduce((acc, curr) => {
            return curr.type === 'income' ? acc + curr.amount : acc - curr.amount;
        }, 0);

        return balance;
    }
};

const mapTransactionFromDB = (dbItem: any): Transaction => ({
    id: dbItem.id,
    type: dbItem.type,
    category: dbItem.category,
    amount: dbItem.amount,
    description: dbItem.description,
    date: dbItem.date,
    orderId: dbItem.order_id,
    createdAt: dbItem.created_at
});

const mapTransactionToDB = (appItem: Partial<Transaction>) => {
    const dbItem: any = {};
    if (appItem.type) dbItem.type = appItem.type;
    if (appItem.category) dbItem.category = appItem.category;
    if (appItem.amount) dbItem.amount = appItem.amount;
    if (appItem.description) dbItem.description = appItem.description;
    if (appItem.date) dbItem.date = appItem.date;
    if (appItem.orderId) dbItem.order_id = appItem.orderId;
    return dbItem;
};
