import * as argon2 from 'argon2';

const ARGON2_OPTIONS = {
  timeCost: 3,
  memoryCost: 65536,
  parallelism: 1,
};

export async function verifyPassword({ hash, password }: { hash: string; password: string }): Promise<boolean> {
  return await argon2.verify(hash, password);
}

export async function hashPassword({ password }: { password: string }): Promise<string> {
  return await argon2.hash(password, ARGON2_OPTIONS);
}
