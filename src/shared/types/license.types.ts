// License Types
// Created: 2025-01-11

export interface LicenseInfo {
  hardwareId: string;
  isActivated: boolean;
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

