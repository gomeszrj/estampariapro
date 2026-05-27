import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    isMasterAdmin: boolean;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    isMasterAdmin: false,
    loading: true,
    signOut: async () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isMasterAdmin, setIsMasterAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    // SEC-002: Load master admin status from the database profile + email check
    // NOTE: The profiles table does NOT have is_master_admin or is_master columns.
    // Master admin is determined by: role='admin' + email='admin@estamparia.com'
    const loadAdminStatus = async (userId: string) => {
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();

            const { data: { user: currentUser } } = await supabase.auth.getUser();
            // SEC: Require BOTH conditions — never grant master on email alone
            const isMaster = currentUser?.email === 'admin@estamparia.com' && profile?.role === 'admin';
            setIsMasterAdmin(isMaster);
        } catch {
            // SEC: On error, deny master admin access — never use email-only fallback
            setIsMasterAdmin(false);
        }
    };

    useEffect(() => {
        let mounted = true;

        // Force stop loading after 15 seconds to prevent black screen
        const timeout = setTimeout(() => {
            if (mounted && loading) {
                console.error("Auth loading timed out - forcing render");
                setLoading(false);
            }
        }, 15000);

        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (mounted) {
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) await loadAdminStatus(session.user.id);
                setLoading(false);
            }
        }).catch(err => {
            console.error("Auth session error:", err);
            if (mounted) setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (mounted) {
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) await loadAdminStatus(session.user.id);
                else setIsMasterAdmin(false);
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            clearTimeout(timeout);
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut({ scope: 'local' });
        localStorage.removeItem('client_session');
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider value={{ session, user, isMasterAdmin, loading, signOut }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
