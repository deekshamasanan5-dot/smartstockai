// Re-export from dedicated backend configuration for backward compatibility
export { supabase, testSupabaseConnection as checkSupabaseHealth, isConfigured } from '../../backend/config/supabase.ts';
export { inventoryService } from '../../backend/services/inventoryService.ts';
