import { useEffect, useState } from "react";
import { NavLink, Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Compass,
  Activity,
  Globe2,
  Layers,
  Radio,
  Telescope,
  MessageSquare,
  Database,
  Lightbulb,
  Bookmark,
  Eye,
  FolderKanban,
  FlaskConical,
  ListTodo,
  BrainCircuit,
  SlidersHorizontal,
  ChevronDown,
  Search,
  Sun,
  Moon,
  PanelLeftClose,
  Menu,
  LogOut,
  ArrowUpRight,
  Command,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, supabase, human } from "../lib/client";
import { Dialog, ErrorBox } from "../components/ui";
const groups: {
  name: string;
  items: [string, string, typeof LayoutDashboard][];
}[] = [
  {
    name: "Workspace",
    items: [
      ["Overview", "/", LayoutDashboard],
      ["Daily opportunity", "/discover/daily", Lightbulb],
      ["Opportunities", "/opportunities", Compass],
      ["Ideas", "/ideas", Layers],
      ["Projects", "/projects", FolderKanban],
    ],
  },
  {
    name: "Intelligence",
    items: [
      ["Trends", "/discover/trends", Activity],
      ["Markets", "/discover/markets", Globe2],
      ["Signals", "/intelligence/signals", Radio],
      ["Competitors", "/intelligence/competitors", Telescope],
      ["Review intelligence", "/intelligence/reviews", MessageSquare],
      ["Market gaps", "/intelligence/gaps", Eye],
    ],
  },
  {
    name: "Operations",
    items: [
      ["Research runs", "/research/runs", FlaskConical],
      ["Job monitor", "/research/jobs", ListTodo],
      ["Sources", "/intelligence/sources", Database],
      ["AI & models", "/ai", BrainCircuit],
      ["Settings", "/settings/research", SlidersHorizontal],
    ],
  },
];
export function Shell() {
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [collapsed, setCollapsed] = useState(false),
    [mobile, setMobile] = useState(false),
    [search, setSearch] = useState(false),
    [term, setTerm] = useState(""),
    [error, setError] = useState<unknown>(null);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("h93-theme") || "system",
  );
  const { data } = useQuery({
    queryKey: ["bootstrap"],
    queryFn: () => api("/bootstrap"),
    staleTime: 15000,
  });
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () =>
      document.documentElement.classList.toggle(
        "dark",
        theme === "dark" || (theme === "system" && media.matches),
      );
    apply();
    media.addEventListener("change", apply);
    localStorage.setItem("h93-theme", theme);
    return () => media.removeEventListener("change", apply);
  }, [theme]);
  useEffect(() => {
    setMobile(false);
  }, [location.pathname]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearch(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);
  const result = useQuery({
    queryKey: ["search", term],
    queryFn: () => api("/table/ideas?q=" + encodeURIComponent(term)),
    enabled: search && term.length > 1,
  });
  return (
    <div
      className={
        "workspace " +
        (collapsed ? "collapsed " : "") +
        (mobile ? "mobile-open" : "")
      }
    >
      <aside className="sidebar">
        <Link to="/" className="brand">
          <span className="brand-mark">
            H<span>93</span>
          </span>
          <span className="brand-name">
            H93Lab<span>INTELLIGENCE CENTER</span>
          </span>
        </Link>
        <div className="workspace-switch">
          <span className="avatar">H</span>
          <span>
            <b>Personal workspace</b>
            <small>Mobile opportunity lab</small>
          </span>
          <ChevronDown size={14} />
        </div>
        <nav>
          {groups.map((group) => (
            <div className="nav-group" key={group.name}>
              <span className="nav-label">{group.name}</span>
              {group.items.map(([label, path, Icon]) => (
                <NavLink
                  key={path}
                  to={path}
                  end={path === "/" || path === "/ai"}
                  title={label}
                  className={({ isActive }) =>
                    "nav-item " + (isActive ? "active" : "")
                  }
                >
                  <Icon size={18} />
                  <span>{label}</span>
                  {label === "Overview" && <span className="nav-dot" />}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="status-dot" />
          <span>Evidence first. Always.</span>
          <ArrowUpRight size={13} />
        </div>
      </aside>
      {mobile && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <main className="main">
        <header className="topbar">
          <button
            className="icon-button desktop-only"
            aria-label="Toggle sidebar"
            onClick={() => setCollapsed(!collapsed)}
          >
            <PanelLeftClose size={19} />
          </button>
          <button
            className="icon-button mobile-only"
            aria-label="Open navigation"
            onClick={() => setMobile(true)}
          >
            <Menu size={21} />
          </button>
          <div className="breadcrumb">
            Workspace <span>/</span>
            <b>
              {human(
                location.pathname.split("/").filter(Boolean)[0] || "Overview",
              )}
            </b>
          </div>
          <div className="topbar-end">
            <button className="search-trigger" onClick={() => setSearch(true)}>
              <Search size={16} />
              <span>Search intelligence…</span>
              <kbd>
                <Command size={11} /> K
              </kbd>
            </button>
            <button
              className="icon-button"
              aria-label="Toggle color theme"
              onClick={() =>
                setTheme(
                  document.documentElement.classList.contains("dark")
                    ? "light"
                    : "dark",
                )
              }
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <span className="top-divider" />
            <details className="account-menu">
              <summary className="avatar" aria-label="Account menu">
                {data?.profile?.display_name?.[0] || "H"}
              </summary>
              <div className="account-popup">
                <b>{data?.profile?.display_name || "Owner"}</b>
                <Link to="/settings/account">Account settings</Link>
                <button
                  onClick={async () => {
                    const { error } = await supabase.auth.signOut();
                    if (error) setError(error);
                    else {
                      qc.clear();
                      navigate("/login");
                    }
                  }}
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            </details>
          </div>
        </header>
        <div className="page-content">
          {!!error && <ErrorBox error={error} />}
          <Outlet />
        </div>
        <footer className="page-footer">
          <span>H93LAB © {new Date().getFullYear()}</span>
          <span>From evidence to your next build.</span>
        </footer>
      </main>
      {search && (
        <Dialog title="Search intelligence" onClose={() => setSearch(false)}>
          <input
            autoFocus
            placeholder="Search ideas or pages…"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
          <div className="search-results">
            {groups
              .flatMap((g) => g.items)
              .filter(([label]) =>
                label.toLowerCase().includes(term.toLowerCase()),
              )
              .slice(0, 5)
              .map(([label, path, Icon]) => (
                <Link key={path} to={path} onClick={() => setSearch(false)}>
                  <Icon size={17} />
                  {label}
                  <small>Page</small>
                </Link>
              ))}
            {result.data?.items?.map((x: any) => (
              <Link
                key={x.id}
                to={"/ideas/" + x.id}
                onClick={() => setSearch(false)}
              >
                <Lightbulb size={17} />
                {x.title}
                <small>Idea</small>
              </Link>
            ))}
          </div>
        </Dialog>
      )}
    </div>
  );
}
