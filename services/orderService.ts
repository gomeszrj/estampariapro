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
            .neq('origin', 'support')
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

        // --- NEW: Update Items ---
        if (updates.items) {
            // First, delete old items
            const { error: deleteError } = await supabase
                .from('order_items')
                .delete()
                .eq('order_id', id);

            if (deleteError) throw deleteError;

            // Then insert new ones
            if (updates.items.length > 0) {
                const dbItems = updates.items.map(item => ({
                    ...mapOrderItemToDB(item),
                    order_id: id
                }));

                const { error: insertError } = await supabase
                    .from('order_items')
                    .insert(dbItems);

                if (insertError) throw insertError;
            }
        }

        return this.getById(id);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('orders')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // --- CHAT MESSAGES ---
    async getMessages(orderId: string) {
        const { data, error } = await supabase
            .from('order_messages')
            .select('*')
            .eq('order_id', orderId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async getChatSessions() {
        // Fetch all messages to find orders with active chats
        // Since Supabase JS lacks a simple "Select Distinct Order ID with Message Count", 
        // we'll fetch messages and aggregate in JS for this scale.
        const { data: messages, error: msgError } = await supabase
            .from('order_messages')
            .select('*')
            .order('created_at', { ascending: false });

        if (msgError) throw msgError;
        if (!messages || messages.length === 0) return [];

        const sessionsMap = new Map<string, any>();
        for (const msg of messages) {
            if (!sessionsMap.has(msg.order_id)) {
                sessionsMap.set(msg.order_id, {
                    orderId: msg.order_id,
                    lastMessage: msg.message,
                    lastMessageAt: msg.created_at,
                    lastSender: msg.sender,
                    unread: 0 // In a complete system, we'd track read/unread status
                });
            }
        }

        // Get all Support Leads as well, even without messages
        const { data: supportLeads, error: leadsError } = await supabase
            .from('orders')
            .select('id, created_at')
            .eq('origin', 'support');

        if (leadsError) throw leadsError;

        if (supportLeads) {
            for (const lead of supportLeads) {
                if (!sessionsMap.has(lead.id)) {
                    sessionsMap.set(lead.id, {
                        orderId: lead.id,
                        lastMessage: '📝 Novo contato de suporte',
                        lastMessageAt: lead.created_at,
                        lastSender: 'client',
                        unread: 1
                    });
                }
            }
        }

        const activeOrderIds = Array.from(sessionsMap.keys());
        if (activeOrderIds.length === 0) return [];

        // Now fetch details for these orders
        const { data: dbOrders, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .in('id', activeOrderIds);

        if (ordersError) throw ordersError;

        // Combine the data
        const sessions = activeOrderIds.map(orderId => {
            const dbOrder = dbOrders?.find(o => o.id === orderId);
            const sessionData = sessionsMap.get(orderId);

            if (!dbOrder) return null;

            return {
                ...sessionData,
                clientName: dbOrder.client_name,
                orderNumber: dbOrder.order_number,
                status: dbOrder.status,
                origin: dbOrder.origin,
                assignedSeller: dbOrder.assigned_seller
            };
        }).filter(Boolean);

        return sessions;
    },

    async sendMessage(orderId: string, sender: 'client' | 'store', message: string) {
        // Insert the actual message
        const { data, error } = await supabase
            .from('order_messages')
            .insert([{ order_id: orderId, sender, message }])
            .select()
            .single();

        if (error) throw error;

        // Auto-reply logic (virtual attendant) for first client message
        if (sender === 'client') {
            try {
                // Count how many messages the client sent in this order
                const { count } = await supabase
                    .from('order_messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('order_id', orderId)
                    .eq('sender', 'client');

                // If this is the their first message, send the greeting
                if (count === 1) {
                    // Fetch order to see if it has an assigned seller
                    const { data: orderData } = await supabase
                        .from('orders')
                        .select('assigned_seller')
                        .eq('id', orderId)
                        .single();

                    let sellerName = 'um de nossos especialistas';

                    if (orderData?.assigned_seller) {
                        const { data: sellerData } = await supabase
                            .from('team_members')
                            .select('name')
                            .eq('id', orderData.assigned_seller)
                            .single();
                        
                        if (sellerData?.name) {
                            // Extract just the first name for a friendlier tone
                            sellerName = sellerData.name.split(' ')[0];
                        }
                    }

                    const botMessage = `Olá! Recebemos sua mensagem. Este atendimento está sendo direcionado para ${sellerName}, que irá te responder em breve!`;

                    // Insert bot reply
                    await supabase
                        .from('order_messages')
                        .insert([{ order_id: orderId, sender: 'store', message: botMessage }]);
                }
            } catch (autoReplyError) {
                console.error("Failed to send auto-reply:", autoReplyError);
            }
        }

        return data;
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
    assignedSeller: dbItem.assigned_seller,
    orderType: dbItem.order_type,
    totalValue: dbItem.total_value,
    discountValue: dbItem.discount_value,
    amountPaid: dbItem.amount_paid,
    createdAt: dbItem.created_at,
    deliveryDate: dbItem.delivery_date,
    layoutUrl: dbItem.layout_url,
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
    if (appItem.discountValue !== undefined) dbItem.discount_value = appItem.discountValue;
    if (appItem.amountPaid !== undefined) dbItem.amount_paid = appItem.amountPaid;
    if (appItem.deliveryDate) dbItem.delivery_date = appItem.deliveryDate;
    if (appItem.layoutUrl !== undefined) dbItem.layout_url = appItem.layoutUrl;
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
