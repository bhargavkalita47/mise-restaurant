import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { restaurantService, isDemo } from '../services';
import { safeError } from '../lib/format';
import type { RestaurantState } from '../models/types';

type Toast = { id: number; kind: 'success' | 'error'; text: string } | null;
interface AppContextType {
  data: RestaurantState | null;
  loading: boolean;
  busy: boolean;
  error: string | null;
  toast: Toast;
  dismissToast(): void;
  run(action: () => Promise<unknown>, successText: string): Promise<boolean>;
  reload(): Promise<void>;
  demo: boolean;
}
const Context = createContext<AppContextType | undefined>(undefined);
export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<RestaurantState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const reload = useCallback(async () => {
    try { const state = await restaurantService.getState(); setData(state); setError(null); }
    catch (err) { setError(safeError(err)); }
  }, []);
  useEffect(() => {
    let active = true;
    restaurantService.getState().then((state) => { if (active) setData(state); }).catch((err: unknown) => { if (active) setError(safeError(err)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const run = useCallback(async (action: () => Promise<unknown>, successText: string) => {
    setBusy(true);
    try {
      await action();
      await reload();
      setToast({ id: Date.now(), kind: 'success', text: successText });
      return true;
    } catch (err) {
      setToast({ id: Date.now(), kind: 'error', text: safeError(err) });
      return false;
    } finally { setBusy(false); }
  }, [reload]);
  return <Context.Provider value={{ data, loading, busy, error, toast, dismissToast: () => setToast(null), run, reload, demo: isDemo }}>{children}</Context.Provider>;
}
export function useApp() {
  const context = useContext(Context);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}
