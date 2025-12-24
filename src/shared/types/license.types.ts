// Hardware-Bound License Types
// Updated: 2025-01-23

export interface LicenseInfo {
  isActivated: boolean;
  hardwareId: string;
  activatedAt?: number;
  licenseKey?: string;
}

export interface LicenseActivationRequest {
  activationKey: string;
}

export interface LicenseActivationResponse {
  success: boolean;
  message?: string;
}