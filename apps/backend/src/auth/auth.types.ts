export const enum Role {
  TECHNICRAN = 'TECHNICRAN',
  ADMIN = 'ADMIN',
}

export interface JwtPayload {
  sub: number | string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface RequestUser {
  userId: number;
  role: Role;
}
