import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users } from '../drizzle/schema'; 
import { eq } from 'drizzle-orm';
import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL!;
const queryClient = postgres(databaseUrl);
const db = drizzle(queryClient);

async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL!;
  const adminPassword = process.env.ADMIN_PASSWORD!;

  
  const [existingAdmin] = await db.select().from(users).where(eq(users.email, adminEmail));

  if (existingAdmin) {
    console.log('Admin already exists.');
    return;
  }

  const hashedPassword = await argon2.hash(adminPassword);

  await db.insert(users).values({
    firstName: 'System',
    lastName: 'Admin',
    email: adminEmail,
    passwordHash: hashedPassword,
    role: 'ADMIN', 
  });  //adding the admin before going to the authentication process

  console.log('ADMIN IS CREATED');
}

seedAdmin().then(() => process.exit(0));