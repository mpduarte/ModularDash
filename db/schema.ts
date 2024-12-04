import { pgTable, text, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const widgets = pgTable("widgets", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  x: integer("x").notNull(),
  y: integer("y").notNull(),
  w: integer("w").notNull(),
  h: integer("h").notNull(),
  visible: boolean("visible").notNull().default(true),
  config: jsonb("config").notNull().default({}),
  pluginId: text("plugin_id").notNull()
});

export const plugins = pgTable("plugins", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  version: text("version").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  config: jsonb("config").notNull().default({}),
  component: text("component").notNull(),
  category: text("category").notNull().default('general')
});

export const zones = pgTable("zones", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  widgets: jsonb("widgets").notNull().default([])
});

export const insertWidgetSchema = createInsertSchema(widgets);
export const selectWidgetSchema = createSelectSchema(widgets);
export type InsertWidget = z.infer<typeof insertWidgetSchema>;
export type Widget = z.infer<typeof selectWidgetSchema>;

export const insertPluginSchema = createInsertSchema(plugins);
export const selectPluginSchema = createSelectSchema(plugins);
export type InsertPlugin = z.infer<typeof insertPluginSchema>;
export type Plugin = z.infer<typeof selectPluginSchema>;

export const insertZoneSchema = createInsertSchema(zones);
export const selectZoneSchema = createSelectSchema(zones);
export type InsertZone = z.infer<typeof insertZoneSchema>;
export type Zone = z.infer<typeof selectZoneSchema>;
