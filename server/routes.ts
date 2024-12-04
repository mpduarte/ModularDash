import type { Express } from "express";
import { db } from "../db";
import { widgets, zones } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express) {
  // Widget routes
  app.get("/api/widgets", async (req, res) => {
    const allWidgets = await db.select().from(widgets);
    res.json(allWidgets);
  });

  app.post("/api/widgets", async (req, res) => {
    const widget = await db.insert(widgets).values(req.body).returning();
    res.json(widget[0]);
  });

  app.patch("/api/widgets/:id", async (req, res) => {
    const widget = await db
      .update(widgets)
      .set(req.body)
      .where(eq(widgets.id, parseInt(req.params.id)))
      .returning();
    res.json(widget[0]);
  });

  app.delete("/api/widgets/:id", async (req, res) => {
    await db.delete(widgets).where(eq(widgets.id, parseInt(req.params.id)));
    res.status(204).end();
  });

  // Zone routes
  app.get("/api/zones", async (req, res) => {
    const allZones = await db.select().from(zones);
    res.json(allZones);
  });

  app.post("/api/zones", async (req, res) => {
    const zone = await db.insert(zones).values(req.body).returning();
    res.json(zone[0]);
  });

  app.patch("/api/zones/:id", async (req, res) => {
    const zone = await db
      .update(zones)
      .set(req.body)
      .where(eq(zones.id, parseInt(req.params.id)))
      .returning();
    res.json(zone[0]);
  });

  app.delete("/api/zones/:id", async (req, res) => {
    await db.delete(zones).where(eq(zones.id, parseInt(req.params.id)));
    res.status(204).end();
  });
}
