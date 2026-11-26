import 'server-only';
import { cache } from 'react';
import { partnerBackend } from './partnerBackend';

export const readAccountWeeklyBasket = cache(async token => {
  try {
    const response = await partnerBackend('/web/weekly-basket', { token, signal: AbortSignal.timeout(3500) });
    if (response.ok) return await response.json();
    if (response.status === 401) return null;
  } catch {
    // Keep the storefront available when the account API is temporarily offline.
  }
  return { items: [], revision: -1 };
});
