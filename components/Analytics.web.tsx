// components/Analytics.web.tsx — web-only Vercel Analytics
// Metro resolves .web.tsx over .tsx on web platform builds.
import React from 'react';
import { Analytics as VercelAnalytics } from '@vercel/analytics/react';

export function Analytics() {
  return <VercelAnalytics />;
}
