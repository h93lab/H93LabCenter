import type { Row } from "../lib/client";

export const ACCOUNT_PASSWORD_MIN_LENGTH = 12;
export const ACCOUNT_PASSWORD_MAX_LENGTH = 72;

export function validateEmailChange(
  currentEmail: string,
  nextEmail: string,
  currentPassword: string,
) {
  const email = nextEmail.trim().toLowerCase();
  if (!email || !currentPassword) return "Complete every field.";
  if (email === currentEmail.trim().toLowerCase()) {
    return "Enter a different email address.";
  }
  return null;
}

export function validatePasswordChange(
  currentPassword: string,
  nextPassword: string,
  confirmation: string,
) {
  if (!currentPassword || !nextPassword || !confirmation) {
    return "Complete every field.";
  }
  if (nextPassword.length < ACCOUNT_PASSWORD_MIN_LENGTH) {
    return `Use at least ${ACCOUNT_PASSWORD_MIN_LENGTH} characters.`;
  }
  if (nextPassword.length > ACCOUNT_PASSWORD_MAX_LENGTH) {
    return `Use no more than ${ACCOUNT_PASSWORD_MAX_LENGTH} characters.`;
  }
  if (nextPassword !== confirmation) return "The new passwords do not match.";
  if (nextPassword === currentPassword) {
    return "The new password must be different from the current password.";
  }
  return null;
}

export function accountAuthMessage(error: unknown) {
  const code = (error as Row | null)?.code;
  if (code === "invalid_credentials")
    return "The current password is incorrect.";
  if (code === "same_password") {
    return "Choose a password you have not used for this account.";
  }
  if (code === "weak_password") {
    return `Use a stronger password with at least ${ACCOUNT_PASSWORD_MIN_LENGTH} characters.`;
  }
  if (code === "email_exists" || code === "user_already_exists") {
    return "That email address is already in use.";
  }
  if (code === "email_address_invalid") return "Enter a valid email address.";
  if (code === "email_address_not_authorized") {
    return "This address cannot receive confirmation emails yet.";
  }
  if (code === "over_email_send_rate_limit") {
    return "Please wait a moment before requesting another email change.";
  }
  if (code === "session_expired" || code === "refresh_token_not_found") {
    return "Your session expired. Sign in again and retry.";
  }
  return "We could not update this account. Please try again.";
}
