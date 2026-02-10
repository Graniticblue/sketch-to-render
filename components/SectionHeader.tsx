import React from 'react';

interface SectionHeaderProps {
    title: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => (
    <div className="mb-3">
        <h2 className="text-[24px] font-bold text-slate-800 tracking-tight">{title}</h2>
    </div>
);
