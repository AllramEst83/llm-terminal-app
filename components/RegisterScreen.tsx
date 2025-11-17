import React, { useState, useEffect, useRef } from 'react';
import type { ThemeColors } from '../domain/Theme';

interface RegisterScreenProps {
  theme: ThemeColors;
  onRegister: (email: string, username: string, password: string) => Promise<void>;
  onSwitchToLogin: () => void;
  error?: string;
  isLoading?: boolean;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ 
  theme, 
  onRegister, 
  onSwitchToLogin,
  error,
  isLoading = false
}) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const validateForm = (): boolean => {
    if (!email.trim() || !username.trim() || !password.trim() || !confirmPassword.trim()) {
      setValidationError('All fields are required');
      return false;
    }

    if (!email.includes('@')) {
      setValidationError('Invalid email address');
      return false;
    }

    if (username.length < 3) {
      setValidationError('Username must be at least 3 characters');
      return false;
    }

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return false;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm() && !isLoading) {
      await onRegister(email.trim(), username.trim(), password.trim());
    }
  };

  const displayError = error || validationError;

  return (
    <div className="p-4 flex flex-col h-full overflow-y-auto">
      <div className="whitespace-pre-wrap mb-6">
        <div style={{ color: theme.accent }} className="text-xl font-bold mb-2">
          {'>'} GEMINI TERMINAL - CREATE ACCOUNT
        </div>
        <div style={{ color: theme.system, opacity: 0.8 }}>
          {'\n'}
          Initialize new user profile.
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

        {/* Username Input */}
        <div className="flex flex-col space-y-1">
          <label 
            htmlFor="username" 
            style={{ color: theme.text, opacity: 0.7 }}
            className="text-sm uppercase tracking-wide"
          >
            Username (min 3 characters)
          </label>
          <div className="flex items-center border-b-2" style={{ borderColor: theme.accent, opacity: 0.5 }}>
            <span style={{ color: theme.prompt }} className="mr-2">{'>'}</span>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-transparent border-none w-full focus:outline-none py-2"
              style={{ color: theme.text }}
              placeholder="your_username"
              disabled={isLoading}
              autoComplete="username"
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
            Password (min 8 characters)
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
              placeholder="Enter password"
              disabled={isLoading}
              autoComplete="new-password"
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

        {/* Confirm Password Input */}
        <div className="flex flex-col space-y-1">
          <label 
            htmlFor="confirmPassword" 
            style={{ color: theme.text, opacity: 0.7 }}
            className="text-sm uppercase tracking-wide"
          >
            Confirm Password
          </label>
          <div className="flex items-center border-b-2" style={{ borderColor: theme.accent, opacity: 0.5 }}>
            <span style={{ color: theme.prompt }} className="mr-2">{'>'}</span>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-transparent border-none flex-1 focus:outline-none py-2"
              style={{ color: theme.text }}
              placeholder="Re-enter password"
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>
        </div>

        {/* Error Message */}
        {displayError && (
          <div 
            className="p-3 border-l-4 mt-4"
            style={{ 
              borderColor: theme.system,
              backgroundColor: `${theme.system}11`,
              color: theme.system
            }}
          >
            <div className="font-bold">ERROR:</div>
            <div>{displayError}</div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center space-x-4 mt-6">
          <button
            type="submit"
            disabled={isLoading || !email.trim() || !username.trim() || !password.trim() || !confirmPassword.trim()}
            className="px-6 py-2 border-2 uppercase tracking-wide font-bold hover:opacity-80 disabled:opacity-40 transition-opacity"
            style={{ 
              borderColor: theme.accent,
              color: theme.accent,
              backgroundColor: 'transparent'
            }}
          >
            {isLoading ? '[CREATING...]' : '[CREATE ACCOUNT]'}
          </button>
          
          <button
            type="button"
            onClick={onSwitchToLogin}
            disabled={isLoading}
            className="px-6 py-2 uppercase tracking-wide hover:opacity-80 disabled:opacity-40 transition-opacity"
            style={{ color: theme.text, opacity: 0.7 }}
          >
            Back to Login
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
