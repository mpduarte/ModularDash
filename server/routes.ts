import express from "express";
import { db } from "db";
import { widgets, plugins } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: express.Express) {
  // Plugin routes
  app.get("/api/plugins", async (_req, res) => {
    try {
      const allPlugins = await db.select().from(plugins);
      res.json(allPlugins);
    } catch (error) {
      console.error('Error fetching plugins:', error);
      res.status(500).json({
        error: 'Failed to fetch plugins',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/plugins/:id", async (req, res) => {
    try {
      const plugin = await db.select().from(plugins).where(eq(plugins.id, req.params.id));
      if (!plugin.length) {
        return res.status(404).json({ error: "Plugin not found" });
      }
      res.json(plugin[0]);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch plugin',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.patch("/api/plugins/:id", async (req, res) => {
    try {
      const plugin = await db
        .update(plugins)
        .set(req.body)
        .where(eq(plugins.id, req.params.id))
        .returning();
      
      if (!plugin.length) {
        return res.status(404).json({ error: "Plugin not found" });
      }
      res.json(plugin[0]);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to update plugin',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Widget routes
  app.get("/api/widgets", async (_req, res) => {
    try {
      const allWidgets = await db.select().from(widgets);
      res.json(allWidgets);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch widgets',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/widgets/:id", async (req, res) => {
    try {
      const widget = await db.select().from(widgets).where(eq(widgets.id, parseInt(req.params.id)));
      if (!widget.length) {
        return res.status(404).json({ error: "Widget not found" });
      }
      res.json(widget[0]);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch widget',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/widgets", async (req, res) => {
    try {
      const widget = await db.insert(widgets).values(req.body).returning();
      res.json(widget[0]);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to create widget',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.patch("/api/widgets/:id", async (req, res) => {
    try {
      const widget = await db
        .update(widgets)
        .set(req.body)
        .where(eq(widgets.id, parseInt(req.params.id)))
        .returning();
      
      if (!widget.length) {
        return res.status(404).json({ error: "Widget not found" });
      }
      res.json(widget[0]);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to update widget',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.delete("/api/widgets/:id", async (req, res) => {
    try {
      await db.delete(widgets).where(eq(widgets.id, parseInt(req.params.id)));
      res.status(204).end();
    } catch (error) {
      res.status(500).json({
        error: 'Failed to delete widget',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}
