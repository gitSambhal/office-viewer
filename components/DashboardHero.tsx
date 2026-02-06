import React from 'react';
import { useFileHandler } from '../hooks/useFileHandler';
import { useUrlHandler } from '../hooks/useUrlHandler';
import { FileType } from '../types';
import { getFileIcon } from '../utils/helpers';
import { DashboardPreview } from './DashboardPreview';
import { RecentFiles } from './RecentFiles';
import { FILE_ACCEPT, PREVIEW_DATA, FEATURES } from '../constants';
import { CREDITS } from '../utils/credits';
import { CreditsPopup } from './CreditsPopup';

export const DashboardHero: React.FC = () => {
  const { handleFiles } = useFileHandler();
  const { setShowUrlModal } = useUrlHandler();

  return (
    <div className="max-w-5xl w-full py-8 sm:py-16">
        <div className="mb-12 sm:mb-24">
           {/* Hero Section Heading */}
           <div className="text-center mb-12">
             <h2 className="text-4xl sm:text-7xl font-black text-zinc-950 dark:text-white mb-4 sm:mb-6 tracking-tighter leading-[1.05]">The Universal File Viewer</h2>
             <p className="text-base sm:text-xl text-zinc-500 dark:text-zinc-400 font-medium max-w-2xl mx-auto leading-relaxed">
               Open and switch between multiple documents, spreadsheets, and databases instantly. No installations, 100% local.
             </p>
           </div>
           
           {/* Chips Preview */}
           <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8">
             {[
               { name: 'PDF', icon: getFileIcon('pdf'), color: 'bg-rose-50 dark:bg-rose-900/10' },
               { name: 'Word', icon: getFileIcon('docx'), color: 'bg-blue-50 dark:bg-blue-900/10' },
               { name: 'RTF', icon: getFileIcon('rtf'), color: 'bg-amber-50 dark:bg-amber-900/10' },
               { name: 'Markdown', icon: getFileIcon('md'), color: 'bg-zinc-100 dark:bg-zinc-800/50' },
               { name: 'Excel', icon: getFileIcon('xlsx'), color: 'bg-emerald-50 dark:bg-emerald-900/10' },
               { name: 'Access DB', icon: getFileIcon('mdb'), color: 'bg-teal-50 dark:bg-teal-900/10' },
               { name: 'SQLite', icon: getFileIcon('sqlite'), color: 'bg-sky-50 dark:bg-sky-900/10' },
               { name: 'DBF', icon: getFileIcon('dbf'), color: 'bg-orange-50 dark:bg-orange-900/10' },
               { name: 'Images', icon: getFileIcon('image'), color: 'bg-violet-50 dark:bg-violet-900/10' }
             ].map((fmt) => (
               <span key={fmt.name} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg sm:px-4 sm:py-2 ${fmt.color} border border-zinc-200 dark:border-zinc-800 transition-all hover:scale-105`}>
                 {fmt.icon}
                 <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400">{fmt.name}</span>
               </span>
             ))}
           </div>

           {/* CTA Buttons */}
           <div id="main-cta-section" className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <label className="group relative inline-flex items-center gap-3 cursor-pointer bg-violet-600 hover:bg-violet-700 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-[0.1em] shadow-xl transition-all hover:scale-[1.02] active:scale-95">
                 <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                 Open Files
                 <input type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} accept={FILE_ACCEPT} />
             </label>

             <button
               onClick={() => setShowUrlModal(true)}
               className="group relative inline-flex items-center gap-3 cursor-pointer bg-transparent hover:bg-violet-50 dark:hover:bg-violet-900/20 text-violet-700 dark:text-violet-300 px-6 py-4 rounded-xl font-black text-xs uppercase tracking-[0.1em] border-2 border-violet-300 dark:border-violet-700 hover:border-violet-400 dark:hover:border-violet-600 transition-all hover:scale-[1.02] active:scale-95"
             >
               <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
               Open from URL
             </button>
           </div>
           
           <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
           <button
             onClick={async () => {
               try {
                 const response = await fetch(PREVIEW_DATA.SAMPLE_PDF_URL);
                 const blob = await response.blob();
                 const file = new File([blob], PREVIEW_DATA.SAMPLE_PDF_NAME, { type: 'application/pdf' });
                 handleFiles([file]);
               } catch (error) {
                 console.error('Failed to load sample file:', error);
               }
             }}
             className="text-sm sm:text-base text-violet-600 dark:text-violet-400 font-medium hover:text-violet-700 dark:hover:text-violet-300 transition-colors underline underline-offset-4"
           >
             No file? Try a sample PDF
           </button>
           </div>
           
            {/* App Preview with Tabs and Content */}
            <DashboardPreview />
        </div>

         {/* Recent Files */}
         <RecentFiles />

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 text-left mb-12 sm:mb-16">
            {FEATURES.map((feature, index) => (
              <div key={index} className="p-5 sm:p-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-[1.5rem] sm:rounded-[2rem] border border-zinc-100/50 dark:border-zinc-800/50 shadow-sm hover:shadow-xl hover:border-violet-200 dark:hover:border-violet-900/30 transition-all group">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-zinc-100 dark:bg-zinc-800 text-violet-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-violet-600 group-hover:text-white transition-all shadow-inner">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={feature.icon} />
                  </svg>
                </div>
                <h4 className="text-base sm:text-lg font-black text-zinc-950 dark:text-white mb-2 tracking-tight">{feature.title}</h4>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">{feature.desc}</p>
              </div>
            ))}
         </div>

         {/* Footer Credits */}
         <div className="flex items-center justify-center gap-2 py-3 px-4 sm:py-4 sm:px-6 bg-white dark:bg-zinc-900 rounded-full border border-zinc-100 dark:border-zinc-800 shadow-sm animate-in fade-in duration-1000">
            <span className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Designed & Crafted by</span>
            <a href={CREDITS.linkedin} target="_blank" rel="noopener noreferrer" className="text-[10px] sm:text-[11px] font-black text-violet-600 hover:text-violet-500 transition-colors uppercase tracking-widest flex items-center gap-2 group">
               {CREDITS.name}
               <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
            {/* <span className="text-[9px] sm:text-[10px] font-black text-zinc-400">|</span> */}
            <CreditsPopup />
         </div>
    </div>
  );
};
