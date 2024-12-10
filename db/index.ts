import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { WebSocket } from "ws";

// Verify required environment variables
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

// Configure Neon client with required settings
neonConfig.webSocketConstructor = WebSocket;
neonConfig.useSecureWebSocket = true;
neonConfig.fetchConnectionCache = true;

// Create the connection with proper SSL configuration
const sql = neon(process.env.DATABASE_URL, {
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 120000,
  max: 20,
});

// Initialize Drizzle with the schema
export const db = drizzle(sql, { schema });

// Test database connection with proper error handling
export async function testConnection() {
  try {
    const result = await sql`SELECT 1 as connected`;
    if (result && result[0]?.connected === 1) {
      console.log('Database connection test successful');
      return true;
    }
    throw new Error('Database connection test failed: unexpected response');
  } catch (error) {
    console.error('Database connection test failed:', error);
    throw error;
  }
}
