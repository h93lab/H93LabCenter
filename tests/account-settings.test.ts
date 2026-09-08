import assert from "node:assert/strict";
import test from "node:test";
import {
  ACCOUNT_PASSWORD_MAX_LENGTH,
  ACCOUNT_PASSWORD_MIN_LENGTH,
  accountAuthMessage,
  validateEmailChange,
  validatePasswordChange,
} from "../src/features/account-validation";

test("email changes require a different address and current password", () => {
  assert.equal(
    validateEmailChange("owner@example.com", "OWNER@example.com", "secret"),
    "Enter a different email address.",
  );
  assert.equal(
    validateEmailChange("owner@example.com", "next@example.com", ""),
    "Complete every field.",
  );
  assert.equal(
    validateEmailChange("owner@example.com", "next@example.com", "secret"),
    null,
  );
});

test("password changes enforce length, confirmation and rotation", () => {
  assert.equal(
    validatePasswordChange("old-password", "short", "short"),
    `Use at least ${ACCOUNT_PASSWORD_MIN_LENGTH} characters.`,
  );
  const tooLong = "a".repeat(ACCOUNT_PASSWORD_MAX_LENGTH + 1);
  assert.equal(
    validatePasswordChange("old-password", tooLong, tooLong),
    `Use no more than ${ACCOUNT_PASSWORD_MAX_LENGTH} characters.`,
  );
  assert.equal(
    validatePasswordChange(
      "old-password",
      "a-secure-new-password",
      "different",
    ),
    "The new passwords do not match.",
  );
  assert.equal(
    validatePasswordChange(
      "a-secure-password",
      "a-secure-password",
      "a-secure-password",
    ),
    "The new password must be different from the current password.",
  );
  assert.equal(
    validatePasswordChange(
      "a-secure-password",
      "a-secure-new-password",
      "a-secure-new-password",
    ),
    null,
  );
});

test("authentication errors become clear account messages", () => {
  assert.equal(
    accountAuthMessage({ code: "invalid_credentials" }),
    "The current password is incorrect.",
  );
  assert.equal(
    accountAuthMessage({ code: "email_exists" }),
    "That email address is already in use.",
  );
  assert.equal(
    accountAuthMessage({ code: "session_expired" }),
    "Your session expired. Sign in again and retry.",
  );
});
