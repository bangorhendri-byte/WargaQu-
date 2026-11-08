import React from 'react';

interface AndroidFrameProps {
  children: React.ReactNode;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({ children }) => {
  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-emerald-950/15 flex flex-col items-center justify-start text-slate-800 antialiased font-sans selection:bg-emerald-600 selection:text-white overflow-hidden">
      {/* Clean Full-Bleed Mobile Web Container (Fit to dynamic viewport) */}
      <div className="w-full max-w-md h-full max-h-full flex flex-col relative bg-[#f0fdf4] shadow-2xl overflow-hidden">
        {children}
      </div>
    </div>
  );
};
