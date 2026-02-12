import React, { useState } from 'react';
import { CREDITS } from '../utils/credits';

export const CreditsPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-violet-500 transition-colors"
      >
        Donate
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl max-w-md w-full relative overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 to-blue-600"></div>

            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white">
                Support the Project
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-8 text-center">
              {/* Donation QR Code */}
              <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-6">
                <div className="flex justify-center mb-4">
                  <img
                    src={CREDITS.qrCode}
                    alt="UPI QR Code"
                    className="w-40 h-40 rounded-lg border-2 border-violet-200 dark:border-violet-800"
                  />
                </div>
                <p className="text-sm font-bold text-zinc-900 dark:text-white mb-2">
                  Scan to Donate
                </p>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-4">
                  UPI ID: {CREDITS.upiId}
                </p>
                <a
                  href={CREDITS.upiLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-black text-sm uppercase tracking-wider transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Pay via UPI
                </a>
              </div>

              {/* Designer Info */}
              <div className="text-center">
                <p className="text-sm font-bold text-zinc-900 dark:text-white mb-2">
                  Created by
                </p>
                <a
                  href={CREDITS.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-black text-violet-600 hover:text-violet-500 transition-colors"
                >
                  {CREDITS.name}
                </a>
              </div>

              {/* Social Links */}
              <div className="flex justify-center gap-4">
                <a
                  href={CREDITS.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-500 hover:text-violet-500 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
                <a
                  href={CREDITS.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-500 hover:text-violet-500 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
