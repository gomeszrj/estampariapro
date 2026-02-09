import { supabase } from './supabase';
import { Order, OrderItem, OrderStatus, OrderType, PaymentStatus, CatalogOrder } from '../types';
import { orderService } from './orderService';
import { productService } from './productService';

export const catalogOrderService = {
    // Adapter: Create Order using ERP Services
    async create(data: {
        clientId?: string; // If known
        clientName: string;
        clientTeam?: string; // Optional "Turma"
        clientPhone: string; // Key for lookup
        items: Array<{
            productId: string;
            productName: string;
            size: string;
            quantity: number;
            imageUrl: string;
            notes?: string;
            price: number;
        }>;
        totalEstimated: number;
        notes?: string;
    }) {
        try {
            // 1. Get or Create Client
            let clientId = data.clientId;
            if (!clientId) {
                clientId = await this.getOrCreateClient(data.clientName, data.clientPhone);
            }

            // 2. Prepare Items (Map to ERP Structure)
            // We need to fetch product details to get Category/Fabric info if possible, 
            // but for performance we might just infer or fetch in parallel.
            const products = await productService.getAll(); // Cache might be better, but this is safe

            const orderItems: OrderItem[] = data.items.map(item => {
                const product = products.find(p => p.id === item.productId);
                return {
                    id: Math.random().toString(36).substring(2) + Date.now().toString(36), // Simple ID
                    productId: item.productId,
                    productName: item.productName,
                    fabricId: 'f-store', // Placeholder or infer
                    fabricName: product?.category || 'Padrão', // Use category as Fabric Name
                    gradeLabel: 'Standard', // Default
                    size: item.size,
                    quantity: item.quantity,
                    unitPrice: item.price,
                    notes: item.notes
                };
            });

            // 3. Construct ERP Order
            // Use Omit<Order, 'id'> as expected by create
            const newOrder: Omit<Order, 'id'> = {
                orderNumber: await this.generateOrderNumber(),
                clientId: clientId!,
                clientName: data.clientName,
                clientTeam: data.clientTeam,
                status: OrderStatus.STORE_REQUEST, // New Status
                paymentStatus: PaymentStatus.PENDING,
                origin: 'store', // New Field
                orderType: OrderType.SALE, // Default to Sale
                items: orderItems,
                totalValue: data.totalEstimated,
                createdAt: new Date().toISOString(),
                deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // Default +14 days
                notes: data.notes
            };

            // 4. Delegate to Main Service
            return await orderService.create(newOrder);

        } catch (error) {
            console.error("Catalog Order Creation Failed", error);
            throw error;
        }
    },

    async getOrCreateClient(name: string, phone: string): Promise<string> {
        // Normalize phone for search (remove formatting if needed, but assuming exact match for now)
        const { data: existing } = await supabase
            .from('clients')
            .select('id')
            .eq('whatsapp', phone) // Assuming whatsapp column stores phone
            .single();

        if (existing) return existing.id;

        // Create
        const { data: newClient, error } = await supabase
            .from('clients')
            .insert([{
                name,
                whatsapp: phone,
                email: `${phone.replace(/\D/g, '')}@placeholder.com`, // Dummy email
            }])
            .select()
            .single();

        if (error) throw error;
        return newClient.id;
    },

    async generateOrderNumber() {
        // Simple generation, ideally centralized in orderService but accessible here
        const prefix = 'LJ';
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `${prefix}-${random}`;
    },

    async getByClientId(clientId: string): Promise<CatalogOrder[]> {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('client_id', clientId)
            .eq('origin', 'store') // Only store requests
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching catalog orders:', error);
            return [];
        }

        // Map from DB to CatalogOrder structure
        return data.map((d: any) => ({
            id: d.id,
            clientId: d.client_id,
            clientName: d.client_name,
            clientPhone: '', // Need to fetch or optional
            clientTeam: d.client_team,
            items: d.items || [],
            totalEstimated: d.total_value,
            status: d.status === OrderStatus.STORE_REQUEST ? 'pending' : 'approved', // Simplified mapping
            createdAt: d.created_at,
            notes: d.notes
        }));
    }
};
