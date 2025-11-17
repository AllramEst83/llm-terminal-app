import React, { useState, useEffect, useRef } from 'react';
import type { ThemeColors } from '../domain/Theme';

interface LoginScreenProps {
  theme: ThemeColors;
  onLogin: (email: string, password: string) => Promise<void>;
  onSwitchToRegister: () => void;
  error?: string;
  isLoading?: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  theme, 
  onLogin, 
  onSwitchToRegister,
  error,
  isLoading = false
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && password.trim() && !isLoading) {
      await onLogin(email.trim(), password.trim());
    }
  };

  return (
    <div className="p-4 flex flex-col h-full">
      <div className="whitespace-pre-wrap mb-6">
        <div style={{ color: theme.accent }} className="text-xl font-bold mb-2">
          {'>'} GEMINI TERMINAL - LOGIN
        </div>
        <div style={{ color: theme.system, opacity: 0.8 }}>
          {'\n'}
          Welcome back. Please authenticate to continue.
          {'\n\n'}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 space-y-4">
        {/* Email Input */}
        <div className="flex flex-col space-y-1">
          <label 
            htmlFor="email" 
            style={{ color: theme.text, opacity: 0.7 }}
            className="text-sm uppercase tracking-wide"
          >
            Email Address
          </label>
          <div className="flex items-center border-b-2" style={{ borderColor: theme.accent, opacity: 0.5 }}>
            <span style={{ color: theme.prompt }} className="mr-2">{'>'}</span>
            <input
              ref={emailInputRef}
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent border-none w-full focus:outline-none py-2"
              style={{ color: theme.text }}
              placeholder="user@example.com"
              disabled={isLoading}
              autoComplete="email"
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="flex flex-col space-y-1">
          <label 
            htmlFor="password" 
            style={{ color: theme.text, opacity: 0.7 }}
            className="text-sm uppercase tracking-wide"
          >
            Password
          </label>
          <div className="flex items-center border-b-2" style={{ borderColor: theme.accent, opacity: 0.5 }}>
            <span style={{ color: theme.prompt }} className="mr-2">{'>'}</span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-transparent border-none flex-1 focus:outline-none py-2"
              style={{ color: theme.text }}
              placeholder="Enter your password"
              disabled={isLoading}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="ml-2 text-xs uppercase hover:opacity-80"
              style={{ color: theme.accent }}
              disabled={isLoading}
            >
              {showPassword ? '[HIDE]' : '[SHOW]'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div 
            className="p-3 border-l-4 mt-4"
            style={{ 
              borderColor: theme.system,
              backgroundColor: `${theme.system}11`,
              color: theme.system
            }}
          >
            <div className="font-bold">ERROR:</div>
            <div>{error}</div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center space-x-4 mt-6">
          <button
            type="submit"
            disabled={isLoading || !email.trim() || !password.trim()}
            className="px-6 py-2 border-2 uppercase tracking-wide font-bold hover:opacity-80 disabled:opacity-40 transition-opacity"
            style={{ 
              borderColor: theme.accent,
              color: theme.accent,
              backgroundColor: 'transparent'
            }}
          >
            {isLoading ? '[AUTHENTICATING...]' : '[LOGIN]'}
          </button>
          
          <button
            type="button"
            onClick={onSwitchToRegister}
            disabled={isLoading}
            className="px-6 py-2 uppercase tracking-wide hover:opacity-80 disabled:opacity-40 transition-opacity"
            style={{ color: theme.text, opacity: 0.7 }}
          >
            Create Account
          </button>
        </div>
      </form>

      {/* Footer */}
      <div 
        className="mt-6 text-xs opacity-60"
        style={{ color: theme.text }}
      >
        SECURE CONNECTION ESTABLISHED | AUTH v1.0
      </div>
    </div>
  );
};
