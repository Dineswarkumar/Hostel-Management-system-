/**
 * Re-export the auth feature — features are imported as `@/features/auth`.
 */
export * from "./types";
export { useAuth, AuthProvider } from "./hooks";
export { authService } from "./service";
export { RoleGuard } from "./role-guard";
