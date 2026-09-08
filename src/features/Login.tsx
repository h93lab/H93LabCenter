import { useState, type FormEvent } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/client";
export default function Login() {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error)
        setError(
          error.code === "invalid_credentials"
            ? "Invalid email or password."
            : "Unable to sign in. Please try again.",
        );
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-page">
      <div className="login-art">
        <div className="brand light-brand">
          <span className="brand-mark">
            H<span>93</span>
          </span>
          <b>H93Lab</b>
        </div>
        <div className="login-message">
          <span className="eyebrow">YOUR NEXT BUILD STARTS HERE</span>
          <h1>
            Better evidence.
            <br />
            Clearer decisions.
            <br />
            <span>Stronger products.</span>
          </h1>
          <p>
            A private workspace to discover mobile opportunities and turn the
            right idea into a complete development blueprint.
          </p>
          <div className="login-flow">
            <span>Discover</span>
            <ArrowRight size={15} />
            <span>Validate</span>
            <ArrowRight size={15} />
            <span>Blueprint</span>
          </div>
        </div>
        <small>
          Built for an independent builder. Designed for considered decisions.
        </small>
      </div>
      <div className="login-form-wrap">
        <form className="login-form" onSubmit={submit}>
          <span className="login-shield">
            <ShieldCheck size={25} />
          </span>
          <h2>Welcome to your lab</h2>
          <p>Sign in to your private workspace.</p>
          <label>
            Email address
            <input
              type="email"
              autoComplete="username"
              autoCapitalize="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={busy}
              placeholder="you@example.com"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={busy}
              placeholder="Enter your password"
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="button primary" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
            <ArrowRight size={16} />
          </button>
          <small className="private-note">
            <ShieldCheck size={13} /> Private access · Your research stays yours
          </small>
        </form>
      </div>
    </div>
  );
}
