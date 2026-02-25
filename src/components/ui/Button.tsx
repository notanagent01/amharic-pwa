import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    fullWidth?: boolean;
    isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className = '',
            variant = 'primary',
            size = 'md',
            fullWidth = false,
            isLoading = false,
            children,
            disabled,
            ...props
        },
        ref
    ) => {
        // Base classes for structural sizing & font
        const baseClass =
            'inline-flex items-center justify-center font-ethiopic font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none';

        // Size variations
        const sizeMap: Record<ButtonSize, string> = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-6 py-3 text-base',
            lg: 'px-8 py-4 text-lg',
        };

        // Style variations using custom variables mapped from tailwind.config
        const variantMap: Record<ButtonVariant, string> = {
            primary:
                'bg-primary text-white hover:bg-primary/90 focus:ring-primary shadow-[0_0_15px_-3px_rgba(230,57,70,0.4)]',
            secondary:
                'bg-secondary text-bg hover:bg-secondary/90 focus:ring-secondary',
            outline:
                'bg-transparent text-primary hover:bg-primary/10 border-2 border-primary focus:ring-primary',
            ghost:
                'bg-transparent text-text hover:bg-surface focus:ring-text',
        };

        const widthClass = fullWidth ? 'w-full' : '';
        const loadingClass = isLoading ? 'opacity-75 cursor-not-allowed' : '';
        const combinedClassName = `${baseClass} ${sizeMap[size]} ${variantMap[variant]} ${widthClass} ${loadingClass} ${className}`;

        return (
            <button ref={ref} className={combinedClassName} disabled={disabled || isLoading} {...props}>
                {isLoading && (
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 currentColor" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
