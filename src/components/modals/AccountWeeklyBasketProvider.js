'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const WeeklyBasketContext = createContext(null);

export function AccountWeeklyBasketProvider({ initial, children }) {
  const [current, setCurrent] = useState(initial);
  const [pending, setPending] = useState(0);
  const [failed, setFailed] = useState(false);
  const queue = useRef(Promise.resolve());

  const accept = useCallback(snapshot => {
    setCurrent(active => !active || snapshot.revision >= active.revision ? snapshot : active);
  }, []);

  useEffect(() => {
    if (initial) accept(initial);
    else setCurrent(null);
  }, [initial, accept]);

  const request = useCallback((method = 'GET', operation, payload) => {
    setPending(count => count + 1);
    const task = queue.current.then(async () => {
      try {
        const response = await fetch('/api/account-weekly-basket' + (operation ? '?op=' + operation : ''), {
          method, cache: 'no-store', signal: AbortSignal.timeout(12000),
          ...(payload && { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
        });
        const snapshot = await response.json();
        if (!response.ok) throw Object.assign(new Error(typeof snapshot.message === 'string'
          ? snapshot.message : response.status === 401 ? 'برای ادامه دوباره وارد حساب شوید.' : 'به‌روزرسانی سبد هفتگی انجام نشد.'), { status: response.status });
        accept(snapshot);
        setFailed(false);
        return snapshot;
      } catch (error) {
        setFailed(true);
        throw error;
      } finally {
        setPending(count => count - 1);
      }
    });
    queue.current = task.catch(() => {});
    return task;
  }, [accept]);

  const signedIn = Boolean(initial);
  useEffect(() => {
    if (!signedIn) return;
    const refresh = () => { if (!document.hidden) void request().catch(() => {}); };
    void request().catch(() => {});
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [signedIn, request]);

  const value = useMemo(() => signedIn && current ? {
    ...current, pending: pending > 0, failed, request,
    add(productId, quantity = 1) { return request('POST', 'items', { productId, quantity, operation: 'add' }); },
    set(productId, quantity) { return request('POST', 'items', { productId, quantity, operation: 'set' }); },
    remove(productId) { return request('POST', 'items', { productId, operation: 'remove' }); },
    clear() { return request('DELETE'); },
  } : null, [signedIn, current, failed, pending, request]);

  return <WeeklyBasketContext.Provider value={value}>{children}</WeeklyBasketContext.Provider>;
}

export function useAccountWeeklyBasket() {
  return useContext(WeeklyBasketContext);
}
