import { supabase } from './supabase';
import { Order, OrderItem, OrderStatus } from '../types';
import { productService } from './productService';
import { inventoryService } from './inventoryService';

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

    async getByOrderNumber(orderNumber: string) {
        // Remove # if present
        const searchNum = orderNumber.replace('#', '');

        const { data, error } = await supabase
            .from('orders')
            .select(`
        *,
        items:order_items(*)
      `)
            .eq('order_number', searchNum)
            .single();

        if (error) throw error;
        return mapOrderFromDB(data);
    },

    async update(id: string, updates: Partial<Order>) {
        // Logic to handle Inventory Deduction
        if (updates.status === OrderStatus.FINISHED) {
            try {
                const order = await this.getById(id);
                // 1. Iterate over sold products
                for (const item of order.items) {
                    // 2. Get Recipe for each product
                    const recipe = await productService.getRecipe(item.productId);

                    // 3. Deduct each material
                    for (const recipeItem of recipe) {
                        const amountToDeduct = item.quantity * recipeItem.quantityRequired;

                        // Fetch current stock (safe fetch)
                        const inventoryItem = (await inventoryService.getAll()).find(i => i.id === recipeItem.inventoryItemId);

                        if (inventoryItem) {
                            const newQty = Math.max(0, inventoryItem.quantity - amountToDeduct);
                            await inventoryService.updateQuantity(inventoryItem.id, newQty);
                            console.log(`[Inventory] Deducted ${amountToDeduct} ${inventoryItem.unit} of ${inventoryItem.name}`);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to deduct inventory:", error);
            }
        }

        const dbUpdates = mapOrderToDB(updates as Order);
        const { data, error } = await supabase
            .from('orders')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
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
    clientName: dbItem.clients?.name || dbItem.client_name || 'Cliente Desconhecido', // Fallback
    status: dbItem.status,
    paymentStatus: dbItem.payment_status as any,
    origin: dbItem.origin, // Mapping origin
    orderType: dbItem.order_type,
    totalValue: dbItem.total_value,
    amountPaid: dbItem.amount_paid,
    createdAt: dbItem.created_at,
    deliveryDate: dbItem.delivery_date,
    notes: dbItem.notes,
    internalNotes: dbItem.internal_notes,
    delayReason: dbItem.delay_reason,
    fiscalKey: dbItem.fiscal_key,
    clientTeam: dbItem.client_team,
    items: dbItem.items?.map(mapOrderItemFromDB) || []
});

const mapOrderToDB = (appItem: Partial<Order>) => {
    const dbItem: any = {};
    if (appItem.orderNumber) dbItem.order_number = appItem.orderNumber;
    if (appItem.clientId) dbItem.client_id = appItem.clientId;
    if (appItem.clientName) dbItem.client_name = appItem.clientName; // Ensure name is saved if present
    if (appItem.status) dbItem.status = appItem.status;
    if (appItem.paymentStatus) dbItem.payment_status = appItem.paymentStatus;
    if (appItem.origin) dbItem.origin = appItem.origin; // Save origin
    if (appItem.orderType) dbItem.order_type = appItem.orderType;
    if (appItem.totalValue) dbItem.total_value = appItem.totalValue;
    if (appItem.amountPaid !== undefined) dbItem.amount_paid = appItem.amountPaid;
    if (appItem.deliveryDate) dbItem.delivery_date = appItem.deliveryDate;
    if (appItem.notes) dbItem.notes = appItem.notes;
    if (appItem.internalNotes) dbItem.internal_notes = appItem.internalNotes;
    if (appItem.delayReason) dbItem.delay_reason = appItem.delayReason;
    if (appItem.fiscalKey) dbItem.fiscal_key = appItem.fiscalKey;
    if (appItem.clientTeam) dbItem.client_team = appItem.clientTeam;
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
