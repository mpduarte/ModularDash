import { drizzle } from "drizzle-orm/postgres-js";
import postgres from 'postgres';
import * as schema from "@db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

// Configure postgres connection with better error handling and connection pooling
const queryClient = postgres({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE,
  username: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  max: 10, // Connection pool size
  idle_timeout: 20, // Max idle time for connections
  connect_timeout: 10, // Connection timeout in seconds
  ssl: false, // Disable SSL for local development
  onnotice: () => {}, // Ignore notice messages
  debug: (connection: number, query: string, params: any[]) => {
    console.log('Database Query:', {
      query,
      params,
      connectionId: connection
    });
  },
});

// Create the database instance with drizzle
export const db = drizzle(queryClient, { schema });

// For raw SQL queries
export const sql = queryClient;

// Export a function to test database connection
export async function testConnection() {
  try {
    const result = await sql`SELECT 1 as connected`;
    return result[0]?.connected === 1;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}
