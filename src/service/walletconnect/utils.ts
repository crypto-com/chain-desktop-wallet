const LOCAL_WALLETCONNECT_KEY = 'walletconnect';

export function getCachedSession(): any {
  const local = localStorage ? localStorage.getItem(LOCAL_WALLETCONNECT_KEY) : null;

  let session = null;
  if (local) {
    try {
      session = JSON.parse(local);
    } catch (error) {
      throw error;
    }
  }
  return session;
}

export function clearCachedSession() {
  localStorage.removeItem(LOCAL_WALLETCONNECT_KEY);
}
