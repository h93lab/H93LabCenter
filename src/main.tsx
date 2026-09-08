import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./app/Auth";
import { Shell } from "./app/Shell";
import { Loading, ErrorBox } from "./components/ui";
import "@fontsource-variable/cairo";
import "./styles.css";
const Login = lazy(() => import("./features/Login"));
const Dashboard = lazy(() => import("./features/Dashboard"));
const Explorer = lazy(() => import("./features/Explorer"));
const Idea = lazy(() => import("./features/Idea"));
const Project = lazy(() => import("./features/Project"));
const Settings = lazy(() => import("./features/Settings"));
const client = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 5000, refetchOnWindowFocus: false },
  },
});
function Protected() {
  const { session, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Loading />;
  return session ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: loc.pathname + loc.search }} replace />
  );
}
function Guest() {
  const { session, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Loading />;
  const from = loc.state?.from;
  const target =
    typeof from === "string" && /^\/(?!\/|\\)/.test(from) ? from : "/";
  return session ? <Navigate to={target} replace /> : <Login />;
}
class Boundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    return this.state.error ? (
      <div className="page-content">
        <ErrorBox error={this.state.error} />
        <button className="button" onClick={() => location.reload()}>
          Reload workspace
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Boundary>
      <QueryClientProvider client={client}>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<Loading />}>
              <Routes>
                <Route path="/login" element={<Guest />} />
                <Route element={<Protected />}>
                  <Route element={<Shell />}>
                    <Route index element={<Dashboard />} />
                    <Route path="ideas/:id" element={<Idea />} />
                    <Route path="projects/:id/*" element={<Project />} />
                    <Route path="settings/*" element={<Settings />} />
                    <Route path="ai/*" element={<Settings />} />
                    <Route path="*" element={<Explorer />} />
                  </Route>
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </Boundary>
  </React.StrictMode>,
);
