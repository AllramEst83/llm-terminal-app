import React from 'react';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  warningBanner?: React.ReactNode;
  ariaMessage?: string | null;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  subtitle,
  children,
  footer,
  warningBanner,
  ariaMessage,
}) => (
  <main className="min-h-screen bg-black text-green-100 font-mono flex items-center justify-center px-4 py-10">
    <div className="w-full max-w-md space-y-4">
      {warningBanner}
      <div className="border-4 border-green-400 bg-[#020202] shadow-[0_0_25px_rgba(0,255,0,0.25)]">
        <header className="border-b-2 border-green-400/60 px-5 py-4">
          <p className="text-xs tracking-[0.4em] text-green-400/80">MAINFRAME AUTH</p>
          <h1 className="text-2xl mt-2 tracking-widest">{title}</h1>
          {subtitle && <p className="text-sm text-green-200/70 mt-1">{subtitle}</p>}
        </header>
        <section className="px-5 py-6 space-y-6">
          <div
            className="sr-only"
            role="status"
            aria-live="polite"
          >
            {ariaMessage}
          </div>
          {children}
        </section>
      </div>
      {footer && (
        <div className="text-center text-sm text-green-200/60 tracking-widest border border-green-500/60 px-4 py-3 bg-black/60">
          {footer}
        </div>
      )}
    </div>
  </main>
);

