// Web-specific Analytics component
// This file is only loaded on web platform (Expo/Metro automatically uses .web.tsx files on web)
import React from 'react';
// Direct import from dist folder since Metro doesn't understand package.json exports
import { Analytics as VercelAnalytics } from '@vercel/analytics/dist/react';

export function Analytics() {
  return <VercelAnalytics />;
}
