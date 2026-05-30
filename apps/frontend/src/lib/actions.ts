'use server';

import { cookies } from 'next/headers';
import { api } from './api/serverFetch';
import { decodeJwt } from './utils/jwt';
import type {
  LoginDto,
  LoginResponseDto,
  AdminCreateUserDto,
  AdminUpdateUserDto,
  UserResponseDto,
  CreateQcTestDto,
  UpdateQcTestDto,
  QcTestResponseDto,
  CreateQcResultDto,
  QcResultResponseDto,
  CreateMachineDto,
  MachineResponseDto,
  UpdateMachineDto,
  CreateControlLotDto,
  ControlLotResponseDto,
  UpdateControlLotDto,
} from './types/api';

import { revalidatePath } from 'next/cache';

// ===================================================================
// Auth Actions
// ===================================================================

export async function loginAccount(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Please enter both email and password' };
  }

  try {
    const payload: LoginDto = { email, password };
    const response = await api.post<LoginResponseDto>(
      '/api/v1/auth/login',
      payload,
    );

    if (!response?.accessToken) {
      return { error: 'Invalid credentials.' };
    }

    const token = response.accessToken;
    const cookieStore = await cookies();

    // Store the JWT token (httpOnly for server components)
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    // Decode the JWT to get userId and role
    const jwtPayload = decodeJwt(token);
    if (!jwtPayload) {
      return { error: 'Failed to decode authentication token.' };
    }

    // Fetch full user info from the API
    let user: UserResponseDto | null = null;
    try {
      user = await api.get<UserResponseDto>(
        `/api/v1/users/${jwtPayload.userId}`,
      );
    } catch {
      // If user fetch fails, we still have userId and role from JWT
    }

    // Store user info in a cookie for SSR/server-side usage
    const userInfo = user ?? {
      id: jwtPayload.userId,
      firstName: '',
      lastName: '',
      email,
      role: jwtPayload.role,
      isActive: true,
      sectionIds: [],
      sectionNames: [],
      createdAt: new Date().toISOString(),
    };
    cookieStore.set('user_info', JSON.stringify(userInfo), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    // Return token + user to the client so it can hydrate the Zustand store
    return {
      success: true,
      token,
      user: userInfo as UserResponseDto,
    };
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error
          ? error.message
          : 'Failed to login. Please try again.',
    };
  }
}

export async function logoutAccount() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
  cookieStore.delete('user_info');
  return { success: true };
}

// ===================================================================
// User Actions
// ===================================================================

export async function createUser(payload: AdminCreateUserDto) {
  try {
    const user = await api.post<UserResponseDto>('/api/v1/users', payload);
    return { success: true, data: user };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : 'Failed to create user.',
    };
  }
}

export async function deleteUser(userId: number) {
  try {
    await api.delete(`/api/v1/users/${userId}`);
    return { success: true };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : 'Failed to delete user.',
    };
  }
}

export async function updateUser(userId: number, payload: AdminUpdateUserDto) {
  try {
    const user = await api.patch<UserResponseDto>(
      `/api/v1/users/${userId}`,
      payload,
    );
    return { success: true, data: user };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : 'Failed to update user.',
    };
  }
}

// ===================================================================
// Machine Actions
// ===================================================================

export async function createMachine(payload: CreateMachineDto) {
  try {
    await api.post<MachineResponseDto>('/api/v1/machines', payload);
    revalidatePath('/dashboard');
    revalidatePath('/monitor');
    return { success: true };
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : 'Failed to create machine.',
    };
  }
}

export async function updateMachine(machineId: number, payload: UpdateMachineDto) {
  try {
    await api.patch<MachineResponseDto>(`/api/v1/machines/${machineId}`, payload);
    revalidatePath('/machines');
    revalidatePath('/dashboard');
    revalidatePath('/monitor');
    return { success: true };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : 'Failed to update machine.',
    };
  }
}

export async function deleteMachine(machineId: number) {
  try {
    await api.delete(`/api/v1/machines/${machineId}`);
    revalidatePath('/machines');
    revalidatePath('/dashboard');
    revalidatePath('/monitor');
    return { success: true };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : 'Failed to delete machine.',
    };
  }
}

// ===================================================================
// QC Test Actions
// ===================================================================

export async function createQcTest(payload: CreateQcTestDto) {
  try {
    await api.post<QcTestResponseDto>('/api/v1/qc-tests', payload);
    revalidatePath('/qc');
    revalidatePath('/qc-tests');
    return { success: true };
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : 'Failed to create QC test.',
    };
  }
}

export async function updateQcTest(testId: number, payload: UpdateQcTestDto) {
  try {
    await api.patch<QcTestResponseDto>(`/api/v1/qc-tests/${testId}`, payload);
    revalidatePath('/qc');
    revalidatePath('/qc-tests');
    return { success: true };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : 'Failed to update QC test.',
    };
  }
}

// ===================================================================
// QC Result Actions
// ===================================================================

export async function submitQcResult(payload: CreateQcResultDto) {
  try {
    const result = await api.post<QcResultResponseDto>(
      '/api/v1/qc-results',
      payload,
    );
    revalidatePath('/qc');
    revalidatePath('/monitor');
    return { success: true, data: result };
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : 'Failed to submit QC result.',
    };
  }
}

export async function updateQcResult(resultId: number, payload: UpdateQcResultDto) {
  try {
    await api.patch(`/api/v1/qc-results/${resultId}`, payload);
    revalidatePath('/qc');
    return { success: true };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : 'Failed to update QC result.',
    };
  }
}

// ===================================================================
// Control Lot Actions
// ===================================================================

export async function createControlLot(payload: CreateControlLotDto) {
  try {
    const lot = await api.post<ControlLotResponseDto>(
      '/api/v1/control-lots',
      payload,
    );
    revalidatePath('/qc');
    revalidatePath('/control-lots');
    return { success: true, data: lot };
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create control lot.',
    };
  }
}

export async function updateControlLot(lotId: number, payload: UpdateControlLotDto) {
  try {
    const lot = await api.patch<ControlLotResponseDto>(
      `/api/v1/control-lots/${lotId}`,
      payload,
    );
    revalidatePath('/control-lots');
    revalidatePath('/qc');
    revalidatePath('/monitor');
    return { success: true, data: lot };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : 'Failed to update control lot.',
    };
  }
}

export async function deactivateControlLot(lotId: number) {
  try {
    await api.delete(`/api/v1/control-lots/${lotId}`);
    revalidatePath('/control-lots');
    revalidatePath('/qc');
    revalidatePath('/monitor');
    return { success: true };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : 'Failed to deactivate control lot.',
    };
  }
}
