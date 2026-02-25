import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    padding?: 'none' | 'sm' | 'md' | 'lg';
    interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className = '', padding = 'md', interactive = false, ...props }, ref) => {
        const baseClass = 'bg-surface border border-border rounded-2xl shadow-lg relative overflow-hidden';

        const paddingClass = {
            none: '',
            sm: 'p-4',
            md: 'p-6',
            lg: 'p-8',
        }[padding];

        const interactiveClass = interactive
            ? 'cursor-pointer hover:bg-surface-hover hover:scale-[1.01] hover:shadow-xl hover:border-primary/30 transition-all duration-300 active:scale-[0.98]'
            : '';

        const combinedClassName = `${baseClass} ${paddingClass} ${interactiveClass} ${className}`;

        return (
            <div ref={ref} className={combinedClassName} {...props} />
        );
    }
);

Card.displayName = 'Card';
