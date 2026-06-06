import * as argon2 from 'argon2';

export async function verifyPassword({ hash, password }: { hash: string; password: string }): Promise<boolean> {
  return await argon2.verify(hash, password);
}

export async function hashPassword({ password }: { password: string }): Promise<string> {
  return await argon2.hash(password);
}
