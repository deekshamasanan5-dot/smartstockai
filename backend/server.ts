import dotenv from 'dotenv';
import { createApp } from './app.ts';
import { testSupabaseConnection } from './config/supabase.ts';

dotenv.config();

const port = Number(process.env.PORT) || 3001;
const app = createApp();

app.listen(port, '0.0.0.0', async () => {
  console.log(`=======================================================`);
  console.log(`🚀 SmartStock Precision Inventory Backend Server Online`);
  console.log(`📡 URL:     http://localhost:${port}`);
  console.log(`🩺 Health:  http://localhost:${port}/api/health`);
  console.log(`📦 Catalog: http://localhost:${port}/api/inventory`);
  console.log(`=======================================================`);

  try {
    const health = await testSupabaseConnection();
    if (health.isConnected) {
      console.log(`✅ [Supabase Connected]: ${health.url}`);
      console.log(
        `📊 [Synced Records]: ${health.databaseStats?.productsCount} products, ` +
        `${health.databaseStats?.suppliersCount} suppliers, ` +
        `${health.databaseStats?.alertsCount} active alerts`
      );
    } else if (health.isConfigured) {
      console.warn(`⚠️ [Supabase Notice]: Keys configured, but live database query failed.`);
      console.warn(`👉 ${health.message}`);
    } else {
      console.log(`ℹ️ [Supabase Notice]: Running in fallback mock mode. Fill in SUPABASE_URL & keys in .env to connect to live Supabase.`);
    }
  } catch (err) {
    console.warn(`⚠️ [Supabase Status]: Check exception:`, err);
  }
});

export default app;
