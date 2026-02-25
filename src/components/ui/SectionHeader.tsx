import React from 'react';

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
    className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
    title,
    subtitle,
    action,
    className = '',
}) => {
    return (
        <div className={`mb-6 flex flex-wrap gap-4 items-end justify-between ${className}`}>
            <div>
                <h2 className="text-2xl font-ethiopic font-bold text-text mb-1 tracking-tight">
                    {title}
                </h2>
                {subtitle && (
                    <p className="text-muted text-sm">{subtitle}</p>
                )}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
};
