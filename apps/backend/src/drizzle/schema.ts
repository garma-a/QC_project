import { relations } from 'drizzle-orm';
import { primaryKey, pgEnum, pgTable, serial, text, varchar, timestamp, integer, boolean, doublePrecision } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role_enum', ['INTERN', 'ENGINEER', 'ADMIN']);


export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: varchar('email', { length: 256 }).unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  phone: text('phone'),
  role: roleEnum('role').default('INTERN'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
});

export const sections = pgTable('sections', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  location: text('location'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
});

export const machines = pgTable('machines', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  hospCode: text('hosp_code'),
  sectionId: integer('section_id')
    .references(() => sections.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
});

export const qcTests = pgTable('qc_tests', {
  id: serial('id').primaryKey(),
  testName: text('test_name').notNull(),
  testType: text('test_type'),


  targetValue: doublePrecision('target_value'),
  mean: doublePrecision('mean'),
  standardDevi: doublePrecision('standard_devi'),


  upperControlLimit: doublePrecision('upper_control_limit'),
  lowerControlLimit: doublePrecision('lower_control_limit'),
  upperWarningLimit: doublePrecision('upper_warning_limit'),
  lowerWarningLimit: doublePrecision('lower_warning_limit'),


  machineId: integer('machine_id')
    .references(() => machines.id)
    .notNull(),

  updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
});


export const statusEnum = pgEnum('status_enum', ['PASS', 'FAIL', 'WARNING']);

export const qcResults = pgTable('qc_results', {
  id: serial('id').primaryKey(),
  measuredValue: doublePrecision('measured_value').notNull(),
  testDate: timestamp('test_date').defaultNow(),
  status: statusEnum('status').notNull(),
  comments: text('comments'),


  testId: integer('test_id').references(() => qcTests.id).notNull(),
  performedBy: integer('performed_by').references(() => users.id).notNull(),
});


export const pariorityEnum = pgEnum('priority_enum', ['LOW', 'MEDIUM', 'HIGH']);
export const alerts = pgTable('alerts', {
  id: serial('id').primaryKey(),
  type: text('type'),
  priority: pariorityEnum('priority').default('MEDIUM'),
  message: text('message'),
  resultId: integer('result_id').references(() => qcResults.id).notNull()
});

export const usersToAlerts = pgTable('users_to_alerts', {
  userId: integer('user_id').references(() => users.id).notNull(),
  alertId: integer('alert_id').references(() => alerts.id).notNull(),
  isAcknowledged: boolean('is_acknowledged').default(false),
  acknowledgedAt: timestamp('acknowledged_at'),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.alertId] }),
}));


export const sectionsRelations = relations(sections, ({ many }) => ({
  machines: many(machines),
}));

export const machinesRelations = relations(machines, ({ one, many }) => ({
  section: one(sections, {
    fields: [machines.sectionId],
    references: [sections.id],
  }),
  qcTests: many(qcTests),
}));

export const qcTestsRelations = relations(qcTests, ({ one, many }) => ({
  machine: one(machines, {
    fields: [qcTests.machineId],
    references: [machines.id],
  }),
  qcResults: many(qcResults),
}));

export const qcResultsRelations = relations(qcResults, ({ one }) => ({
  qcTest: one(qcTests, {
    fields: [qcResults.testId],
    references: [qcTests.id],
  }),
  performedBy: one(users, {
    fields: [qcResults.performedBy],
    references: [users.id],
  }),
  alert: one(alerts), // Assuming 1:1 for result:alert, or use many if multiple alerts per result
}));

export const alertsRelations = relations(alerts, ({ one, many }) => ({
  result: one(qcResults, {
    fields: [alerts.resultId],
    references: [qcResults.id],
  }),
  recipients: many(usersToAlerts),
}));

export const usersRelations = relations(users, ({ many }) => ({
  performedResults: many(qcResults),
  alertNotifications: many(usersToAlerts),
}));

export const usersToAlertsRelations = relations(usersToAlerts, ({ one }) => ({
  user: one(users, {
    fields: [usersToAlerts.userId],
    references: [users.id],
  }),
  alert: one(alerts, {
    fields: [usersToAlerts.alertId],
    references: [alerts.id],
  }),
}));
