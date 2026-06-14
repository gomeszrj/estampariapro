# 🚨 URGENT: ACTION REQUIRED TO FIX "BLACK SCREEN" & CRASHES

The system analysis is complete. Here is why your system is broken and how to fix it:

## 1. Backend Database Error (CRASHING)
The backend (`evolution-api`) is failing to start.
**Error:** `PrismaClientInitializationError: Can't reach database server`
**Reason:** The password in your database connection string is likely incorrect (you mentioned changing your token).

### ✅ HOW TO FIX:
1.  Open the file: `d:\GOMESZ SPEED PRINT\estamapariapro\erp-estamparia-ai-first\evolution-api-main\evolution-api-main\.env`
2.  Find the line starting with `DATABASE_CONNECTION_URI=`
3.  The format is: `postgresql://postgres.[CLIENT]:[PASSWORD]@...`
4.  **Replace** the `[PASSWORD]` part (the text between `:` and `@`) with your **NEW Supabase Database Password**.
    *   *If you don't know it:* Go to Supabase Dashboard -> Project Settings -> Database -> Reset Password.

## 2. Gemini API Key (MISSING)
Your AI features will not work.
**Reason:** The file `estampariapro/.env.local` contains `PLACEHOLDER_API_KEY`.

### ✅ HOW TO FIX:
1.  Open `d:\GOMESZ SPEED PRINT\estamapariapro\erp-estamparia-ai-first\estampariapro\.env.local`
2.  I have already renamed `GEMINI_API_KEY` to `VITE_GEMINI_API_KEY` for you.
3.  **Replace** `PLACEHOLDER_API_KEY` with your actual key from Google AI Studio.

## 3. Frontend "Black Screen" (FIXED)
I have patched the code (`AuthContext.tsx`) so the app will no longer freeze on a black screen if the connection fails. It should now show the Login screen after a 5-second timeout.

---

**Once you have updated the `.env` file with the correct password, please save it and tell me "Fixed". I will then restart the servers.**
