import { drizzle } from "drizzle-orm/neon-http";
import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from "@db/schema";

// Required for Neon serverless with WebSocket support
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

// Create the connection
const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
