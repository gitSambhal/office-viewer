import React from 'react';
import { DashboardHero } from './DashboardHero';

export const Dashboard: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-12 overflow-y-auto custom-scrollbar bg-zinc-50 dark:bg-zinc-950 animate-in fade-in duration-500">
      <DashboardHero />
    </div>
  );
};
