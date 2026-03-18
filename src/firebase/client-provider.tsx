'use client';

import React, { useMemo } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const { app, db, auth } = useMemo(() => initializeFirebase(), []);

  // If Firebase fails to initialize, we still provide the context but values will be null
  // The hooks using these should handle null values gracefully
  return (
    <FirebaseProvider app={app as any} db={db as any} auth={auth as any}>
      {children}
    </FirebaseProvider>
  );
}
