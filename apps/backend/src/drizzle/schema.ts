import { relations } from 'drizzle-orm';
import {
  primaryKey,
  pgEnum,
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  doublePrecision,
} from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role_enum', ['TECHNICIAN', 'ADMIN']);
export const specializationEnum = pgEnum('specialization_enum', [
  'HEMATOLOGY',
  'CHEMISTRY',
  'MICROBIOLOGY',
  'IMMUNOLOGY',
  'OTHER',
]);
export const statusEnum = pgEnum('status_enum', ['PASS', 'FAIL', 'WARNING']);
export const priorityEnum = pgEnum('priority_enum', ['LOW', 'MEDIUM', 'HIGH']);
export const machineStatusEnum = pgEnum('machine_status_enum', [
  'IDLE',
  'RUNNING',
  'MAINTENANCE',
  'OFFLINE',
  'ERROR',
]);

export const userAlertStatusEnum = pgEnum('user_alert_status_enum', [
  'UNSEEN',
  'SEEN',
  'RESOLVED',
]);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: varchar('email', { length: 256 }).unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  phone: text('phone'),
  role: roleEnum('role').notNull().default('TECHNICIAN'),
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
  specialization: specializationEnum('specialization').default('OTHER'),
});

export const machines = pgTable('machines', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  hospCode: text('hosp_code'),
  sectionId: integer('section_id')
    .references(() => sections.id)
    .notNull(),
  currentStatus: machineStatusEnum('current_status').default('IDLE'),
  lastRunAt: timestamp('last_run_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
  specialization: specializationEnum('specialization'),
});

export const qcTests = pgTable('qc_tests', {
  id: serial('id').primaryKey(),
  testName: text('test_name').notNull(),
  testType: text('test_type'),
  machineId: integer('machine_id')
    .references(() => machines.id)
    .notNull(),
  updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
});

export const controlLots = pgTable('control_lots', {
  id: serial('id').primaryKey(),
  testId: integer('test_id')
    .references(() => qcTests.id)
    .notNull(),
  lotNumber: varchar('lot_number', { length: 100 }).notNull(),
  expirationDate: timestamp('expiration_date').notNull(),

  targetValue: doublePrecision('target_value'),
  mean: doublePrecision('mean'),
  standardDeviation: doublePrecision('standard_deviation'),
  upperControlLimit: doublePrecision('upper_control_limit'),
  lowerControlLimit: doublePrecision('lower_control_limit'),
  upperWarningLimit: doublePrecision('upper_warning_limit'),
  lowerWarningLimit: doublePrecision('lower_warning_limit'),
  level: integer('level').default(1).notNull(),

  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const qcRuns = pgTable('qc_runs', {
  id: serial('id').primaryKey(),
  machineId: integer('machine_id')
    .references(() => machines.id)
    .notNull(),
  performedBy: integer('performed_by')
    .references(() => users.id)
    .notNull(),
  runDate: timestamp('run_date').defaultNow(),
});

export const qcResults = pgTable('qc_results', {
  id: serial('id').primaryKey(),
  measuredValue: doublePrecision('measured_value').notNull(),
  zScore: doublePrecision('z_score').notNull(),             // NEW
  violatedRule: varchar('violated_rule', { length: 50 }),   // NEW — null = PASS
  status: statusEnum('status').notNull(),
  comments: text('comments'),
  runId: integer('run_id')
    .references(() => qcRuns.id)
    .notNull(),
  lotId: integer('lot_id')
    .references(() => controlLots.id)
    .notNull(),
});


export const alerts = pgTable('alerts', {
  id: serial('id').primaryKey(),
  type: text('type'),
  priority: priorityEnum('priority').default('MEDIUM'),
  message: text('message'),
  ruleViolated: varchar('rule_violated', { length: 50 }),
  suggestedSolution: text('suggested_solution'),
  resultId: integer('result_id')
    .references(() => qcResults.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersToAlerts = pgTable(
  'users_to_alerts',
  {
    userId: integer('user_id')
      .references(() => users.id)
      .notNull(),
    alertId: integer('alert_id')
      .references(() => alerts.id)
      .notNull(),
    status: userAlertStatusEnum('status').notNull().default('UNSEEN'),
    seenAt: timestamp('seen_at'),
    resolvedAt: timestamp('resolved_at'),
    resolutionNote: text('resolution_note'),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.alertId] }),
  }),
);

export const usersToSections = pgTable(
  'users_to_sections',
  {
    userId: integer('user_id')
      .references(() => users.id)
      .notNull(),
    sectionId: integer('section_id')
      .references(() => sections.id)
      .notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.sectionId] }),
  }),
);

export const sectionsRelations = relations(sections, ({ many }) => ({
  machines: many(machines),
  userAssignments: many(usersToSections),
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
  controlLots: many(controlLots),
}));

export const controlLotsRelations = relations(controlLots, ({ one, many }) => ({
  qcTest: one(qcTests, {
    fields: [controlLots.testId],
    references: [qcTests.id],
  }),
  qcResults: many(qcResults),
}));

export const qcRunsRelations = relations(qcRuns, ({ one, many }) => ({
  machine: one(machines, {
    fields: [qcRuns.machineId],
    references: [machines.id],
  }),
  performedBy: one(users, {
    fields: [qcRuns.performedBy],
    references: [users.id],
  }),
  results: many(qcResults),
}));

export const qcResultsRelations = relations(qcResults, ({ one }) => ({
  run: one(qcRuns, {
    fields: [qcResults.runId],
    references: [qcRuns.id],
  }),
  controlLot: one(controlLots, {
    fields: [qcResults.lotId],
    references: [controlLots.id],
  }),
  alert: one(alerts),
}));

export const alertsRelations = relations(alerts, ({ one, many }) => ({
  result: one(qcResults, {
    fields: [alerts.resultId],
    references: [qcResults.id],
  }),
  recipients: many(usersToAlerts),
}));

export const usersRelations = relations(users, ({ many }) => ({
  sectionAssignments: many(usersToSections),
  performedRuns: many(qcRuns),
  alertNotifications: many(usersToAlerts),
}));

export const usersToSectionsRelations = relations(
  usersToSections,
  ({ one }) => ({
    user: one(users, {
      fields: [usersToSections.userId],
      references: [users.id],
    }),
    section: one(sections, {
      fields: [usersToSections.sectionId],
      references: [sections.id],
    }),
  }),
);

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
