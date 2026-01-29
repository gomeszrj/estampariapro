import { supabase } from './supabase';
import { TeamMember, UserRole } from '../types';

export const teamService = {
    async getAll() {
        const { data, error } = await supabase
            .from('team_members')
            .select('*')
            .eq('active', true)
            .order('name');

        if (error) throw error;
        return data?.map(mapFromDB) as TeamMember[];
    },

    async create(member: Omit<TeamMember, 'id' | 'createdAt'>) {
        const dbItem = mapToDB(member);
        const { data, error } = await supabase
            .from('team_members')
            .insert([dbItem])
            .select()
            .single();

        if (error) throw error;
        return mapFromDB(data);
    },

    async delete(id: string) {
        // Soft delete usually better, but hard delete requested or simple enough
        // Let's do soft delete by setting active = false
        const { error } = await supabase
            .from('team_members')
            .update({ active: false })
            .eq('id', id);

        if (error) throw error;
    }
};

const mapFromDB = (dbItem: any): TeamMember => ({
    id: dbItem.id,
    name: dbItem.name,
    role: dbItem.role as UserRole,
    active: dbItem.active,
    email: dbItem.email,
    createdAt: dbItem.created_at
});

const mapToDB = (appItem: Partial<TeamMember>) => ({
    name: appItem.name,
    role: appItem.role,
    active: appItem.active,
    email: appItem.email
});
