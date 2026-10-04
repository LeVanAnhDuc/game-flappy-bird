export interface DuckerEnv {
  enabled: string | undefined;
  issuer: string | undefined;
  clientId: string | undefined;
  scope: string | undefined;
  profilePath: string | undefined;
}

export interface DuckerConfig {
  issuer: string;
  clientId: string;
  scope: string;
  profileUrl: string;
}

export interface DuckerProfile {
  sub: string;
  name?: string;
  email?: string;
  email_verified?: boolean;
  picture?: string | null;
}

export interface PendingAuth {
  state: string;
  verifier: string;
  returnTo: string;
}

export interface CallbackResult {
  code?: string;
  verifier?: string;
  error?: string;
  returnTo?: string;
}

export type AuthStatus = "idle" | "loading" | "signed-in" | "signed-out";

export interface AuthSnapshot {
  status: AuthStatus;
  profile: DuckerProfile | null;
}
