export enum Role {
  TECHNICIAN = 'TECHNICIAN',
  ADMIN = 'ADMIN',
}

export interface JwtPayload {
  userId: number | string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface RequestUser {
  userId: number;
  role: Role;
}

export enum Specialization {
  HEMATOLOGY = 'HEMATOLOGY',
  CHEMISTRY = 'CHEMISTRY',
  MICROBIOLOGY = 'MICROBIOLOGY',
  IMMUNOLOGY = 'IMMUNOLOGY',
  OTHER = 'OTHER',
}
