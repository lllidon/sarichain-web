'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { cartCookie, cartLineId } from '../Products/cartData';

const AccountCartContext = createContext(null);

export function AccountCartProvider({ initial, children }) {
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

  const request = useCallback((method = 'GET', op, payload) => {
    setPending(count => count + 1);
    const task = queue.current.then(async () => {
      try {
        const response = await fetch('/api/account-cart' + (op ? '?op=' + op : ''), {
          method, cache: 'no-store', signal: AbortSignal.timeout(12000),
          ...(payload && { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
        });
        const snapshot = await response.json();
        if (!response.ok) throw Object.assign(new Error(typeof snapshot.message === 'string'
          ? snapshot.message : response.status === 401 ? 'برای ادامه دوباره وارد حساب شوید.' : 'به‌روزرسانی سبد انجام نشد.'), { status: response.status });
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
    const refresh = async () => {
      try {
        if (document.cookie.split('; ').some(cookie => cookie.startsWith(cartCookie + '=') && cookie !== cartCookie + '=')) {
          await request('POST', 'merge');
        } else {
          await request();
        }
        try { localStorage.removeItem('sarichain-catalog-cart'); } catch {}
      } catch {
        // Preserve the guest cart and allow retry after reconnecting.
      }
    };
    const onVisible = () => { if (!document.hidden) void refresh(); };
    void refresh();
    window.addEventListener('focus', onVisible);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onVisible);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [signedIn, request]);

  const value = useMemo(() => signedIn && current ? {
    ...current, pending: pending > 0, failed, request,
    items: current.items.map(line => ({ ...line, packId: line.unitId, id: cartLineId(line.productId, line.unitId, line.offerId) })),
  } : null, [signedIn, current, failed, pending, request]);

  return <AccountCartContext.Provider value={value}>{children}</AccountCartContext.Provider>;
}

export function useAccountCart() {
  return useContext(AccountCartContext);
}
