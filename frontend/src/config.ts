// Backend ka URL ek hi jagah define karte hain, baaki files yahin se lengi
// Vercel pe VITE_API_URL set hoga; laptop pe set nahi hota, toh localhost chalega
export const API_URL: string =
    import.meta.env.VITE_API_URL ?? 'http://localhost:3001';