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

// SEC-002: Master admin is: role='master'/'admin' OR email in MASTER_EMAILS allowlist
// We use the session user directly — avoids a second supabase.auth.getUser() call
// which can cause AbortError when called during initialization

// SEC-002: Allowlist de emails com acesso Master Admin garantido por email
// ATENÇÃO: NÃO use includes() — apenas emails exatos são permitidos
const MASTER_EMAILS = ['master@estamparia.com'];

const loadAdminStatus = async (userId: string, email: string): Promise<boolean> => {
    const normalizedEmail = email ? email.trim().toLowerCase() : '';
    
    // SEC-002: Verificação por email exato — apenas emails da allowlist são Master Admin
    if (MASTER_EMAILS.includes(normalizedEmail)) {
        return true;
    }
    
    // Check role='master' or 'admin' in the database
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();
            
        if (!error && data && (data.role === 'master' || data.role === 'admin' || data.role === 'ADMIN MASTER')) {
            return true;
        }
    } catch (err) {
        console.error('Failed to load master role from DB', err);
    }
    
    return false;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isMasterAdmin, setIsMasterAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        // Safety timeout — gives 15s before forcing render
        const timeout = setTimeout(() => {
            if (mounted && loading) {
                console.warn('Auth loading timed out after 15s — forcing render');
                setLoading(false);
            }
        }, 15000);

        const handleSession = async (session: Session | null) => {
            if (!mounted) return;
            setSession(session);
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (currentUser) {
                const isAdmin = await loadAdminStatus(currentUser.id, currentUser.email ?? '');
                if (mounted) setIsMasterAdmin(isAdmin);
            } else {
                setIsMasterAdmin(false);
            }

            if (mounted) setLoading(false);
        };

        // 1. Get existing session
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                console.error('getSession error:', error.message);
                if (mounted) setLoading(false);
                return;
            }
            handleSession(session);
        });

        // 2. Listen for auth state changes (login, logout, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            handleSession(session);
        });

        return () => {
            mounted = false;
            clearTimeout(timeout);
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        try {
            await supabase.auth.signOut({ scope: 'local' });
        } catch (e) {
            console.error('signOut error:', e);
        }
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
