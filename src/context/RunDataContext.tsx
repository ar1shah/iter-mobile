// Holds the saved paths + run history for whoever is currently logged in.
// Screens read from here instead of calling the API layer directly so
// everything updates together - e.g. saving a new path on the map screen
// immediately shows up in the Saved Paths tab without needing a manual
// refresh.
//
// Both saved paths and run history are backed by the real backend now
// (src/api/pathsApi.ts and src/api/runsApi.ts).

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { LatLng } from '../utils/geo';
import { runsApi, type Run } from '../api/runsApi';
import { pathsApi, type SavedPath } from '../api/pathsApi';
import { useAuth } from './AuthContext';

export type { SavedPath };

interface RunDataContextValue {
  savedPaths: SavedPath[];
  runs: Run[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  addPath: (name: string, points: LatLng[]) => Promise<SavedPath>;
  deletePath: (id: string) => Promise<void>;
  addRun: (run: Omit<Run, 'id' | 'createdAt'>) => Promise<Run>;
}

const RunDataContext = createContext<RunDataContextValue | undefined>(undefined);

export function RunDataProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [savedPaths, setSavedPaths] = useState<SavedPath[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [isLoading, setIsLoading] = useState(false);

const refresh = useCallback(async () => {
    if (!user) {
      setSavedPaths([]);
      setRuns([]);
      return;
    }

    setIsLoading(true);

    const [pathsResult, runsResult] = await Promise.allSettled([
      pathsApi.getSavedPaths(),
      runsApi.getRuns(),
    ]);

    if (pathsResult.status === 'fulfilled') {
      setSavedPaths(pathsResult.value);
    } else {
      setSavedPaths([]);
    }

    if (runsResult.status === 'fulfilled') {
      setRuns(runsResult.value);
    } else {
      setRuns([]);
    }

    setIsLoading(false);
  }, [user]);

  // Reload whenever the logged-in user changes (login, logout, switching accounts).
  useEffect(() => {
    if (authLoading) {
      return;
    }

    void refresh();
  }, [authLoading, refresh]);

  const addPath = useCallback(
    async (name: string, points: LatLng[]) => {
      if (!user) throw new Error('Must be signed in to save a path');
      const path = await pathsApi.savePath(name, points);
      setSavedPaths((prev) => [path, ...prev]);
      return path;
    },
    [user],
  );

  const deletePath = useCallback(
    async (id: string) => {
      if (!user) throw new Error('Must be signed in to delete a path');
      await pathsApi.deletePath(id);
      setSavedPaths((prev) => prev.filter((p) => p.id !== id));
    },
    [user],
  );

  const addRun = useCallback(
    async (run: Omit<Run, 'id' | 'createdAt'>) => {
      if (!user) throw new Error('Must be signed in to save a run');
      const record = await runsApi.saveRun(run);
      setRuns((prev) => [record, ...prev]);
      return record;
    },
    [user],
  );

  const value = useMemo(
    () => ({ savedPaths, runs, isLoading, refresh, addPath, deletePath, addRun }),
    [savedPaths, runs, isLoading, refresh, addPath, deletePath, addRun],
  );

  return <RunDataContext.Provider value={value}>{children}</RunDataContext.Provider>;
}

export function useRunData(): RunDataContextValue {
  const ctx = useContext(RunDataContext);
  if (!ctx) throw new Error('useRunData must be used inside a RunDataProvider');
  return ctx;
}
