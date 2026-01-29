import { supabase } from './supabase';
import { Order, OrderItem } from '../types';

export const orderService = {
    async getAll() {
        const { data, error } = await supabase
            .from('orders')
            .select(`
        *,
        items:order_items(*),
        clients(name)
      `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data?.map(mapOrderFromDB) as Order[];
    },

    async create(order: Omit<Order, 'id'>) {
        // 1. Create Order
        const dbOrder = mapOrderToDB(order);
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert([dbOrder])
            .select()
            .single();

        if (orderError) throw orderError;

        // 2. Create Items
        if (order.items && order.items.length > 0) {
            const dbItems = order.items.map(item => ({
                ...mapOrderItemToDB(item),
                order_id: orderData.id
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(dbItems);

            if (itemsError) throw itemsError;
        }

        return this.getById(orderData.id);
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('orders')
            .select(`
        *,
        items:order_items(*)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return mapOrderFromDB(data);
    },

    async update(id: string, updates: Partial<Order>) {
        // Note: Updating items is complex (sync/diff). For now we assume updating header fields mostly
        // Or we delete all items and re-insert if items match.
        // For this MVP, we'll implement header update. Full update requires more logic.
        const dbUpdates = mapOrderToDB(updates as Order);
        const { data, error } = await supabase
            .from('orders')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // If items are present in updates, we might need to handle them.
        // Simplifying for now to just return the updated order header + existing items
        return this.getById(id);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('orders')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

// Mappers
const mapOrderFromDB = (dbItem: any): Order => ({
    id: dbItem.id,
    orderNumber: dbItem.order_number,
    clientId: dbItem.client_id,
    clientName: dbItem.clients?.name || 'Cliente Desconhecido',
    // Wait, my migration didn't enforce client_name in orders table, I should check schema.
    // Schema: client_id uuid references clients(id).
    // So I need to fetch client name via join or store it.
    // Let's check my migration in step 64.
    // "client_id uuid references clients(id)"
    // I did NOT add client_name to orders table in migration.
    // So I need to select clients(name) in the query.
    // Updating query in getAll above.
    status: dbItem.status,
    paymentStatus: dbItem.payment_status as any, // Cast or ensure Enum match
    orderType: dbItem.order_type,
    totalValue: dbItem.total_value,
    createdAt: dbItem.created_at,
    deliveryDate: dbItem.delivery_date,
    notes: dbItem.notes,
    internalNotes: dbItem.internal_notes,
    delayReason: dbItem.delay_reason,
    fiscalKey: dbItem.fiscal_key,
    items: dbItem.items?.map(mapOrderItemFromDB) || []
});

const mapOrderToDB = (appItem: Partial<Order>) => {
    const dbItem: any = {};
    if (appItem.orderNumber) dbItem.order_number = appItem.orderNumber;
    if (appItem.clientId) dbItem.client_id = appItem.clientId;
    if (appItem.status) dbItem.status = appItem.status;
    if (appItem.paymentStatus) dbItem.payment_status = appItem.paymentStatus;
    if (appItem.orderType) dbItem.order_type = appItem.orderType;
    if (appItem.totalValue) dbItem.total_value = appItem.totalValue;
    if (appItem.deliveryDate) dbItem.delivery_date = appItem.deliveryDate;
    if (appItem.notes) dbItem.notes = appItem.notes;
    if (appItem.internalNotes) dbItem.internal_notes = appItem.internalNotes;
    if (appItem.delayReason) dbItem.delay_reason = appItem.delayReason;
    if (appItem.fiscalKey) dbItem.fiscal_key = appItem.fiscalKey;
    return dbItem;
};

const mapOrderItemFromDB = (dbItem: any): OrderItem => ({
    id: dbItem.id,
    productId: dbItem.product_id,
    productName: dbItem.product_name,
    fabricId: dbItem.fabric_id,
    fabricName: dbItem.fabric_name,
    gradeLabel: dbItem.grade_label,
    size: dbItem.size,
    quantity: dbItem.quantity,
    unitPrice: dbItem.unit_price
});

const mapOrderItemToDB = (appItem: OrderItem) => ({
    product_id: appItem.productId === 'p-custom' ? null : appItem.productId, // Handle ad-hoc items
    product_name: appItem.productName,
    fabric_id: appItem.fabricId === 'f-custom' ? null : appItem.fabricId,
    fabric_name: appItem.fabricName,
    grade_label: appItem.gradeLabel,
    size: appItem.size,
    quantity: appItem.quantity,
    unit_price: appItem.unitPrice
});
