import type { Express } from "express";
import { db } from "../db";
import { widgets, zones } from "@db/schema";
import { plugins } from "@db/schema";
import { eq } from "drizzle-orm";
import { and } from "drizzle-orm";

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
    const widgetId = parseInt(req.params.id, 10);
    if (isNaN(widgetId)) {
      return res.status(400).json({ error: "Invalid widget ID" });
    }
    const widget = await db
      .update(widgets)
      .set(req.body)
      .where(eq(widgets.id, widgetId))
      .returning();
    res.json(widget[0]);
  });

  app.delete("/api/widgets/:id", async (req, res) => {
    const widgetId = parseInt(req.params.id, 10);
    if (isNaN(widgetId)) {
      return res.status(400).json({ error: "Invalid widget ID" });
    }
    await db.delete(widgets).where(eq(widgets.id, widgetId));
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
    const zoneId = parseInt(req.params.id, 10);
    if (isNaN(zoneId)) {
      return res.status(400).json({ error: "Invalid zone ID" });
    }
    const zone = await db
      .update(zones)
      .set(req.body)
      .where(eq(zones.id, zoneId))
      .returning();
    res.json(zone[0]);
  });

  app.delete("/api/zones/:id", async (req, res) => {
    const zoneId = parseInt(req.params.id, 10);
    if (isNaN(zoneId)) {
      return res.status(400).json({ error: "Invalid zone ID" });
    }
    await db.delete(zones).where(eq(zones.id, zoneId));
    res.status(204).end();
  // Plugin routes
  app.get("/api/plugins", async (req, res) => {
    const allPlugins = await db.select().from(plugins);
    res.json(allPlugins);
  });

  app.get("/api/plugins/:id", async (req, res) => {
    const plugin = await db.select().from(plugins).where(eq(plugins.id, req.params.id));
    if (!plugin.length) {
      return res.status(404).json({ error: "Plugin not found" });
    }
    res.json(plugin[0]);
  });

  app.post("/api/plugins", async (req, res) => {
    const plugin = await db.insert(plugins).values(req.body).returning();
    res.json(plugin[0]);
  });

  app.patch("/api/plugins/:id", async (req, res) => {
    const plugin = await db
      .update(plugins)
      .set(req.body)
      .where(eq(plugins.id, req.params.id))
      .returning();
    if (!plugin.length) {
      return res.status(404).json({ error: "Plugin not found" });
    }
    res.json(plugin[0]);
  });

  app.delete("/api/plugins/:id", async (req, res) => {
    await db.delete(plugins).where(eq(plugins.id, req.params.id));
    res.status(204).end();
  });
  });
}
