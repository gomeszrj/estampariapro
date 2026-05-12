import { supabase } from './supabase';

export interface CompanySettings {
    id?: string;
    name: string;
    cnpj: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    bank_info: string;
    logo_url: string;
    evolution_api_url?: string;
    evolution_api_key?: string;
    evolution_instance_name?: string;
    cloudbot_enabled?: boolean;
}

export const settingsService = {
    getSettings: async (): Promise<CompanySettings> => {
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // Row not found
                return {
                    name: '',
                    cnpj: '',
                    address: '',
                    phone: '',
                    email: '',
                    website: '',
                    bank_info: '',
                    logo_url: '',
                    evolution_api_url: '',
                    evolution_api_key: '',
                    evolution_instance_name: '',
                    cloudbot_enabled: false
                };
            }
            throw error;
        }

        return {
            name: data.name || '',
            cnpj: data.cnpj || '',
            address: data.address || '',
            phone: data.phone || '',
            email: data.email || '',
            website: data.website || '',
            bank_info: data.bank_info || '',
            logo_url: data.logo_url || '',
            evolution_api_url: data.evolution_api_url || '',
            evolution_api_key: data.evolution_api_key || '',
            evolution_instance_name: data.evolution_instance_name || '',
            cloudbot_enabled: data.cloudbot_enabled || false
        };
    },

    getPublicSettings: async (): Promise<Partial<CompanySettings>> => {
        const { data, error } = await supabase
            .from('settings')
            .select('name, logo_url, phone, email, website, address, bank_info')
            .single();

        if (error) {
            console.error("Error fetching public settings", error);
            return {};
        }

        return {
            name: data.name || '',
            logo_url: data.logo_url || '',
            phone: data.phone || '',
            email: data.email || '',
            website: data.website || '',
            address: data.address || '',
            bank_info: data.bank_info || ''
        };
    },

    saveSettings: async (settings: CompanySettings) => {
        // Get the current user's tenant_id to scope the settings record
        const { data: { user } } = await supabase.auth.getUser();
        let settingsId = 'default';
        if (user) {
            const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single();
            if (profile?.tenant_id) settingsId = profile.tenant_id;
        }

        const payload = {
            id: settingsId,
            name: settings.name,
            cnpj: settings.cnpj,
            address: settings.address,
            phone: settings.phone,
            email: settings.email,
            website: settings.website,
            bank_info: settings.bank_info,
            logo_url: settings.logo_url,
            evolution_api_url: settings.evolution_api_url,
            evolution_api_key: settings.evolution_api_key,
            evolution_instance_name: settings.evolution_instance_name,
            cloudbot_enabled: settings.cloudbot_enabled
        };

        const { error } = await supabase
            .from('settings')
            .upsert(payload);

        if (error) throw error;
    },

    uploadLogo: async (file: File): Promise<string> => {
        // Get tenant_id for storage isolation
        const { data: { user } } = await supabase.auth.getUser();
        let tenantPrefix = 'default';
        if (user) {
            const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single();
            if (profile?.tenant_id) tenantPrefix = profile.tenant_id;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `logo-${Date.now()}.${fileExt}`;
        const filePath = `${tenantPrefix}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('company-assets')
            .upload(filePath, file, { upsert: true });

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage
            .from('company-assets')
            .getPublicUrl(filePath);

        return data.publicUrl;
    }
};
