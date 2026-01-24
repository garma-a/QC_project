import { pgEnum, pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role_enum', ['INTERN', 'ENGINEER', 'ADMIN']);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name'),
  email: varchar('email', { length: 256 }).unique(),
  role: roleEnum('role').default('INTERN'),
});
