import React, { useState, useRef, useEffect } from 'react';

interface ActionButtonProps {
  icon: React.ReactNode;
  label?: string;
  title?: string;
  isActive?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
  buttonClassName?: string;
  registerCloseActionPopups?: (callback: () => void) => void;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  title,
  isActive = false,
  onClick,
  children,
  className = '',
  buttonClassName = '',
  registerCloseActionPopups,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (registerCloseActionPopups) {
      registerCloseActionPopups(() => setIsOpen(false));
    }
  }, [registerCloseActionPopups]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node) &&
        popupRef.current &&
        !popupRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEsc);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
    onClick?.();
  };

  return (
    <div className={`relative ${className}`} ref={popupRef}>
      <button
        ref={buttonRef}
        title={title}
        onClick={handleButtonClick}
        className={`p-1.5 rounded-lg transition-all border ${
          isActive
            ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-900/30 dark:border-amber-800'
            : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400'
        } ${buttonClassName}`}
      >
        {icon}
      </button>
      {isOpen && children}
    </div>
  );
};
