import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { IconButton } from "./IconButton";
import { Circle, Pencil, RectangleHorizontalIcon, Palette, Eraser, Square, Grid, Mouse, Image, Text, ArrowUpDown, Hand, Diamond, Star, Save, Download, Upload, Trash2, Info, Layers, Share2 } from "lucide-react";
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
    const [selectedTool, setSelectedTool] = useState<Tool>("circle");
    const [showThemeSelector, setShowThemeSelector] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [selectedColor, setSelectedColor] = useState("#ffffff");
    const [strokeWidth, setStrokeWidth] = useState(2);
    const [showSidebar, setShowSidebar] = useState(false);
    const [isGridVisible, setIsGridVisible] = useState(true);
    const [showShareDialog, setShowShareDialog] = useState(false);

    const colors = [
        "#ffffff", "#f44336", "#e91e63", "#9c27b0", "#673ab7", 
        "#3f51b5", "#2196f3", "#03a9f4", "#00bcd4", "#009688", 
        "#4caf50", "#8bc34a", "#cddc39", "#ffeb3b", "#ffc107", 
        "#ff9800", "#ff5722", "#795548", "#9e9e9e", "#607d8b"
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
        }
        
        // Set the global window.selectedTool property for compatibility with index.ts
        window.selectedTool = selectedTool;
    }, [selectedTool, selectedColor, strokeWidth, game]);

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
            <Navbar />
            <div className="h-full pt-12 flex"> {/* Add padding top to account for navbar */}
                {/* Left Sidebar */}
                {showSidebar && (
                    <div className="w-64 border-r border-border h-full bg-card/50 backdrop-blur-sm p-4 overflow-y-auto pop-in">
                        <h3 className="font-medium mb-4">Libraries</h3>
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

                        <h3 className="font-medium mt-6 mb-4">Canvas</h3>
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
                className="fixed left-3 top-20 flex items-center justify-center w-8 h-8 rounded-md bg-card/80 backdrop-blur-sm border border-border shadow-sm hover:bg-card z-10"
            >
                {showSidebar ? "←" : "→"}
            </button>

            {/* Tools */}
            <div style={{
                position: "fixed",
                top: 70, // Adjusted to be below navbar
                left: showSidebar ? 274 : 10
            }}>
                <div className="bg-card/80 backdrop-blur-sm p-2 rounded-lg shadow-sm border border-border">
                    <div className="flex flex-col gap-1 items-center">
                        <IconButton 
                            onClick={() => {
                                setSelectedTool("select")
                            }}
                            activated={selectedTool === "select"}
                            icon={<Mouse />}
                            tooltip="Select (V)"
                        />
                        <IconButton 
                            onClick={() => {
                                setSelectedTool("hand")
                            }}
                            activated={selectedTool === "hand"}
                            icon={<Hand />}
                            tooltip="Hand (H)"
                        />
                        <IconButton 
                            onClick={() => {
                                setSelectedTool("pencil")
                            }}
                            activated={selectedTool === "pencil"}
                            icon={<Pencil />}
                            tooltip="Pencil (P)"
                        />
                        <IconButton 
                            onClick={() => {
                                setSelectedTool("eraser")
                            }}
                            activated={selectedTool === "eraser"}
                            icon={<Eraser />}
                            tooltip="Eraser (E)"
                        />
                        <IconButton 
                            onClick={() => {
                                setSelectedTool("rect")
                            }} 
                            activated={selectedTool === "rect"} 
                            icon={<RectangleHorizontalIcon />} 
                            tooltip="Rectangle (R)"
                        />
                        <IconButton 
                            onClick={() => {
                                setSelectedTool("square")
                            }}
                            activated={selectedTool === "square"}
                            icon={<Square />}
                            tooltip="Square (S)"
                        />
                        <IconButton 
                            onClick={() => {
                                setSelectedTool("circle")
                            }} 
                            activated={selectedTool === "circle"} 
                            icon={<Circle />}
                            tooltip="Circle (C)"
                        />
                        <IconButton 
                            onClick={() => {
                                setSelectedTool("diamond")
                            }}
                            activated={selectedTool === "diamond"}
                            icon={<Diamond />}
                            tooltip="Diamond (D)"
                        />
                        <IconButton 
                            onClick={() => {
                                setSelectedTool("arrow")
                            }}
                            activated={selectedTool === "arrow"}
                            icon={<ArrowUpDown />}
                            tooltip="Arrow (A)"
                        />
                        <IconButton 
                            onClick={() => {
                                setSelectedTool("text")
                            }}
                            activated={selectedTool === "text"}
                            icon={<Text />}
                            tooltip="Text (T)"
                        />
                        <IconButton 
                            onClick={() => {
                                setSelectedTool("image")
                            }}
                            activated={selectedTool === "image"}
                            icon={<Image />}
                            tooltip="Image (I)"
                        />
                    </div>
                </div>
            </div>

            {/* Bottom toolbar */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-card/80 backdrop-blur-sm p-2 rounded-lg shadow-sm border border-border flex items-center gap-4">
                {/* Color picker button */}
                <div className="relative">
                    <button 
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="w-8 h-8 rounded-md border border-border overflow-hidden"
                        style={{ backgroundColor: selectedColor }}
                    >
                    </button>
                    
                    {/* Color picker popup */}
                    {showColorPicker && (
                        <div className="absolute bottom-full left-0 mb-2 bg-card p-3 rounded-lg shadow-lg border border-border grid grid-cols-5 gap-2 w-48 pop-in">
                            {colors.map((color) => (
                                <button
                                    key={color}
                                    className={`w-7 h-7 rounded-md ${selectedColor === color ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'border border-border'}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => {
                                        setSelectedColor(color);
                                        setShowColorPicker(false);
                                    }}
                                ></button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Stroke width selector */}
                <div className="space-x-2">
                    {[1, 2, 4, 6].map((width) => (
                        <button
                            key={width}
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-md ${strokeWidth === width ? 'bg-primary/20 border-primary' : 'hover:bg-muted'} border border-border`}
                            onClick={() => setStrokeWidth(width)}
                        >
                            <div 
                                className="rounded-full bg-foreground" 
                                style={{ 
                                    width: Math.min(width * 2, 16),
                                    height: Math.min(width * 2, 16)
                                }}
                            ></div>
                        </button>
                    ))}
                </div>

                {/* Additional tools */}
                <div className="border-l border-border h-8 mx-2"></div>
                
                <IconButton 
                    onClick={() => setIsGridVisible(!isGridVisible)} 
                    activated={isGridVisible}
                    icon={<Grid size={18} />}
                    tooltip="Toggle Grid (G)"
                />
                
                <IconButton 
                    onClick={() => setShowShareDialog(true)} 
                    activated={false}
                    icon={<Share2 size={18} />}
                    tooltip="Share Room"
                />
                
                <IconButton 
                    onClick={() => {}} 
                    activated={false}
                    icon={<Layers size={18} />}
                    tooltip="Layers"
                />

                {/* Theme selector button */}
                <IconButton 
                    onClick={() => setShowThemeSelector(!showThemeSelector)} 
                    activated={showThemeSelector}
                    icon={<Palette size={18} />}
                    tooltip="Theme"
                />
            </div>

            {/* Theme selector popup */}
            {showThemeSelector && (
                <div 
                    className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-card p-3 rounded-lg shadow-lg border border-border pop-in"
                >
                    <p className="text-xs text-muted-foreground mb-2">Select Color Theme</p>
                    <ThemeSelector />
                </div>
            )}
            
            {/* Share dialog */}
            {showShareDialog && (
                <div className="fixed inset-0 flex items-center justify-center bg-foreground/20 z-50">
                    <div className="bg-card p-6 rounded-lg shadow-lg border border-border w-full max-w-md pop-in">
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
                                className="flex-1 p-2 border border-border rounded bg-background text-sm"
                            />
                            <button 
                                onClick={copyRoomLink}
                                className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm"
                            >
                                Copy
                            </button>
                        </div>
                        <div className="flex justify-end">
                            <button 
                                onClick={() => setShowShareDialog(false)}
                                className="px-3 py-2 bg-muted hover:bg-muted/80 rounded-md text-sm"
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