import 'server-only';
import { cache } from 'react';
import { partnerBackend } from './partnerBackend';

export const readAccountMenu = cache(async token => {
  if (!token) return { profile: null, wallet: null };

  const [profileResult, walletResult] = await Promise.allSettled([
    partnerBackend('/web/profile', { token, signal: AbortSignal.timeout(2500) }),
    partnerBackend('/web/karsha', { token, signal: AbortSignal.timeout(2500) }),
  ]);

  let profileData = null;
  let walletData = null;

  if (profileResult.status === 'fulfilled' && profileResult.value.ok) {
    profileData = await profileResult.value.json().catch(() => null);
  }
  if (walletResult.status === 'fulfilled' && walletResult.value.ok) {
    walletData = await walletResult.value.json().catch(() => null);
  }

  const profile = profileData ? {
    fullName: typeof profileData.fullName === 'string' ? profileData.fullName : '',
    karshaBalance: Number.isFinite(Number(profileData.karshaBalance)) ? Number(profileData.karshaBalance) : 0,
    capabilities: {
      sell: profileData.capabilities?.sell === true,
      drive: profileData.capabilities?.drive === true,
    },
  } : null;

  const balance = walletData && Number.isFinite(Number(walletData.balance))
    ? Number(walletData.balance)
    : profile?.karshaBalance ?? null;

  return {
    profile,
    wallet: balance === null ? null : { balance },
  };
});
