// Shared types — they mirror the backend JSON (camelCase).

export type Role = 'admin' | 'user'

export interface User {
  id: number
  name: string
  email: string
  role: Role
  createdAt: string
}

// ---- Auth ----

export interface AuthResponse {
  accessToken: string
  user: User
}

export interface LoginInput {
  email: string
  password: string
  // Admin login: the server refuses non-admin accounts (403 NOT_ADMIN).
  asAdmin?: boolean
}

export interface RegisterInput {
  name: string
  email: string
  password: string
}

// ---- Errors ----

// Every backend error has this shape: { error: { code, message } }
export interface ApiErrorBody {
  error: {
    code: string
    message: string
  }
}
