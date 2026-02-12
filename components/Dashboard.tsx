import React from 'react';
import { DashboardHero } from './DashboardHero';
import { getFileIcon } from '../utils/helpers';

interface Props {
  deferredPrompt?: Event | null;
  onInstall?: () => void;
}

export const Dashboard: React.FC<Props> = ({ deferredPrompt, onInstall }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-12 overflow-y-auto custom-scrollbar bg-zinc-50 dark:bg-zinc-950 animate-in fade-in duration-500 relative">
      {/* Fixed Background Icons */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0">
        <div className="absolute top-[20%] left-[5%] opacity-[0.12] dark:opacity-[0.15] transform -rotate-12 scale-[10] transition-transform duration-[20s] ease-in-out hover:scale-[11]">
          {getFileIcon('pdf')}
        </div>
        <div className="absolute top-[25%] right-[8%] opacity-[0.10] dark:opacity-[0.14] transform rotate-12 scale-[8] transition-transform duration-[25s]">
          {getFileIcon('xlsx')}
        </div>
        <div className="absolute bottom-[25%] left-[8%] opacity-[0.10] dark:opacity-[0.14] transform -rotate-6 scale-[9]">
          {getFileIcon('docx')}
        </div>
        <div className="absolute bottom-[20%] right-[10%] opacity-[0.10] dark:opacity-[0.14] transform rotate-45 scale-[12]">
          {getFileIcon('pptx')}
        </div>
        <div className="absolute top-[50%] left-[50%] opacity-[0.08] dark:opacity-[0.12] transform rotate-6 scale-[11] -translate-x-1/2 -translate-y-1/2">
          {getFileIcon('sqlite')}
        </div>
      </div>

      <div className="relative z-10 w-full flex justify-center">
        <DashboardHero
          deferredPrompt={deferredPrompt}
          onInstall={onInstall}
        />
      </div>
    </div>
  );
};
