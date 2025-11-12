import { pgTable, serial, varchar, timestamp, decimal, boolean, text, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  district: varchar("district", { length: 255 }).notNull(),
  address: varchar("address", { length: 500 }).default("").notNull(),
  mobile: varchar("mobile", { length: 15 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  isActive: boolean("is_active").default(false).notNull(),
  paymentStatus: varchar("payment_status", { length: 50 }).default("pending").notNull(),
  paymentAmount: decimal("payment_amount", { precision: 10, scale: 2 }),
  razorpayOrderId: varchar("razorpay_order_id", { length: 255 }),
  razorpayPaymentId: varchar("razorpay_payment_id", { length: 255 }),
  razorpaySignature: varchar("razorpay_signature", { length: 255 }),
  paymentCompletedAt: timestamp("payment_completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  adminId: varchar("admin_id", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id).notNull(),
  orderId: varchar("order_id", { length: 255 }).notNull(),
  paymentId: varchar("payment_id", { length: 255 }),
  signature: varchar("signature", { length: 255 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("INR").notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  method: varchar("method", { length: 50 }),
  gateway: varchar("gateway", { length: 50 }).default("razorpay").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  uuid: varchar("uuid", { length: 36 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: varchar("file_size", { length: 50 }),
  pageCount: integer("page_count").notNull(),
  uploadedBy: serial("uploaded_by").references(() => admins.id).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isPremium: boolean("is_premium").default(false).notNull(),
  previewPages: integer("preview_pages").default(3).notNull(), // Number of pages to show for preview
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const violations = pgTable("violations", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 100 }).notNull(),
  userEmail: varchar("user_email", { length: 255 }).notNull(),
  userName: varchar("user_name", { length: 255 }).notNull(),
  resourceTitle: text("resource_title").notNull(),
  violationNumber: serial("violation_number").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  notified: boolean("notified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  uuid: varchar("uuid", { length: 36 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  videoUrl: text("video_url").notNull(),
  videoType: varchar("video_type", { length: 50 }).default("youtube").notNull(), // youtube, vimeo, upload, embed
  duration: varchar("duration", { length: 20 }), // Format: HH:MM:SS
  category: varchar("category", { length: 100 }),
  tags: text("tags"), // Comma separated tags
  views: integer("views").default(0).notNull(),
  uploadedBy: serial("uploaded_by").references(() => admins.id).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isPremium: boolean("is_premium").default(false).notNull(),
  previewDuration: integer("preview_duration").default(20).notNull(), // Preview time in seconds for non-premium users
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Admin = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;
export type AppSetting = typeof appSettings.$inferSelect;
export type NewAppSetting = typeof appSettings.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;
export type Violation = typeof violations.$inferSelect;
export type NewViolation = typeof violations.$inferInsert;
export type Video = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;
