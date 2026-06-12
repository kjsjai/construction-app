import React from 'react';
import { cn } from '../lib/utils';

export const StatCard = ({ title, value, subtitle, icon, className }) => {
  return (
    <div className={cn("bg-card border border-border shadow-sm p-6 rounded-2xl flex flex-col transition-all hover:shadow-md", className)}>
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-primary/5 rounded-xl text-primary ring-1 ring-primary/10">
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-muted font-semibold text-xs uppercase tracking-wider mb-1">{title}</h3>
        <h2 className="text-2xl lg:text-3xl font-bold text-text tracking-tight">{value}</h2>
      </div>
      {subtitle && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-[11px] text-muted font-medium flex items-center">
            {subtitle}
          </p>
        </div>
      )}
    </div>
  );
};
