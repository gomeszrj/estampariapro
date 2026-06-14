import { supabase } from './supabase';

export interface AuditLog {
    id: string;
    tenantId: string;
    userId?: string;
    userEmail?: string;
    action: string;
    targetTable?: string;
    targetId?: string;
    details?: any;
    createdAt: string;
}

export const auditService = {
    async logEvent(action: string, targetTable?: string, targetId?: string, details?: any) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            // Get tenant_id from profiles if logged in
            let tenantId = null;
            let userEmail = null;
            if (user) {
                userEmail = user.email;
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('tenant_id')
                    .eq('id', user.id)
                    .single();
                if (profile) {
                    tenantId = profile.tenant_id;
                }
            }

            const logData: any = {
                action,
                target_table: targetTable,
                target_id: targetId,
                details: details ? JSON.stringify(details) : null,
                user_id: user?.id || null,
                user_email: userEmail,
            };

            if (tenantId) {
                logData.tenant_id = tenantId;
            }

            const { data, error } = await supabase
                .from('audit_logs')
                .insert([logData])
                .select()
                .single();

            if (error) {
                console.error("Failed to insert audit log in DB:", error.message);
                return null;
            }

            return mapFromDB(data) as AuditLog;
        } catch (err) {
            console.error("Error logging audit event:", err);
            return null;
        }
    },

    async getAll(limit = 100) {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data?.map(mapFromDB) as AuditLog[];
    },

    async getPaginated(page: number = 1, pageSize: number = 20) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await supabase
            .from('audit_logs')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;
        return {
            logs: data?.map(mapFromDB) as AuditLog[],
            totalCount: count || 0
        };
    }
};

const mapFromDB = (dbItem: any): AuditLog => ({
    id: dbItem.id,
    tenantId: dbItem.tenant_id,
    userId: dbItem.user_id,
    userEmail: dbItem.user_email,
    action: dbItem.action,
    targetTable: dbItem.target_table,
    targetId: dbItem.target_id,
    details: dbItem.details ? JSON.parse(dbItem.details) : null,
    createdAt: dbItem.created_at
});
