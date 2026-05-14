import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useProjectUiStore } from '@/features/project/projectUiStore';

export default function Login() {
  const navigate = useNavigate();
  const setActiveProjectId = useProjectUiStore((s) => s.setActiveProjectId);
  const [err, setErr] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  const handleDevLogin = async () => {
    setErr(null);
    try {
      const data = await api.devSession();
      setActiveProjectId(data.defaultProjectId);
      navigate('/dashboard');
    } catch (e) {
      setErr(String(e));
    }
  };

  return (
    <div className="min-h-screen flex antialiased bg-background">
      <div className="hidden lg:flex lg:w-1/2 relative bg-surface-container-high items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-10 bg-primary-container" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-container/90 to-surface/40 mix-blend-multiply"></div>
        <div className="relative z-10 flex flex-col p-stack-lg max-w-lg text-on-primary">
          <div className="flex items-center gap-base mb-stack-lg">
            <span className="material-symbols-outlined text-[48px] fill">architecture</span>
          </div>
          <h1 className="font-display-metrics text-display-metrics mb-stack-md text-on-primary">Precision in Every Estimate.</h1>
          <p className="font-body-lg text-body-lg text-primary-fixed-dim">Industrial-grade estimation tools engineered for accuracy and durability in the field.</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-margin-mobile relative bg-surface">
        <div className="w-full max-w-[420px] flex flex-col">
          <div className="mb-stack-lg text-center lg:text-left mt-stack-lg lg:mt-0">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-stack-sm">Access Portal</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Enter your credentials to continue.</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-stack-md">
            <div className="flex flex-col gap-stack-sm">
              <label htmlFor="email" className="font-label-caps text-label-caps text-on-surface-variant">Corporate Email</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline">mail</span>
                <input 
                  type="email" 
                  id="email" 
                  defaultValue="engineer@domain.com"
                  className="w-full h-touch-target-min pl-10 pr-base bg-surface border border-outline rounded font-body-md text-body-md text-on-surface focus:outline-none focus:border-2 focus:border-primary transition-all placeholder:text-outline-variant" 
                />
              </div>
            </div>

            <div className="flex flex-col gap-stack-sm">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="font-label-caps text-label-caps text-on-surface-variant">Password</label>
                <a href="#" className="font-label-caps text-label-caps text-primary hover:underline">Forgot?</a>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline">lock</span>
                <input 
                  type="password" 
                  id="password" 
                  defaultValue="password"
                  className="w-full h-touch-target-min pl-10 pr-base bg-surface border border-outline rounded font-body-md text-body-md text-on-surface focus:outline-none focus:border-2 focus:border-primary transition-all placeholder:text-outline-variant" 
                />
              </div>
            </div>

            <button type="submit" className="w-full h-touch-target-min bg-primary text-on-primary rounded font-table-data text-table-data hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center mt-base shadow-sm">
              Authenticate
            </button>
          </form>

          <div className="flex items-center my-stack-lg">
            <div className="flex-grow border-t border-outline-variant"></div>
            <span className="px-base font-label-caps text-label-caps text-on-surface-variant">Or Quick Access</span>
            <div className="flex-grow border-t border-outline-variant"></div>
          </div>

          <div className="flex flex-col gap-stack-md">
            <button
              type="button"
              onClick={() => void handleDevLogin()}
              className="w-full h-touch-target-min border border-outline bg-surface-container-lowest text-on-surface rounded font-table-data text-table-data hover:bg-surface-container-low active:bg-surface-container transition-colors flex items-center justify-center gap-base"
            >
              <span className="material-symbols-outlined text-primary">developer_mode</span>
              Dev session (API + DB)
            </button>
            {err && <p className="text-error text-sm">{err}</p>}
            <button type="button" className="w-full h-touch-target-min border border-outline bg-surface-container-lowest text-on-surface rounded font-table-data text-table-data hover:bg-surface-container-low active:bg-surface-container transition-colors flex items-center justify-center gap-base">
              <span className="material-symbols-outlined text-primary">face</span>
              Face ID / Biometric
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
