import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Dwarf schema to store the state of each dwarf
export const dwarves = pgTable("dwarves", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  health: integer("health").notNull().default(100),
  hunger: integer("hunger").notNull().default(0),
  energy: integer("energy").notNull().default(100),
  happiness: integer("happiness").notNull().default(75),
  x: integer("x").notNull(),
  y: integer("y").notNull(),
  currentTask: text("current_task"),
  inventory: jsonb("inventory").$type<Record<string, number>>(),
  conversation: jsonb("conversation").$type<string[]>(),
  memory: jsonb("memory").$type<string[]>(),
  state: text("state").notNull().default("idle"),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

// Building schema to store buildings in the fortress
export const buildings = pgTable("buildings", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  x: integer("x").notNull(),
  y: integer("y").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  complete: boolean("complete").notNull().default(false),
  progress: integer("progress").notNull().default(0),
  materials: jsonb("materials").$type<Record<string, number>>(),
  occupants: jsonb("occupants").$type<number[]>(),
  function: text("function"),
});

// Resource nodes in the game world
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  x: integer("x").notNull(),
  y: integer("y").notNull(),
  quantity: integer("quantity").notNull(),
  regenerate: boolean("regenerate").default(false),
});

// Game world settings
export const gameState = pgTable("game_state", {
  id: serial("id").primaryKey(),
  day: integer("day").notNull().default(1),
  time: integer("time").notNull().default(0),
  weather: text("weather").notNull().default("clear"),
  gameSpeed: integer("game_speed").notNull().default(1),
  worldSeed: integer("world_seed").notNull(),
});

// Create export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Dwarf = typeof dwarves.$inferSelect;
export type Building = typeof buildings.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type GameState = typeof gameState.$inferSelect;

// Task types for the dwarves
export enum TaskType {
  Idle = "idle",
  Mining = "mining",
  Woodcutting = "woodcutting",
  Building = "building",
  Eating = "eating",
  Sleeping = "sleeping",
  Socializing = "socializing",
  Crafting = "crafting",
  Hauling = "hauling",
}

// Building types
export enum BuildingType {
  Wall = "wall",
  Floor = "floor",
  Door = "door",
  Bed = "bed",
  Table = "table",
  Chair = "chair",
  Workshop = "workshop",
  Storage = "storage",
  Farm = "farm",
}

// Resource types
export enum ResourceType {
  Stone = "stone",
  Wood = "wood",
  Food = "food",
  Metal = "metal",
  Water = "water",
}
