import React, { useEffect, useRef } from 'react';

interface MenuItem {
  label?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  divider?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  items,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-lg py-1 min-w-[160px]"
      style={{ left: x, top: y }}
    >
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          {/* Fix: Allow rendering of divider even if item has no label or onClick */}
          {item.divider && (
            <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
          )}

          {/* Fix: Only render the button if both label and onClick are provided */}
          {item.label && item.onClick && (
            <button
              className="w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-700 dark:text-slate-200 flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                item.onClick?.();
                onClose();
              }}
            >
              {item.icon}
              {item.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
