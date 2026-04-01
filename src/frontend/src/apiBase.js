const rawApiBase = import.meta.env.VITE_API_URL

export const API_BASE = rawApiBase && rawApiBase.trim() ? rawApiBase.trim() : '/api'
