import { pgEnum, pgTable, serial, text, varchar, timestamp, integer, boolean, doublePrecision} from 'drizzle-orm/pg-core';

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
});

export const sections = pgTable('sections', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  location: text('location'),
  createdDate: timestamp('created_date').defaultNow(),
});

export const machines = pgTable('machines', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  hospCode: text('hosp_code'),
  sectionId: integer('section_id')
    .references(() => sections.id)
    .notNull(), 
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
});

