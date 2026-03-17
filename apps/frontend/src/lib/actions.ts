"use server";

import { cookies } from "next/headers";
import { api } from "./api/serverFetch";
import {
  LoginDto,
  LoginResponseDto,
  AdminCreateUserDto,
  AdminUpdateUserDto,
  UserResponseDto,
  CreateQcTestDto,
  QcTestResponseDto,
  CreateQcResultDto,
  QcResultResponseDto,
  CreateMachineDto,
  MachineResponseDto,
  CreateControlLotDto,
  ControlLotResponseDto,
} from "./types/api";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// ===================================================================
// Auth Actions
// ===================================================================

export async function loginAccount(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Please enter both email and password" };
  }

  try {
    const payload: LoginDto = { email, password };
    const response = await api.post<LoginResponseDto>("/api/v1/auth/login", payload);

    if (response && response.access_token) {
      const cookieStore = await cookies();
      cookieStore.set("auth_token", response.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });

      return { success: true };
    } else {
      return { error: "Invalid credentials." };
    }
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "Failed to login. Please try again." };
  }
}

export async function logoutAccount() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  redirect("/login");
}

// ===================================================================
// User Actions
// ===================================================================

export async function createUser(payload: AdminCreateUserDto) {
  try {
    await api.post<UserResponseDto>("/api/v1/users", payload);
    revalidatePath("/users");
    return { success: true };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "Failed to create user." };
  }
}

export async function deleteUser(userId: number) {
  try {
    await api.delete(`/api/v1/users/${userId}`);
    revalidatePath("/users");
    return { success: true };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "Failed to delete user." };
  }
}

export async function updateUser(userId: number, payload: AdminUpdateUserDto) {
  try {
    await api.patch(`/api/v1/users/${userId}`, payload);
    revalidatePath("/users");
    return { success: true };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "Failed to update user." };
  }
}

// ===================================================================
// Machine Actions
// ===================================================================

export async function createMachine(payload: CreateMachineDto) {
  try {
    await api.post<MachineResponseDto>("/api/v1/machines", payload);
    revalidatePath("/dashboard");
    revalidatePath("/monitor");
    return { success: true };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "Failed to create machine." };
  }
}

// ===================================================================
// QC Test Actions
// ===================================================================

export async function createQcTest(payload: CreateQcTestDto) {
  try {
    await api.post<QcTestResponseDto>("/api/v1/qc-tests", payload);
    revalidatePath("/qc");
    return { success: true };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "Failed to create QC test." };
  }
}

// ===================================================================
// QC Result Actions
// ===================================================================

export async function submitQcResult(payload: CreateQcResultDto) {
  try {
    const result = await api.post<QcResultResponseDto>("/api/v1/qc-results", payload);
    revalidatePath("/qc");
    revalidatePath("/monitor");
    return { success: true, data: result };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "Failed to submit QC result." };
  }
}

// ===================================================================
// Control Lot Actions
// ===================================================================

export async function createControlLot(payload: CreateControlLotDto) {
  try {
    const lot = await api.post<ControlLotResponseDto>("/api/v1/control-lots", payload);
    revalidatePath("/qc");
    return { success: true, data: lot };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "Failed to create control lot." };
  }
}
