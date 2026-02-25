import React from 'react';

interface ProgressBarProps {
    progress: number; // 0 to 100
    height?: string;
    className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    progress,
    height = 'h-2',
    className = '',
}) => {
    const percentage = Math.min(100, Math.max(0, progress));

    return (
        <div className={`w-full bg-surface-hover rounded-full overflow-hidden ${height} ${className}`}>
            <div
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out"
                style={{ width: `${percentage}%` }}
            />
        </div>
    );
};
