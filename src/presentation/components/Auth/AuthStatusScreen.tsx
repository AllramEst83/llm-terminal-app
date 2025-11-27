import React from 'react';

interface AuthStatusScreenProps {
  title: string;
  message: string;
  subMessage?: string;
  children?: React.ReactNode;
}

export const AuthLoadingScreen: React.FC<{ message?: string }> = ({ message }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-black text-green-200 font-mono p-6">
    <div className="text-3xl tracking-[0.3em] mb-6 animate-pulse">AUTH_ENGAGE</div>
    <div className="mb-2 text-lg">{message ?? 'Synchronizing secure session...'}</div>
    <div className="flex space-x-2 mt-4" role="status" aria-live="polite">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="w-3 h-3 bg-green-400 rounded-full animate-bounce"
          style={{ animationDelay: `${index * 150}ms` }}
        />
      ))}
    </div>
  </div>
);

export const AuthDisabledScreen: React.FC<{ reason?: string }> = ({ reason }) => (
  <div className="min-h-screen flex items-center justify-center bg-black text-red-200 font-mono p-6">
    <div className="max-w-lg border-4 border-red-500 bg-black/40 p-6 w-full space-y-4">
      <div className="text-2xl tracking-[0.3em]">AUTH_FAIL</div>
      <p className="text-sm leading-6">
        Authentication is not configured for this deployment. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
        in your environment to enable secure access.
      </p>
      {reason && <p className="text-xs text-red-300">{reason}</p>}
      <p className="text-xs text-yellow-300">
        This environment currently exposes unauthenticated access; lock down deployments before sharing publicly.
      </p>
    </div>
  </div>
);

