import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AppData, Session, User } from '@/types/entities';
import { loadData, loadSession, saveData, saveSession } from '@/lib/storage';
import { isApiMode } from '@/lib/api/config';
import { ApiError } from '@/lib/api/client';
import {
  createBookingApi,
  createClubApi,
  createTournamentApi,
  createUserApi,
  deleteClubApi,
  deleteTournamentApi,
  deleteUserApi,
  fetchAppData,
  fetchSession,
  registerForTournamentApi,
  reviewRegistrationApi,
  saveScorecardApi,
  updateBookingStatusApi,
  updateClubApi,
  updateTournamentApi,
  updateUserApi,
} from '@/lib/api/teevoApi';
import { clearTokens } from '@/lib/auth/tokenStorage';
import * as actions from './actions';

type TeevoContextValue = {
  data: AppData;
  session: Session | null;
  currentUser: User | null;
  error: string | null;
  loading: boolean;
  clearError: () => void;
  login: (email: string) => boolean | Promise<boolean>;
  logout: () => void;
  refreshData: () => void | Promise<void>;
  setSessionUser: (user: User) => void;
  createUser: (input: Omit<User, 'id'>) => boolean | Promise<boolean>;
  updateUser: (id: string, input: Partial<Omit<User, 'id'>>) => boolean | Promise<boolean>;
  deleteUser: (id: string) => void | Promise<void>;
  createClub: (input: Omit<import('@/types/entities').Club, 'id'>) => void | Promise<void>;
  updateClub: (id: string, input: Partial<Omit<import('@/types/entities').Club, 'id'>>) => void | Promise<void>;
  deleteClub: (id: string) => void | Promise<void>;
  createTournament: (input: Omit<import('@/types/entities').Tournament, 'id'>) => boolean | Promise<boolean>;
  updateTournament: (id: string, input: Partial<Omit<import('@/types/entities').Tournament, 'id'>>) => boolean | Promise<boolean>;
  deleteTournament: (id: string) => void | Promise<void>;
  createBooking: (input: {
    playerId: string;
    clubId: string;
    tournamentId: string | null;
    date: string;
    time: string;
  }) => boolean | Promise<boolean>;
  updateBookingStatus: (id: string, status: import('@/types/entities').Booking['status']) => void | Promise<void>;
  saveScorecard: (input: {
    tournamentId: string;
    playerId: string;
    holeScores: number[];
    status: import('@/types/entities').Scorecard['status'];
  }) => boolean | Promise<boolean>;
  registerForTournament: (input: { tournamentId: string; groupId: string }) => boolean | Promise<boolean>;
  reviewRegistration: (input: {
    registrationId: string;
    decision: 'approved' | 'rejected';
    groupId?: string;
    startingHole?: number;
    teeTime?: string;
  }) => boolean | Promise<boolean>;
  joinClub: (clubId: string) => void | Promise<void>;
};

const TeevoContext = createContext<TeevoContextValue | null>(null);

function persist(data: AppData, setData: (d: AppData) => void) {
  saveData(data);
  setData(data);
}

export function TeevoProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => (isApiMode ? emptyAppData() : loadData()));
  const [session, setSession] = useState<Session | null>(() => (isApiMode ? null : loadSession()));
  const [apiUser, setApiUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isApiMode);

  const currentUser = useMemo(() => {
    if (isApiMode) return apiUser;
    return session ? data.users.find((u) => u.id === session.userId) ?? null : null;
  }, [apiUser, data.users, session]);

  const clearError = useCallback(() => setError(null), []);

  const setSessionUser = useCallback((user: User) => {
    setApiUser(user);
    setSession({ userId: user.id });
  }, []);

  const refreshData = useCallback(async () => {
    if (!isApiMode) {
      setData(loadData());
      return;
    }
    setLoading(true);
    try {
      const next = await fetchAppData();
      setData(next);
      if (!apiUser) {
        const sessionRes = await fetchSession().catch(() => null);
        if (sessionRes?.user) setApiUser(sessionRes.user);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [apiUser]);

  useEffect(() => {
    if (isApiMode) void refreshData();
  }, [refreshData]);

  const login = useCallback(
    async (email: string) => {
      if (isApiMode) {
        setError('Use Cognito sign-in when connected to the API');
        return false;
      }
      const user = data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        setError('No account found with this email');
        return false;
      }
      const s = { userId: user.id };
      saveSession(s);
      setSession(s);
      setError(null);
      return true;
    },
    [data.users],
  );

  const logout = useCallback(() => {
    if (isApiMode) {
      clearTokens();
      setApiUser(null);
      setSession(null);
      setData(emptyAppData());
      return;
    }
    saveSession(null);
    setSession(null);
  }, []);

  const apply = useCallback(
    (result: { data: AppData; error?: actions.StoreError }, silent = false) => {
      if (result.error) {
        if (!silent) setError(result.error.message);
        return false;
      }
      persist(result.data, setData);
      setError(null);
      return true;
    },
    [],
  );

  const apiMutate = useCallback(
    async (fn: () => Promise<void>, errMessage = 'Request failed'): Promise<boolean> => {
      try {
        await fn();
        await refreshData();
        setError(null);
        return true;
      } catch (err) {
        setError(err instanceof ApiError ? err.message : errMessage);
        return false;
      }
    },
    [refreshData],
  );

  const apiMutateVoid = useCallback(
    async (fn: () => Promise<void>, errMessage = 'Request failed'): Promise<void> => {
      await apiMutate(fn, errMessage);
    },
    [apiMutate],
  );

  const value = useMemo<TeevoContextValue>(
    () => ({
      data,
      session,
      currentUser,
      error,
      loading,
      clearError,
      login,
      logout,
      refreshData,
      setSessionUser,
      createUser: (input) =>
        isApiMode
          ? apiMutate(() => createUserApi(input))
          : apply(actions.createUser(data, input)),
      updateUser: (id, input) =>
        isApiMode
          ? apiMutate(() => updateUserApi(id, input))
          : apply(actions.updateUser(data, id, input)),
      deleteUser: (id) =>
        isApiMode ? apiMutateVoid(() => deleteUserApi(id)) : persist(actions.deleteUser(data, id), setData),
      createClub: (input) =>
        isApiMode ? apiMutateVoid(() => createClubApi(input)) : persist(actions.createClub(data, input), setData),
      updateClub: (id, input) =>
        isApiMode ? apiMutateVoid(() => updateClubApi(id, input)) : persist(actions.updateClub(data, id, input), setData),
      deleteClub: (id) =>
        isApiMode ? apiMutateVoid(() => deleteClubApi(id)) : persist(actions.deleteClub(data, id), setData),
      createTournament: (input) =>
        isApiMode
          ? apiMutate(() => createTournamentApi(input))
          : apply(actions.createTournament(data, input)),
      updateTournament: (id, input) =>
        isApiMode
          ? apiMutate(() => updateTournamentApi(id, input))
          : apply(actions.updateTournament(data, id, input)),
      deleteTournament: (id) =>
        isApiMode
          ? apiMutateVoid(() => deleteTournamentApi(id))
          : persist(actions.deleteTournament(data, id), setData),
      createBooking: (input) =>
        isApiMode
          ? apiMutate(() => createBookingApi(input))
          : apply(actions.createBooking(data, input)),
      updateBookingStatus: (id, status) =>
        isApiMode
          ? apiMutateVoid(() => updateBookingStatusApi(id, status))
          : persist(actions.updateBookingStatus(data, id, status), setData),
      saveScorecard: (input) =>
        isApiMode
          ? apiMutate(() => saveScorecardApi(input))
          : apply(actions.createOrUpdateScorecard(data, input)),
      registerForTournament: (input) => {
        if (!currentUser) return false;
        return isApiMode
          ? apiMutate(() => registerForTournamentApi(input))
          : apply(actions.registerForTournament(data, { ...input, playerId: currentUser.id }));
      },
      reviewRegistration: (input) => {
        if (!currentUser) return false;
        return isApiMode
          ? apiMutate(() => reviewRegistrationApi(input.registrationId, input))
          : apply(actions.reviewRegistration(data, { ...input, reviewerId: currentUser.id }));
      },
      joinClub: (clubId) => {
        if (!currentUser) return;
        if (isApiMode) {
          void apiMutateVoid(() => updateUserApi(currentUser.id, { clubId }));
          return;
        }
        persist(actions.joinClub(data, currentUser.id, clubId), setData);
      },
    }),
    [
      data,
      session,
      currentUser,
      error,
      loading,
      clearError,
      login,
      logout,
      refreshData,
      setSessionUser,
      apply,
      apiMutate,
      apiMutateVoid,
    ],
  );

  return <TeevoContext.Provider value={value}>{children}</TeevoContext.Provider>;
}

export function useTeevo(): TeevoContextValue {
  const ctx = useContext(TeevoContext);
  if (!ctx) throw new Error('useTeevo must be used within TeevoProvider');
  return ctx;
}

function emptyAppData(): AppData {
  return {
    users: [],
    clubs: [],
    tournaments: [],
    tournamentRegistrations: [],
    bookings: [],
    scorecards: [],
  };
}
