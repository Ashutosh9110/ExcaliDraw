import { ReactNode } from "react";

interface IconButtonProps {
    onClick: () => void;
    icon: ReactNode;
    activated?: boolean;
    tooltip?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'primary' | 'destructive';
}

export function IconButton({ 
    onClick, 
    icon, 
    activated = false, 
    tooltip,
    size = 'md',
    variant = 'default'
}: IconButtonProps) {
    // Determine sizes based on the size prop
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-8 h-8',
        lg: 'w-10 h-10'
    };
    
    // Determine style based on variant and activation state
    let styleClasses = '';
    
    if (activated) {
        if (variant === 'destructive') {
            styleClasses = 'bg-destructive/20 text-destructive border-destructive';
        } else if (variant === 'primary') {
            styleClasses = 'bg-primary/20 text-primary border-primary';
        } else {
            styleClasses = 'bg-primary/20 text-primary border-primary';
        }
    } else {
        if (variant === 'destructive') {
            styleClasses = 'hover:bg-destructive/10 hover:text-destructive text-destructive/80';
        } else if (variant === 'primary') {
            styleClasses = 'hover:bg-primary/10 hover:text-primary text-foreground';
        } else {
            styleClasses = 'hover:bg-muted/70 text-foreground';
        }
    }

    return (
        <div className="relative group">
            <button
                onClick={onClick}
                className={`flex items-center justify-center rounded-md transition-colors ${sizeClasses[size]} ${styleClasses}`}
            >
                {icon}
            </button>
            
            {tooltip && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-card/95 backdrop-blur-sm text-xs rounded shadow-sm border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {tooltip}
                </div>
            )}
        </div>
    );
}