import { useEffect, useRef, useState } from "react";
import { IconButton } from "./IconButton";
import { Circle, Pencil, RectangleHorizontalIcon, Palette, Eraser } from "lucide-react";
import { Game } from "@/draw/Game";
import { ThemeToggle, ThemeSelector } from "./ThemeProvider";
import { Navbar } from "./Navbar";

export type Tool = "circle" | "rect" | "pencil" | "eraser";

export function Canvas({
    roomId,
    socket
}: {
    socket: WebSocket;
    roomId: string;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [game, setGame] = useState<Game>();
    const [selectedTool, setSelectedTool] = useState<Tool>("circle");
    const [showThemeSelector, setShowThemeSelector] = useState(false);

    useEffect(() => {
        game?.setTool(selectedTool);
        
        // Set the global window.selectedTool property for compatibility with index.ts
        window.selectedTool = selectedTool;
    }, [selectedTool, game]);

    useEffect(() => {
        if (canvasRef.current) {
            const g = new Game(canvasRef.current, roomId, socket);
            setGame(g);

            return () => {
                g.destroy();
            }
        }
    }, [canvasRef, roomId, socket]);

    return (
        <div className="h-screen bg-background overflow-hidden">
            <Navbar />
            <div className="h-full pt-12"> {/* Add padding top to account for navbar */}
                <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight - 48}></canvas>
                <Topbar 
                    setSelectedTool={setSelectedTool} 
                    selectedTool={selectedTool} 
                    showThemeSelector={showThemeSelector}
                    setShowThemeSelector={setShowThemeSelector}
                />
            </div>
        </div>
    );
}

function Topbar({
    selectedTool, 
    setSelectedTool,
    showThemeSelector,
    setShowThemeSelector
}: {
    selectedTool: Tool,
    setSelectedTool: (s: Tool) => void,
    showThemeSelector: boolean,
    setShowThemeSelector: (show: boolean) => void
}) {
    return (
        <>
            <div style={{
                position: "fixed",
                top: 70, // Adjusted to be below navbar
                left: 10
            }}>
                <div className="flex gap-1">
                    <IconButton 
                        onClick={() => {
                            setSelectedTool("pencil")
                        }}
                        activated={selectedTool === "pencil"}
                        icon={<Pencil />}
                    />
                    <IconButton 
                        onClick={() => {
                            setSelectedTool("eraser")
                        }}
                        activated={selectedTool === "eraser"}
                        icon={<Eraser />}
                    />
                    <IconButton 
                        onClick={() => {
                            setSelectedTool("rect")
                        }} 
                        activated={selectedTool === "rect"} 
                        icon={<RectangleHorizontalIcon />} 
                    />
                    <IconButton 
                        onClick={() => {
                            setSelectedTool("circle")
                        }} 
                        activated={selectedTool === "circle"} 
                        icon={<Circle />}
                    />
                </div>
            </div>

            {/* Theme controls in top right */}
            <div className="fixed top-16 right-3 flex gap-2 items-center bg-card/80 backdrop-blur-sm p-2 rounded-lg shadow-sm border border-border">
                <div className="flex items-center mr-1">
                    <span className="text-xs text-muted-foreground mr-2">Theme</span>
                    <IconButton 
                        onClick={() => setShowThemeSelector(!showThemeSelector)} 
                        activated={showThemeSelector}
                        icon={<Palette size={18} />}
                    />
                </div>
                <ThemeToggle />
            </div>

            {/* Theme selector popup */}
            {showThemeSelector && (
                <div 
                    className="fixed top-28 right-3 bg-card p-3 rounded-lg shadow-lg border border-border animate-in fade-in slide-in-from-top-5 duration-300"
                >
                    <p className="text-xs text-muted-foreground mb-2">Select Color Theme</p>
                    <ThemeSelector />
                </div>
            )}
        </>
    );
}