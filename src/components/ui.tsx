import { useEffect, useRef, type ReactNode } from "react";
import { ArrowRight, Inbox, LoaderCircle, X, AlertCircle } from "lucide-react";
import { human } from "../lib/client";
export function Badge({ value }: { value: unknown }) {
  const v = String(value ?? "Unknown");
  return (
    <span
      className={
        "badge " +
        (/BUILD|ready|success|completed|current|published/i.test(v)
          ? "positive"
          : /fail|KILLED|dead|blocked/i.test(v)
            ? "negative"
            : /WATCH|running|queued|validat|partial|budget/i.test(v)
              ? "warning"
              : "")
      }
    >
      {human(v)}
    </span>
  );
}
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <div className="actions">{children}</div>
    </div>
  );
}
export function Empty({
  title = "Nothing here yet",
  text = "Run research to start building your intelligence library.",
  children,
}: {
  title?: string;
  text?: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Inbox size={23} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {children}
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" size={20} /> Loading workspace…
    </div>
  );
}
export function ErrorBox({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  return (
    <div className="error-box" role="alert">
      <AlertCircle size={18} />
      <span>{error instanceof Error ? error.message : String(error)}</span>
      {retry && (
        <button className="button small" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}
export function Dialog({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={wide ? "dialog wide" : "dialog"}
      onCancel={onClose}
    >
      <div className="dialog-head">
        <h2>{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={19} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Metric({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: ReactNode;
  note: string;
  icon?: ReactNode;
}) {
  return (
    <div className="card metric">
      <div className="metric-top">
        {label}
        {icon}
      </div>
      <strong>{value}</strong>
      <span>{note}</span>
    </div>
  );
}
export function Score({
  value,
  label = "Opportunity score",
  onClick,
}: {
  value: number | undefined;
  label?: string;
  onClick?: () => void;
}) {
  return (
    <button
      className="score"
      onClick={onClick}
      aria-label={label + ": " + (value ?? "unknown")}
    >
      <span className="score-value">
        {value === undefined ? "—" : Math.round(value)}
      </span>
      <span>
        <b>{label}</b>
        <small>
          {value === undefined ? "Awaiting analysis" : "out of 100"}{" "}
          {onClick && <ArrowRight size={12} />}
        </small>
      </span>
    </button>
  );
}
export function JSONView({ value }: { value: unknown }) {
  return <pre className="json">{JSON.stringify(value, null, 2)}</pre>;
}
