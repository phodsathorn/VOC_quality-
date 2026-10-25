/**
 * Central API Configuration for VOC / E-Nose Frontend
 * Always defaults to the deployed production backend on Render.
 */
export const API = import.meta.env.VITE_API_URL || 'https://voc-backend-api.onrender.com';
export default API;
