import React from 'react';
import { useFileHandler } from '../hooks/useFileHandler';
import { useUrlHandler } from '../hooks/useUrlHandler';
import { FileType } from '../types';
import { getFileIcon } from '../utils/helpers';
import { DashboardPreview } from './DashboardPreview';
import { RecentFiles } from './RecentFiles';

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
                 <input type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} accept=".xlsx,.xls,.csv,.docx,.doc,.pdf,.txt,.md,.png,.jpg,.jpeg,.gif,.webp,.rtf,.mdb,.accdb,.sqlite,.db,.db3,.dbf" />
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
                 const response = await fetch('https://pdfobject.com/pdf/sample.pdf');
                 const blob = await response.blob();
                 const file = new File([blob], 'sample-document.pdf', { type: 'application/pdf' });
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
           {[
             { title: 'Offline-First & Local Processing', desc: 'Your files are processed entirely on your device, ensuring privacy and security with absolutely no server uploads.', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
             { title: 'Ad-Free Experience', desc: 'Enjoy a clean, uninterrupted viewing experience without any advertisements.', icon: 'M6 18L18 6M6 6l12 12' },
             { title: 'Multi-Format Viewing', desc: 'Seamlessly open and view a wide range of documents including PDFs, Spreadsheets, Word files, various Databases (MDB, SQLite, DBF), Images, and more.', icon: 'M4 6h16M4 12h16m-7 6h7' },
             { title: 'Tab Management', desc: 'Efficiently manage multiple open documents in a tabbed interface for easy comparison and multitasking.', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
             { title: 'Zen Focus Mode', desc: 'Eliminate distractions with a dedicated focus mode, including fullscreen viewing and quick toggles.', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
             { title: 'Intuitive File Handling', desc: 'Easily load files via drag & drop (even entire folders), a traditional file picker, or by providing a URL.', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' },
             { title: 'PWA File Sharing', desc: 'Directly receive and open files shared from other applications on your device when installed as a Progressive Web App.', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
             { title: 'Type-Aware Visualization', desc: 'Automatic data type detection with color-coded visual highlighting for better data comprehension.', icon: 'M7 7h10M10 7v10m4-10v10M7 17h10' },
             { title: 'Advanced Search & Filter', desc: 'Powerful search capabilities across all open tabs and databases with real-time filtering.', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
             { title: 'Sorting & Organization', desc: 'Multi-column sorting and data organization for tables and spreadsheets.', icon: 'M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4' },
             { title: 'Real-time Metadata', desc: 'Detailed file information and metadata displayed in a customizable sidebar.', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
             { title: 'Responsive Design', desc: 'Optimized viewing experience across all device sizes from mobile to desktop.', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
             { title: 'Dark & Light Themes', desc: 'Toggle between dark and light themes for comfortable viewing in any environment.', icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z' },
             { title: 'Cross-Browser Support', desc: 'Works seamlessly on all modern browsers including Chrome, Firefox, Safari, and Edge.', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' }
           ].map((feature, index) => (
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
    </div>
  );
};
