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
            .select('name, logo_url, phone, email, website, address')
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
            address: data.address || ''
        };
    },

    saveSettings: async (settings: CompanySettings) => {
        const payload = {
            id: 'company_main',
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
        const fileExt = file.name.split('.').pop();
        const fileName = `logo-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('company-assets')
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage
            .from('company-assets')
            .getPublicUrl(filePath);

        return data.publicUrl;
    }
};
