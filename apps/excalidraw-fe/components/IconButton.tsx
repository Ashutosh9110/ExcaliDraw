import { ReactNode } from "react";

export function IconButton({
    icon, 
    onClick, 
    activated
}: {
    icon: ReactNode,
    onClick: () => void,
    activated: boolean
}) {
    return (
        <button 
            className={`
                flex items-center justify-center p-2 rounded-md transition-all
                ${activated 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "bg-background text-foreground hover:bg-muted/50"}
                border border-border
            `} 
            onClick={onClick}
        >
            {icon}
        </button>
    );
}