import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/Auth/AuthLayout';
import { useAuth } from '../context/AuthProvider';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup, status, error, setError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const disableSubmit = useMemo(() => {
    return (
      !emailRegex.test(email) ||
      password.length < 8 ||
      confirmPassword !== password ||
      status === 'loading'
    );
  }, [email, password, confirmPassword, status]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setError(null);
    setSuccessMessage(null);

    if (!emailRegex.test(email)) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    const result = await signup(email, password);
    if (!result.success) {
      setFormError(result.error ?? 'Unable to create account.');
      return;
    }

    setSuccessMessage('Account created. You can now log in.');
    setTimeout(() => navigate('/login', { replace: true }), 600);
  };

  return (
    <AuthLayout
      title="SIGNUP"
      subtitle="Provision a new operator account"
      ariaMessage={successMessage ?? formError ?? error}
      footer={
        <p>
          Already registered?{' '}
          <Link to="/login" className="text-green-300 underline">
            Return to login
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm tracking-widest">
          CORPORATE EMAIL
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full bg-black/40 border border-green-400/50 px-3 py-2 focus:outline-none focus:border-green-300"
            autoComplete="email"
            required
          />
        </label>
        <label className="block text-sm tracking-widest">
          PASSWORD
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full bg-black/40 border border-green-400/50 px-3 py-2 focus:outline-none focus:border-green-300"
            autoComplete="new-password"
            required
            minLength={8}
          />
          <span className="text-xs text-green-200/60">
            Use at least 8 characters, including numbers or symbols.
          </span>
        </label>
        <label className="block text-sm tracking-widest">
          CONFIRM PASSWORD
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="mt-1 w-full bg-black/40 border border-green-400/50 px-3 py-2 focus:outline-none focus:border-green-300"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </label>
        <button
          type="submit"
          disabled={disableSubmit}
          className="w-full border-2 border-green-400 py-2 tracking-[0.5em] uppercase transition disabled:opacity-40 hover:bg-green-500/20"
        >
          {status === 'loading' ? 'CREATING...' : 'SIGNUP'}
        </button>
      </form>
      {(formError || error) && (
        <p className="text-red-300 text-sm tracking-widest" role="alert">
          {formError ?? error}
        </p>
      )}
      {successMessage && (
        <p className="text-green-300 text-sm tracking-widest" role="status">
          {successMessage}
        </p>
      )}
    </AuthLayout>
  );
};

