import React from 'react';
export function StatsCard({ title, value, icon: Icon, subtext }) {
    return (
        <div className="bg-white/5 border border-white/10 p-6 rounded-xl hover:border-neon-purple/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm uppercase tracking-wider font-semibold">{title}</span>
                {Icon && <Icon className="text-neon-purple w-5 h-5" />}
            </div>
            <div className="text-3xl font-bold text-white mb-1">
                {value}
            </div>
            {subtext && <div className="text-xs text-gray-500">{subtext}</div>}
        </div>
    );
}
