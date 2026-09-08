import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/client";
const Context = createContext<{ session: Session | null; loading: boolean }>({
  session: null,
  loading: true,
});
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState({
    session: null as Session | null,
    loading: true,
  });
  useEffect(() => {
    let alive = true;
    let revision = 0;
    let currentOwner: string | undefined;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      revision++;
      if (currentOwner !== session?.user.id) {
        queryClient.clear();
        currentOwner = session?.user.id;
      }
      if (alive) setState({ session, loading: false });
    });
    const initial = revision;
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (alive && revision === initial)
          setState({ session: error ? null : data.session, loading: false });
      })
      .catch(() => {
        if (alive) setState({ session: null, loading: false });
      });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);
  return <Context.Provider value={state}>{children}</Context.Provider>;
}
export const useAuth = () => useContext(Context);
