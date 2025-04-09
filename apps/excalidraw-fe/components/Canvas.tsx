import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { IconButton } from "./IconButton";
import { 
    Circle, Pencil, RectangleHorizontalIcon, Palette, Eraser, Square, Grid, Mouse, 
    Image, Text, ArrowUpDown, Hand, Diamond, Star, Save, Download, Upload, Trash2, 
    Info, Layers, Share2, Lock, PenTool, Zap, HelpCircle, Settings, Plus
} from "lucide-react";
import { Game } from "@/draw/Game";
import { ThemeToggle, ThemeSelector } from "./ThemeProvider";
import { Navbar } from "./Navbar";

export type Tool = "circle" | "rect" | "pencil" | "eraser" | "square" | "diamond" | "arrow" | "text" | "line" | "image" | "select";

export function Canvas({
    roomId,
    socket
}: {
    socket: WebSocket;
    roomId: string;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [game, setGame] = useState<Game>();
    const [selectedTool, setSelectedTool] = useState<Tool>("select");
    const [showThemeSelector, setShowThemeSelector] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [selectedColor, setSelectedColor] = useState("#1e1e1e");
    const [strokeWidth, setStrokeWidth] = useState(2);
    const [showSidebar, setShowSidebar] = useState(false);
    const [isGridVisible, setIsGridVisible] = useState(true);
    const [showShareDialog, setShowShareDialog] = useState(false);
    const [fillStyle, setFillStyle] = useState<'solid' | 'hachure' | 'cross-hatch'>('hachure');
    const [showStrokeOptions, setShowStrokeOptions] = useState(false);
    const [showHelpDialog, setShowHelpDialog] = useState(false);

    const colors = [
        "#1e1e1e", "#343a40", "#495057", "#c92a2a", "#a61e4d", 
        "#862e9c", "#5f3dc4", "#364fc7", "#1864ab", "#0b7285", 
        "#087f5b", "#2b8a3e", "#5c940d", "#e67700", "#d9480f"
    ];

    const bgColors = [
        "transparent", "#fff5f5", "#fff0f6", "#f8f0fc", "#f3f0ff", 
        "#edf2ff", "#e7f5ff", "#e3fafc", "#e6fcf5", "#ebfbee", 
        "#f4fce3", "#fff9db", "#fff4e6"
    ];

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only handle shortcuts if not typing in a field
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            switch (e.key.toLowerCase()) {
                case 'v':
                    setSelectedTool('select');
                    break;
                case 'h':
                    // Handle hand/pan tool
                    break;
                case 'p':
                    setSelectedTool('pencil');
                    break;
                case 'e':
                    setSelectedTool('eraser');
                    break;
                case 'r':
                    setSelectedTool('rect');
                    break;
                case 's':
                    setSelectedTool('square');
                    break;
                case 'c':
                    setSelectedTool('circle');
                    break;
                case 'd':
                    setSelectedTool('diamond');
                    break;
                case 'a':
                    setSelectedTool('arrow');
                    break;
                case 't':
                    setSelectedTool('text');
                    break;
                case 'i':
                    setSelectedTool('image');
                    break;
                case 'g':
                    setIsGridVisible(!isGridVisible);
                    break;
                case 'q':
                    setShowSidebar(!showSidebar);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isGridVisible, showSidebar]);

    useEffect(() => {
        if (game) {
            game.setTool(selectedTool);
            game.setStrokeColor(selectedColor);
            game.setStrokeWidth(strokeWidth);
            game.setFillStyle(fillStyle);
        }
        
        // Set the global window.selectedTool property for compatibility with index.ts
        window.selectedTool = selectedTool;
    }, [selectedTool, selectedColor, strokeWidth, fillStyle, game]);

    useEffect(() => {
        if (canvasRef.current) {
            const g = new Game(canvasRef.current, roomId, socket);
            setGame(g);

            return () => {
                g.destroy();
            }
        }
    }, [canvasRef, roomId, socket]);

    // Function to copy room link
    const copyRoomLink = () => {
        const url = `${window.location.origin}/canvas/${roomId}`;
        navigator.clipboard.writeText(url);
        // Show a temporary success message
        alert('Room link copied to clipboard!');
        setShowShareDialog(false);
    };

    // Function to clear the canvas
    const clearCanvas = () => {
        if (window.confirm('Are you sure you want to clear the canvas? This action cannot be undone.')) {
            game?.clearAllShapes();
        }
    };

    return (
        <div className="h-screen bg-background overflow-hidden">
            {/* SVG filter for sketchy effect */}
            <svg width="0" height="0" style={{ position: 'absolute' }}>
                <filter id="pencil-filter">
                    <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G" />
                </filter>
            </svg>
            
            <Navbar />
            
            <div className="h-full pt-12 flex">
                {/* Left Sidebar */}
                {showSidebar && (
                    <div className="w-64 border-r border-border h-full bg-card/95 backdrop-blur-sm p-4 overflow-y-auto pop-in excalidraw-panel">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium">Excalidraw Library</h3>
                            <button className="p-1 rounded hover:bg-muted">
                                <Plus size={16} />
                            </button>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="p-2 rounded border border-border hover:bg-muted cursor-pointer flex items-center gap-2">
                                <Grid size={16} />
                                <span>Basic shapes</span>
                            </div>
                            <div className="p-2 rounded border border-border hover:bg-muted cursor-pointer flex items-center gap-2">
                                <Square size={16} />
                                <span>UML</span>
                            </div>
                            <div className="p-2 rounded border border-border hover:bg-muted cursor-pointer flex items-center gap-2">
                                <Circle size={16} />
                                <span>Flowchart</span>
            </div>
        </div>

                        <h3 className="font-medium mt-6 mb-4">Export</h3>
                        <div className="space-y-2">
                            <button className="w-full p-2 rounded border border-border hover:bg-muted cursor-pointer flex items-center gap-2">
                                <Download size={16} />
                                <span>Export as PNG</span>
                            </button>
                            <button className="w-full p-2 rounded border border-border hover:bg-muted cursor-pointer flex items-center gap-2">
                                <Download size={16} />
                                <span>Export as SVG</span>
                            </button>
                            <button className="w-full p-2 rounded border border-border hover:bg-muted cursor-pointer flex items-center gap-2">
                                <Save size={16} />
                                <span>Save to cloud</span>
                            </button>
                        </div>

                        <h3 className="font-medium mt-6 mb-4">Import</h3>
                        <button className="w-full p-2 rounded border border-border hover:bg-muted cursor-pointer flex items-center gap-2">
                            <Upload size={16} />
                            <span>Import file</span>
                        </button>

                        <h3 className="font-medium mt-6 mb-4">Canvas Settings</h3>
                        <div className="space-y-2">
                            <button 
                                className="w-full p-2 rounded border border-border hover:bg-muted cursor-pointer flex items-center justify-between"
                                onClick={() => setIsGridVisible(!isGridVisible)}
                            >
                                <div className="flex items-center gap-2">
                                    <Grid size={16} />
                                    <span>Show grid</span>
                                </div>
                                <div className={`w-4 h-4 rounded border ${isGridVisible ? 'bg-primary border-primary' : 'border-border'}`}></div>
                            </button>
                            
                            <div className="p-2 rounded border border-border">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Palette size={16} />
                                        <span>Background</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-6 gap-1 mt-2">
                                    {bgColors.map((color) => (
                                        <button
                                            key={color}
                                            className={`w-6 h-6 rounded-sm ${color === 'transparent' ? 'border border-dashed border-border' : ''}`}
                                            style={{ 
                                                backgroundColor: color === 'transparent' ? 'transparent' : color,
                                                border: color !== 'transparent' ? '1px solid #ddd' : undefined
                                            }}
                                        ></button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button 
                            className="w-full p-2 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 cursor-pointer flex items-center gap-2 mt-6"
                            onClick={clearCanvas}
                        >
                            <Trash2 size={16} />
                            <span>Clear canvas</span>
                        </button>
                        
                        <div className="mt-6 pt-6 border-t border-border">
                            <h3 className="font-medium mb-4">Room Information</h3>
                            <div className="p-2 rounded border border-border bg-muted/30">
                                <p className="text-xs text-muted-foreground mb-1">Room ID:</p>
                                <p className="text-sm break-all mb-2">{roomId}</p>
                                <button 
                                    className="w-full p-2 rounded bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer flex items-center gap-2 mt-2"
                                    onClick={() => setShowShareDialog(true)}
                                >
                                    <Share2 size={16} />
                                    <span>Share Room</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Canvas Area */}
                <div className="flex-1 relative overflow-hidden">
                    {isGridVisible && (
                        <div className="absolute inset-0 canvas-grid pointer-events-none"></div>
                    )}
                    <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight - 48} className="absolute inset-0"></canvas>
                </div>
            </div>

            {/* Left sidebar toggle button */}
            <button 
                onClick={() => setShowSidebar(!showSidebar)}
                className="fixed left-3 top-20 flex items-center justify-center w-8 h-8 rounded-sm bg-card/95 backdrop-blur-sm border border-border shadow-sm hover:bg-muted z-10"
            >
                {showSidebar ? "←" : "→"}
            </button>

            {/* Excalidraw-style toolbar */}
            <div className="fixed top-16 left-1/2 -translate-x-1/2 excalidraw-toolbar z-10">
                <div className="flex items-center gap-1">
                    <button 
                        className={`${selectedTool === "select" ? 'active' : ''}`}
                        onClick={() => setSelectedTool("select")}
                        title="Select (V)"
                    >
                        <Mouse size={20} />
                    </button>
                    <button 
                        className={`${selectedTool === "hand" ? 'active' : ''}`}
                        onClick={() => setSelectedTool("hand")}
                        title="Hand (H)"
                    >
                        <Hand size={20} />
                    </button>
                    
                    <div className="h-4 mx-1 border-r border-border"></div>
                    
                    <button 
                        className={`${selectedTool === "pencil" ? 'active' : ''}`}
                        onClick={() => setSelectedTool("pencil")}
                        title="Pencil (P)"
                    >
                        <PenTool size={20} />
                    </button>
                    <button 
                        className={`${selectedTool === "eraser" ? 'active' : ''}`}
                        onClick={() => setSelectedTool("eraser")}
                        title="Eraser (E)"
                    >
                        <Eraser size={20} />
                    </button>
                    
                    <div className="h-4 mx-1 border-r border-border"></div>
                    
                    <button 
                        className={`${selectedTool === "square" ? 'active' : ''}`}
                        onClick={() => setSelectedTool("square")}
                        title="Square (S)"
                    >
                        <Square size={20} />
                    </button>
                    <button 
                        className={`${selectedTool === "rect" ? 'active' : ''}`}
                        onClick={() => setSelectedTool("rect")}
                        title="Rectangle (R)"
                    >
                        <RectangleHorizontalIcon size={20} />
                    </button>
                    <button 
                        className={`${selectedTool === "diamond" ? 'active' : ''}`}
                        onClick={() => setSelectedTool("diamond")}
                        title="Diamond (D)"
                    >
                        <Diamond size={20} />
                    </button>
                    <button 
                        className={`${selectedTool === "circle" ? 'active' : ''}`}
                        onClick={() => setSelectedTool("circle")}
                        title="Circle (C)"
                    >
                        <Circle size={20} />
                    </button>
                    <button 
                        className={`${selectedTool === "arrow" ? 'active' : ''}`}
                        onClick={() => setSelectedTool("arrow")}
                        title="Arrow (A)"
                    >
                        <ArrowUpDown size={20} />
                    </button>
                    
                    <div className="h-4 mx-1 border-r border-border"></div>
                    
                    <button 
                        className={`${selectedTool === "text" ? 'active' : ''}`}
                        onClick={() => setSelectedTool("text")}
                        title="Text (T)"
                    >
                        <Text size={20} />
                    </button>
                    <button 
                        className={`${selectedTool === "image" ? 'active' : ''}`}
                        onClick={() => setSelectedTool("image")}
                        title="Image (I)"
                    >
                        <Image size={20} />
                    </button>
                </div>
            </div>

            {/* Left side tools */}
            <div className="fixed left-3 top-36 excalidraw-toolbar flex flex-col z-10">
                <button 
                    onClick={() => setShowHelpDialog(true)}
                    title="Help"
                >
                    <HelpCircle size={20} />
                </button>
                <button 
                    onClick={() => setIsGridVisible(!isGridVisible)}
                    className={`${isGridVisible ? 'active' : ''}`}
                    title="Toggle Grid (G)"
                >
                    <Grid size={20} />
                </button>
                <button 
                    onClick={() => {}} 
                    title="Settings"
                >
                    <Settings size={20} />
                </button>
            </div>

            {/* Bottom toolbar */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 excalidraw-toolbar z-10 flex items-center">
                {/* Fill style selector */}
                <div className="flex items-center gap-1 mr-2">
                    <button
                        className={`${fillStyle === 'solid' ? 'active' : ''}`}
                        onClick={() => setFillStyle('solid')} 
                        title="Solid fill"
                    >
                        <div className="w-4 h-4 bg-foreground rounded-sm mx-auto" />
                    </button>
                    <button
                        className={`${fillStyle === 'hachure' ? 'active' : ''}`}
                        onClick={() => setFillStyle('hachure')}
                        title="Hachure fill"
                    >
                        <div className="w-4 h-4 bg-foreground/20 rounded-sm mx-auto" style={{backgroundImage: 'linear-gradient(45deg, currentColor 25%, transparent 25%, transparent 50%, currentColor 50%, currentColor 75%, transparent 75%, transparent)', backgroundSize: '4px 4px'}} />
                    </button>
                    <button
                        className={`${fillStyle === 'cross-hatch' ? 'active' : ''}`}
                        onClick={() => setFillStyle('cross-hatch')}
                        title="Cross-hatch fill"
                    >
                        <div className="w-4 h-4 bg-foreground/20 rounded-sm mx-auto" style={{backgroundImage: 'linear-gradient(45deg, currentColor 25%, transparent 25%, transparent 50%, currentColor 50%, currentColor 75%, transparent 75%, transparent), linear-gradient(-45deg, currentColor 25%, transparent 25%, transparent 50%, currentColor 50%, currentColor 75%, transparent 75%, transparent)', backgroundSize: '4px 4px'}} />
                    </button>
                </div>

                {/* Color picker button */}
                <div className="relative">
                    <button 
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="w-8 h-8 p-1 border border-border overflow-hidden rounded-sm"
                    >
                        <div className="w-full h-full rounded-sm" style={{ backgroundColor: selectedColor }}></div>
                    </button>
                    
                    {/* Color picker popup */}
                    {showColorPicker && (
                        <div className="absolute bottom-full left-0 mb-2 bg-card p-3 rounded-md shadow-lg border border-border grid grid-cols-5 gap-2 w-48 pop-in">
                            {colors.map((color) => (
                                <button
                                    key={color}
                                    className={`w-7 h-7 rounded-sm ${selectedColor === color ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : 'border border-border'}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => {
                                        setSelectedColor(color);
                                    }}
                                ></button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Stroke width selector */}
                <div className="flex items-center gap-1 ml-2">
                    <button
                        className={`${strokeWidth === 1 ? 'active' : ''}`}
                        onClick={() => setStrokeWidth(1)}
                        title="Thin stroke"
                    >
                        <div className="w-6 h-6 flex items-center justify-center">
                            <div className="w-6 h-1 bg-foreground rounded-full"></div>
                        </div>
                    </button>
                    <button
                        className={`${strokeWidth === 2 ? 'active' : ''}`}
                        onClick={() => setStrokeWidth(2)}
                        title="Medium stroke"
                    >
                        <div className="w-6 h-6 flex items-center justify-center">
                            <div className="w-6 h-1.5 bg-foreground rounded-full"></div>
                        </div>
                    </button>
                    <button
                        className={`${strokeWidth === 4 ? 'active' : ''}`}
                        onClick={() => setStrokeWidth(4)}
                        title="Thick stroke"
                    >
                        <div className="w-6 h-6 flex items-center justify-center">
                            <div className="w-6 h-2 bg-foreground rounded-full"></div>
                        </div>
                    </button>
                </div>

                {/* Additional tools */}
                <div className="border-l border-border h-8 mx-2"></div>
                
                <button 
                    onClick={() => setShowShareDialog(true)}
                    title="Share Room"
                >
                    <Share2 size={20} />
                </button>
                
                <button
                    onClick={() => {}}
                    title="Layers"
                >
                    <Layers size={20} />
                </button>

                {/* Theme toggle */}
                <ThemeToggle />
            </div>

            {/* Help dialog */}
            {showHelpDialog && (
                <div className="fixed inset-0 flex items-center justify-center bg-foreground/20 z-50">
                    <div className="bg-card p-6 rounded-md shadow-lg border border-border w-full max-w-lg pop-in">
                        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                            <HelpCircle size={20} />
                            Keyboard Shortcuts
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center justify-between">
                                <span>Select Tool</span>
                                <kbd className="px-2 py-1 bg-muted rounded">V</kbd>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Hand Tool</span>
                                <kbd className="px-2 py-1 bg-muted rounded">H</kbd>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Pencil Tool</span>
                                <kbd className="px-2 py-1 bg-muted rounded">P</kbd>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Eraser Tool</span>
                                <kbd className="px-2 py-1 bg-muted rounded">E</kbd>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Rectangle Tool</span>
                                <kbd className="px-2 py-1 bg-muted rounded">R</kbd>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Circle Tool</span>
                                <kbd className="px-2 py-1 bg-muted rounded">C</kbd>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Toggle Grid</span>
                                <kbd className="px-2 py-1 bg-muted rounded">G</kbd>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Toggle Sidebar</span>
                                <kbd className="px-2 py-1 bg-muted rounded">Q</kbd>
                            </div>
                        </div>
                        <div className="flex justify-end mt-6">
                            <button 
                                onClick={() => setShowHelpDialog(false)}
                                className="px-3 py-2 bg-muted hover:bg-muted/80 rounded-md text-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Share dialog */}
            {showShareDialog && (
                <div className="fixed inset-0 flex items-center justify-center bg-foreground/20 z-50">
                    <div className="bg-card p-6 rounded-md shadow-lg border border-border w-full max-w-md pop-in">
                        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                            <Share2 size={20} />
                            Share this whiteboard
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Anyone with the link can access this whiteboard room.
                        </p>
                        <div className="flex items-center gap-2 mb-6">
                            <input 
                                type="text" 
                                value={`${window.location.origin}/canvas/${roomId}`}
                                readOnly
                                className="flex-1 p-2 border border-border rounded-sm bg-background text-sm"
                            />
                            <button 
                                onClick={copyRoomLink}
                                className="px-3 py-2 bg-primary text-primary-foreground rounded-sm text-sm"
                            >
                                Copy
                            </button>
                        </div>
                        <div className="flex justify-end">
                            <button 
                                onClick={() => setShowShareDialog(false)}
                                className="px-3 py-2 bg-muted hover:bg-muted/80 rounded-sm text-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}