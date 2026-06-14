
export const getConfig = (key: string): string => {
    // 1. Check Local Storage (User Setup)
    if (typeof window !== 'undefined') {
        const storedValue = localStorage.getItem(key);
        if (storedValue) return storedValue;
    }

    // 2. Check Environment Variables (Vite)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
        // @ts-ignore
        return import.meta.env[key];
    }

    // 3. Check Process Env (Legacy/Node)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
        return process.env[key];
    }

    // 4. No fallback — credentials MUST come from env or localStorage
    // Never hardcode production keys in source code
    return '';
};

// Keys mapping
export const CONFIG_KEYS = {
    SUPABASE_URL: 'VITE_SUPABASE_URL',
    SUPABASE_ANON_KEY: 'VITE_SUPABASE_ANON_KEY'
};
