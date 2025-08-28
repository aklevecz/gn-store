import {createContext, useContext, useEffect, useState, useCallback} from 'react';

/**
 * Toast notification component with character pop-ups
 * @example
 * ```jsx
 * const toast = useToast();
 * toast.show("🎵 Added to cart!", { character: "hifive", duration: 3000 });
 * ```
 */
export function Toast() {
  const {toasts, dismiss} = useToast();

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem 
          key={toast.id} 
          toast={toast} 
          onDismiss={() => dismiss(toast.id)}
        />
      ))}
    </div>
  );
}

/**
 * Individual toast item component
 */
function ToastItem({toast, onDismiss}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const enterTimer = setTimeout(() => setIsVisible(true), 50);
    
    // Auto-dismiss after duration
    const dismissTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onDismiss, 300); // Wait for exit animation
    }, toast.duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(dismissTimer);
    };
  }, [toast.duration, onDismiss]);

  const handleClick = () => {
    setIsExiting(true);
    setTimeout(onDismiss, 300);
  };

  return (
    <div 
      className={`toast-item ${isVisible ? 'toast-visible' : ''} ${isExiting ? 'toast-exiting' : ''}`}
      onClick={handleClick}
      role="alert"
      aria-live="polite"
    >
      <div className="toast-character">
        <img 
          src={`/images/${toast.character}-color.svg`}
          alt={`Good Neighbor character ${toast.character}`}
          width="60"
          height="60"
        />
      </div>
      <div className="toast-content">
        <p>{toast.message}</p>
      </div>
    </div>
  );
}

const ToastContext = createContext(null);

/**
 * Available character types for toasts
 */
const CHARACTERS = ['juggle', 'spin', 'carry', 'hifive', 'welcome', 'infatuation'];

/**
 * Get a random character or use specified one
 */
function getCharacter(character) {
  if (character && CHARACTERS.includes(character)) {
    return character;
  }
  return CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
}

Toast.Provider = function ToastProvider({children}) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, options = {}) => {
    const {
      character = null,
      duration = 3000,
    } = options;

    const toast = {
      id: Date.now() + Math.random(),
      message,
      character: getCharacter(character),
      duration,
    };

    setToasts(prev => [...prev, toast]);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clear = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        show,
        dismiss,
        clear,
      }}
    >
      {children}
      <Toast />
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

/** @typedef {'juggle' | 'spin' | 'carry' | 'hifive' | 'welcome' | 'infatuation'} CharacterType */
/**
 * @typedef {{
 *   character?: CharacterType;
 *   duration?: number;
 * }} ToastOptions
 */
/**
 * @typedef {{
 *   id: string | number;
 *   message: string;
 *   character: CharacterType;
 *   duration: number;
 * }} ToastItem
 */
/**
 * @typedef {{
 *   toasts: ToastItem[];
 *   show: (message: string, options?: ToastOptions) => void;
 *   dismiss: (id: string | number) => void;
 *   clear: () => void;
 * }} ToastContextValue
 */