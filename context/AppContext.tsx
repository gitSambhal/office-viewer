import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AppState, Tab, FileType, TableData } from '../types';
import { STORAGE_KEYS } from '../constants';

// Action types
export type AppAction =
  | { type: 'SET_DARK_MODE'; payload: boolean }
  | { type: 'SET_ZEN_MODE'; payload: boolean }
  | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'SET_TYPE_AWARE_ENABLED'; payload: boolean }
  | { type: 'SET_GLOBAL_SEARCH_TERM'; payload: string }
  | { type: 'SET_SEARCH_LOADING'; payload: boolean }
  | { type: 'ADD_TABS'; payload: Tab[] }
  | { type: 'SET_ACTIVE_TAB'; payload: string | null }
  | { type: 'CLOSE_TAB'; payload: string }
  | { type: 'CLOSE_ALL_TABS' }
  | { type: 'CLOSE_TABS_TO_LEFT'; payload: string }
  | { type: 'CLOSE_TABS_TO_RIGHT'; payload: string }
  | { type: 'UPDATE_TAB'; payload: { id: string; updates: Partial<Tab> } }
  | { type: 'SET_SHOW_URL_MODAL'; payload: boolean };

// Initial state
const initialState: AppState = {
  tabs: [],
  activeTabId: null,
  darkMode: false,
  zenMode: false,
  isSidebarOpen: window.innerWidth >= 768, // Open on desktop, closed on mobile by default
  isTypeAwareEnabled: true,
  globalSearchTerm: '',
  showUrlModal: false,
  isSearchLoading: false,
};

// Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  if (!action || !action.type) {
    console.error('Invalid action:', action);
    return state;
  }
  switch (action.type) {
    case 'SET_DARK_MODE':
      return { ...state, darkMode: action.payload };
    case 'SET_ZEN_MODE':
      return { ...state, zenMode: action.payload };
    case 'SET_SIDEBAR_OPEN':
      return { ...state, isSidebarOpen: action.payload };
    case 'SET_TYPE_AWARE_ENABLED':
      return { ...state, isTypeAwareEnabled: action.payload };
    case 'SET_GLOBAL_SEARCH_TERM':
      return { ...state, globalSearchTerm: action.payload };
    case 'SET_SEARCH_LOADING':
      return { ...state, isSearchLoading: action.payload };
     case 'ADD_TABS': {
       const isMobile = window.innerWidth < 768;
       return {
         ...state,
         tabs: [...state.tabs, ...action.payload],
         activeTabId:
           action.payload.length > 0
             ? action.payload[action.payload.length - 1].id
             : state.activeTabId,
         isSidebarOpen: state.tabs.length === 0 ? true : (isMobile ? false : state.isSidebarOpen),
       };
     }
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTabId: action.payload };
    case 'CLOSE_TAB': {
      const nextTabs = state.tabs.filter((t) => t.id !== action.payload);
      const nextId =
        state.activeTabId === action.payload
          ? nextTabs.length
            ? nextTabs[nextTabs.length - 1].id
            : null
          : state.activeTabId;
      return { ...state, tabs: nextTabs, activeTabId: nextId };
    }
    case 'CLOSE_ALL_TABS':
      return { ...state, tabs: [], activeTabId: null };
    case 'CLOSE_TABS_TO_LEFT': {
      const tabIndex = state.tabs.findIndex((t) => t.id === action.payload);
      if (tabIndex === -1) return state;
      const tabsToKeep = state.tabs.slice(tabIndex);
      const newActiveTabId = tabsToKeep.some((t) => t.id === state.activeTabId)
        ? state.activeTabId
        : tabsToKeep.length > 0
          ? tabsToKeep[0].id
          : null;
      return { ...state, tabs: tabsToKeep, activeTabId: newActiveTabId };
    }
    case 'CLOSE_TABS_TO_RIGHT': {
      const tabIndex = state.tabs.findIndex((t) => t.id === action.payload);
      if (tabIndex === -1) return state;
      const tabsToKeep = state.tabs.slice(0, tabIndex + 1);
      const newActiveTabId = tabsToKeep.some((t) => t.id === state.activeTabId)
        ? state.activeTabId
        : tabsToKeep.length > 0
          ? tabsToKeep[tabsToKeep.length - 1].id
          : null;
      return { ...state, tabs: tabsToKeep, activeTabId: newActiveTabId };
    }
    case 'UPDATE_TAB':
      return {
        ...state,
        tabs: state.tabs.map((t) =>
          t.id === action.payload.id ? { ...t, ...action.payload.updates } : t
        ),
      };
    case 'SET_SHOW_URL_MODAL':
      return { ...state, showUrlModal: action.payload };
    default:
      return state;
  }
};

// Context type
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(appReducer, initialState, (initial) => {
    // Initialize from localStorage
    const finalState = { ...initial };
    try {
      const storedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      if (storedTheme === 'dark' || storedTheme === 'light') {
        finalState.darkMode = storedTheme === 'dark';
      }

      const storedTypeAware = localStorage.getItem(STORAGE_KEYS.TYPE_AWARE);
      if (storedTypeAware === 'true' || storedTypeAware === 'false') {
        finalState.isTypeAwareEnabled = storedTypeAware === 'true';
      }
    } catch (e) {
      console.error('Error initializing state from localStorage:', e);
    }
    return finalState;
  });

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
