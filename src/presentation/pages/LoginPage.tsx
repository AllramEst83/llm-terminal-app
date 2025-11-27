import React, { useMemo, useState } from 'react';
import { Link, type Location, useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/Auth/AuthLayout';
import { useAuth } from '../context/AuthProvider';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, status, error, setError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const disableSubmit = useMemo(() => {
    return !emailRegex.test(email) || password.length < 8 || status === 'loading';
  }, [email, password, status]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setError(null);
    setSuccessMessage(null);

    if (!emailRegex.test(email)) {
      setFormError('Please enter a valid email.');
      return;
    }
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }

    const result = await login(email, password);

    if (!result.success) {
      setFormError(result.error ?? 'Unable to login. Please try again.');
      return;
    }

    setSuccessMessage('Access granted. Redirecting to terminal...');

    const redirectTo =
      (location.state as { from?: Location } | null)?.from?.pathname ?? '/';

    setTimeout(() => {
      navigate(redirectTo, { replace: true });
    }, 400);
  };

  return (
    <AuthLayout
      title="LOGIN"
      subtitle="Authenticate to access GEMINI_CHAT.EXE"
      ariaMessage={successMessage ?? formError ?? error}
      footer={
        <p>
          Need an account?{' '}
          <Link to="/signup" className="text-green-300 underline">
            Launch signup
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm tracking-widest">
          EMAIL ACCESS KEY
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
            autoComplete="current-password"
            required
            minLength={8}
          />
        </label>
        <button
          type="submit"
          disabled={disableSubmit}
          className="w-full border-2 border-green-400 py-2 tracking-[0.5em] uppercase transition disabled:opacity-40 hover:bg-green-500/20"
        >
          {status === 'loading' ? 'PROCESSING...' : 'LOGIN'}
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

