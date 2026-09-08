import { useId, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Save,
  UserRound,
} from "lucide-react";
import { useAuth } from "../app/Auth";
import { supabase, type Row } from "../lib/client";
import {
  ACCOUNT_PASSWORD_MAX_LENGTH,
  ACCOUNT_PASSWORD_MIN_LENGTH,
  accountAuthMessage,
  validateEmailChange,
  validatePasswordChange,
} from "./account-validation";

type Status = { kind: "success" | "error"; text: string } | null;

function FormStatus({ status }: { status: Status }) {
  if (!status) return null;
  return (
    <div
      className={`form-message ${status.kind}`}
      role={status.kind === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      {status.kind === "success" && <CheckCircle2 size={16} />}
      <span>{status.text}</span>
    </div>
  );
}

function PasswordField({
  label,
  name,
  autoComplete,
  minLength,
  maxLength,
  hint,
}: {
  label: string;
  name: string;
  autoComplete: string;
  minLength?: number;
  maxLength?: number;
  hint?: string;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const [visible, setVisible] = useState(false);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="password-input">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          minLength={minLength}
          maxLength={maxLength}
          aria-describedby={hint ? hintId : undefined}
          required
        />
        <button
          type="button"
          className="password-toggle"
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-pressed={visible}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
      {hint && (
        <small id={hintId} className="field-help">
          {hint}
        </small>
      )}
    </div>
  );
}

export function AccountSettings({
  displayName,
  onSaveProfile,
}: {
  displayName: string;
  onSaveProfile: (name: string) => Promise<boolean>;
}) {
  const { session } = useAuth();
  const currentEmail = session?.user.email || "Unavailable";
  const pendingEmail = (session?.user as Row | undefined)?.new_email as
    string | undefined;
  const [profileBusy, setProfileBusy] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [profileStatus, setProfileStatus] = useState<Status>(null);
  const [emailStatus, setEmailStatus] = useState<Status>(null);
  const [passwordStatus, setPasswordStatus] = useState<Status>(null);

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (profileBusy) return;
    setProfileBusy(true);
    setProfileStatus(null);
    try {
      const name = String(
        new FormData(event.currentTarget).get("name") || "",
      ).trim();
      const ok = await onSaveProfile(name);
      setProfileStatus(
        ok
          ? { kind: "success", text: "Profile details updated." }
          : { kind: "error", text: "Profile details could not be updated." },
      );
    } finally {
      setProfileBusy(false);
    }
  }

  async function updateEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (emailBusy) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const email = String(values.get("email") || "")
      .trim()
      .toLowerCase();
    const currentPassword = String(values.get("email_current_password") || "");
    setEmailStatus(null);
    const validationError = validateEmailChange(
      currentEmail,
      email,
      currentPassword,
    );
    if (validationError) {
      setEmailStatus({ kind: "error", text: validationError });
      return;
    }
    setEmailBusy(true);
    try {
      const verification = await supabase.auth.signInWithPassword({
        email: currentEmail,
        password: currentPassword,
      });
      if (verification.error) throw verification.error;
      const { error } = await supabase.auth.updateUser(
        { email },
        { emailRedirectTo: `${window.location.origin}/settings/account` },
      );
      if (error) throw error;
      form.reset();
      setEmailStatus({
        kind: "success",
        text: `Confirmation sent to ${email}. The address changes after you confirm it.`,
      });
    } catch (error) {
      setEmailStatus({ kind: "error", text: accountAuthMessage(error) });
    } finally {
      setEmailBusy(false);
    }
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (passwordBusy) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const currentPassword = String(values.get("current_password") || "");
    const password = String(values.get("new_password") || "");
    const confirmation = String(values.get("confirm_password") || "");
    setPasswordStatus(null);
    const validationError = validatePasswordChange(
      currentPassword,
      password,
      confirmation,
    );
    if (validationError) {
      setPasswordStatus({ kind: "error", text: validationError });
      return;
    }
    setPasswordBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({
        current_password: currentPassword,
        password,
      });
      if (error) throw error;
      form.reset();
      setPasswordStatus({
        kind: "success",
        text: "Password updated securely.",
      });
    } catch (error) {
      setPasswordStatus({ kind: "error", text: accountAuthMessage(error) });
    } finally {
      setPasswordBusy(false);
    }
  }

  return (
    <div className="account-settings">
      <section className="card account-summary">
        <div className="account-summary-icon" aria-hidden="true">
          <UserRound size={22} />
        </div>
        <div>
          <span className="eyebrow">SIGNED-IN OWNER</span>
          <h2>{displayName || "Workspace owner"}</h2>
          <p>{currentEmail}</p>
          {pendingEmail && <small>Pending email: {pendingEmail}</small>}
        </div>
      </section>

      <div className="account-grid">
        <form
          className="card settings-form"
          onSubmit={updateProfile}
          aria-busy={profileBusy}
        >
          <div className="form-section-heading">
            <span className="section-icon">
              <UserRound size={18} />
            </span>
            <div>
              <h2>Profile</h2>
              <p>Choose the name shown around your workspace.</p>
            </div>
          </div>
          <label>
            Display name
            <input
              name="name"
              defaultValue={displayName}
              maxLength={80}
              autoComplete="name"
              required
            />
          </label>
          <FormStatus status={profileStatus} />
          <div className="form-footer">
            <button className="button primary" disabled={profileBusy}>
              <Save size={16} />
              {profileBusy ? "Saving…" : "Save profile"}
            </button>
          </div>
        </form>

        <form
          className="card settings-form"
          onSubmit={updateEmail}
          aria-busy={emailBusy}
        >
          <div className="form-section-heading">
            <span className="section-icon">
              <Mail size={18} />
            </span>
            <div>
              <h2>Email address</h2>
              <p>A confirmation link will be sent to the new address.</p>
            </div>
          </div>
          <label>
            Current email
            <input value={currentEmail} readOnly aria-readonly="true" />
          </label>
          <label>
            New email address
            <input
              name="email"
              type="email"
              autoComplete="email"
              autoCapitalize="off"
              required
            />
          </label>
          <PasswordField
            label="Current password"
            name="email_current_password"
            autoComplete="current-password"
            maxLength={ACCOUNT_PASSWORD_MAX_LENGTH}
            hint="Required to protect changes to your sign-in email."
          />
          <FormStatus status={emailStatus} />
          <div className="form-footer">
            <button className="button primary" disabled={emailBusy}>
              <Mail size={16} />
              {emailBusy ? "Sending…" : "Update email"}
            </button>
          </div>
        </form>

        <form
          className="card settings-form"
          onSubmit={updatePassword}
          aria-busy={passwordBusy}
        >
          <div className="form-section-heading">
            <span className="section-icon">
              <LockKeyhole size={18} />
            </span>
            <div>
              <h2>Password</h2>
              <p>Use a unique password you do not use anywhere else.</p>
            </div>
          </div>
          <PasswordField
            label="Current password"
            name="current_password"
            autoComplete="current-password"
            maxLength={ACCOUNT_PASSWORD_MAX_LENGTH}
          />
          <PasswordField
            label="New password"
            name="new_password"
            autoComplete="new-password"
            minLength={ACCOUNT_PASSWORD_MIN_LENGTH}
            maxLength={ACCOUNT_PASSWORD_MAX_LENGTH}
            hint={`Between ${ACCOUNT_PASSWORD_MIN_LENGTH} and ${ACCOUNT_PASSWORD_MAX_LENGTH} characters. A password manager is recommended.`}
          />
          <PasswordField
            label="Confirm new password"
            name="confirm_password"
            autoComplete="new-password"
            minLength={ACCOUNT_PASSWORD_MIN_LENGTH}
            maxLength={ACCOUNT_PASSWORD_MAX_LENGTH}
          />
          <FormStatus status={passwordStatus} />
          <div className="form-footer">
            <button className="button primary" disabled={passwordBusy}>
              <LockKeyhole size={16} />
              {passwordBusy ? "Updating…" : "Update password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
