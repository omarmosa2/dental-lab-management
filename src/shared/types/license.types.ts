// Simple License Types
// Updated: 2025-12-24

export interface LicenseInfo {
  isActivated: boolean;
  machineId: string;
  activatedAt?: number;
  licenseKey?: string;
}

export interface LicenseActivationRequest {
  licenseKey: string;
}

export interface LicenseActivationResponse {
  success: boolean;
  message?: string;
}