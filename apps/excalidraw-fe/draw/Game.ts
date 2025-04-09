import { Tool } from "@/components/Canvas";
import { getExistingShapes } from "./http";

type FillStyle = 'solid' | 'hachure' | 'cross-hatch';

type Shape = {
    type: "rect";
    x: number;
    y: number;
    width: number;
    height: number;
    strokeColor?: string;
    strokeWidth?: number;
    fillStyle?: FillStyle;
} | {
    type: "circle";
    centerX: number;
    centerY: number;
    radius: number;
    strokeColor?: string;
    strokeWidth?: number;
    fillStyle?: FillStyle;
} | {
    type: "pencil";
    points: { x: number, y: number }[];
    color?: string;
    strokeWidth?: number;
} | {
    type: "eraser";
    points: { x: number, y: number }[];
    size: number;
} | {
    type: "square";
    x: number;
    y: number;
    size: number;
    strokeColor?: string;
    strokeWidth?: number;
    fillStyle?: FillStyle;
} | {
    type: "diamond";
    centerX: number;
    centerY: number;
    width: number;
    height: number;
    strokeColor?: string;
    strokeWidth?: number;
    fillStyle?: FillStyle;
} | {
    type: "arrow";
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    strokeColor?: string;
    strokeWidth?: number;
} | {
    type: "text";
    x: number;
    y: number;
    text: string;
    fontSize?: number;
    fontFamily?: string;
    color?: string;
};

export class Game {

    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private existingShapes: Shape[]
    private roomId: string;
    private clicked: boolean;
    private startX = 0;
    private startY = 0;
    private selectedTool: Tool = "circle";
    private currentPencilPoints: { x: number, y: number }[] = [];
    private currentEraserPoints: { x: number, y: number }[] = [];
    private eraserSize = 20; // Size of the eraser in pixels
    private strokeColor = "#1e1e1e";
    private strokeWidth = 2;
    private fillStyle: FillStyle = 'hachure';

    socket: WebSocket;

    constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.existingShapes = [];
        this.roomId = roomId;
        this.socket = socket;
        this.clicked = false;
        this.init();
        this.initHandlers();
        this.initMouseHandlers();
    }
    
    destroy() {
        this.canvas.removeEventListener("mousedown", this.mouseDownHandler)
        this.canvas.removeEventListener("mouseup", this.mouseUpHandler)
        this.canvas.removeEventListener("mousemove", this.mouseMoveHandler)
    }

    setTool(tool: Tool) {
        this.selectedTool = tool;
    }

    setStrokeColor(color: string) {
        this.strokeColor = color;
    }

    setStrokeWidth(width: number) {
        this.strokeWidth = width;
    }

    setFillStyle(style: FillStyle) {
        this.fillStyle = style;
    }

    async init() {
        this.existingShapes = await getExistingShapes(this.roomId);
        console.log(this.existingShapes);
        this.clearCanvas();
    }

    initHandlers() {
        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.type == "chat") {
                const parsedShape = JSON.parse(message.message)
                this.existingShapes.push(parsedShape.shape)
                this.clearCanvas();
            } else if (message.type === "eraser") {
                const eraserData = JSON.parse(message.message);
                this.existingShapes.push(eraserData.shape);
                this.clearCanvas();
            } else if (message.type === "clear_canvas") {
                this.existingShapes = [];
                this.clearCanvas();
            }
        }
    }

    // Draw the eraser cursor
    private drawEraser(x: number, y: number, size: number) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
        this.ctx.stroke();
        this.ctx.closePath();
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "hsl(30 20% 96%)"; // Use Excalidraw's cream background
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Create a temporary canvas for drawing with eraser applied
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d')!;
        
        // Fill with cream background
        tempCtx.fillStyle = "hsl(30 20% 96%)";
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // First, draw all non-eraser shapes
        this.existingShapes.forEach((shape) => {
            if (shape.type !== "eraser") {
                // Apply sketchy filter for all shapes
                tempCtx.save();
                
                if (shape.type === "rect") {
                    tempCtx.strokeStyle = shape.strokeColor || "#1e1e1e";
                    tempCtx.lineWidth = shape.strokeWidth || 2;
                    
                    // Handle fill based on fillStyle
                    if (shape.fillStyle) {
                        this.applyFillStyle(tempCtx, shape.x, shape.y, shape.width, shape.height, shape.fillStyle, shape.strokeColor || "#1e1e1e");
                    }
                    
                    tempCtx.strokeRect(shape.x, shape.y, shape.width, shape.height);
                } else if (shape.type === "circle") {
                    tempCtx.beginPath();
                    tempCtx.strokeStyle = shape.strokeColor || "#1e1e1e";
                    tempCtx.lineWidth = shape.strokeWidth || 2;
                    
                    tempCtx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, Math.PI * 2);
                    
                    // Handle fill based on fillStyle
                    if (shape.fillStyle) {
                        const x = shape.centerX - shape.radius;
                        const y = shape.centerY - shape.radius;
                        const size = shape.radius * 2;
                        this.applyFillStyle(tempCtx, x, y, size, size, shape.fillStyle, shape.strokeColor || "#1e1e1e");
                    }
                    
                    tempCtx.stroke();
                    tempCtx.closePath();                
                } else if (shape.type === "pencil") {
                    tempCtx.strokeStyle = shape.color || "#1e1e1e";
                    tempCtx.lineWidth = shape.strokeWidth || 2;
                    tempCtx.lineCap = "round";
                    tempCtx.lineJoin = "round";
                    
                    tempCtx.beginPath();
                    const points = shape.points;
                    if (points.length > 0) {
                        tempCtx.moveTo(points[0].x, points[0].y);
                        for (let i = 1; i < points.length; i++) {
                            tempCtx.lineTo(points[i].x, points[i].y);
                        }
                    }
                    tempCtx.stroke();
                    tempCtx.closePath();
                } else if (shape.type === "square") {
                    tempCtx.strokeStyle = shape.strokeColor || "#1e1e1e";
                    tempCtx.lineWidth = shape.strokeWidth || 2;
                    
                    // Handle fill based on fillStyle
                    if (shape.fillStyle) {
                        this.applyFillStyle(tempCtx, shape.x, shape.y, shape.size, shape.size, shape.fillStyle, shape.strokeColor || "#1e1e1e");
                    }
                    
                    tempCtx.strokeRect(shape.x, shape.y, shape.size, shape.size);
                } else if (shape.type === "diamond") {
                    tempCtx.beginPath();
                    tempCtx.strokeStyle = shape.strokeColor || "#1e1e1e";
                    tempCtx.lineWidth = shape.strokeWidth || 2;
                    
                    const halfWidth = shape.width / 2;
                    const halfHeight = shape.height / 2;
                    
                    tempCtx.moveTo(shape.centerX, shape.centerY - halfHeight); // Top
                    tempCtx.lineTo(shape.centerX + halfWidth, shape.centerY); // Right
                    tempCtx.lineTo(shape.centerX, shape.centerY + halfHeight); // Bottom
                    tempCtx.lineTo(shape.centerX - halfWidth, shape.centerY); // Left
                    tempCtx.closePath();
                    
                    // Handle fill based on fillStyle
                    if (shape.fillStyle) {
                        const x = shape.centerX - halfWidth;
                        const y = shape.centerY - halfHeight;
                        this.applyFillStyle(tempCtx, x, y, shape.width, shape.height, shape.fillStyle, shape.strokeColor || "#1e1e1e");
                    }
                    
                    tempCtx.stroke();
                } else if (shape.type === "arrow") {
                    tempCtx.beginPath();
                    tempCtx.strokeStyle = shape.strokeColor || "#1e1e1e";
                    tempCtx.lineWidth = shape.strokeWidth || 2;
                    tempCtx.lineCap = "round";
                    tempCtx.lineJoin = "round";
                    
                    // Draw the main line
                    tempCtx.moveTo(shape.startX, shape.startY);
                    tempCtx.lineTo(shape.endX, shape.endY);
                    
                    // Calculate arrow head
                    const angle = Math.atan2(shape.endY - shape.startY, shape.endX - shape.startX);
                    const headLength = 15; // Length of arrow head
                    
                    // Draw the arrow head
                    tempCtx.lineTo(
                        shape.endX - headLength * Math.cos(angle - Math.PI / 6),
                        shape.endY - headLength * Math.sin(angle - Math.PI / 6)
                    );
                    tempCtx.moveTo(shape.endX, shape.endY);
                    tempCtx.lineTo(
                        shape.endX - headLength * Math.cos(angle + Math.PI / 6),
                        shape.endY - headLength * Math.sin(angle + Math.PI / 6)
                    );
                    
                    tempCtx.stroke();
                } else if (shape.type === "text") {
                    tempCtx.font = `${shape.fontSize || 16}px ${shape.fontFamily || 'Arial'}`;
                    tempCtx.fillStyle = shape.color || "#1e1e1e";
                    tempCtx.fillText(shape.text, shape.x, shape.y);
                }
                
                tempCtx.restore();
            }
        });

        // Then apply eraser shapes
        this.existingShapes.forEach((shape) => {
            if (shape.type === "eraser") {
                tempCtx.globalCompositeOperation = 'destination-out';
                
                // Draw the eraser path with filled circles
                for (let i = 0; i < shape.points.length; i++) {
                    const point = shape.points[i];
                    tempCtx.beginPath();
                    tempCtx.arc(point.x, point.y, shape.size, 0, Math.PI * 2);
                    tempCtx.fill();
                }
                
                // Reset composite operation
                tempCtx.globalCompositeOperation = 'source-over';
            }
        });

        // Draw the temporary canvas onto the main canvas
        this.ctx.drawImage(tempCanvas, 0, 0);

        // Draw eraser cursor if the eraser tool is selected and active
        if (this.selectedTool === "eraser" && this.clicked && this.currentEraserPoints.length > 0) {
            const lastPoint = this.currentEraserPoints[this.currentEraserPoints.length - 1];
            this.drawEraser(lastPoint.x, lastPoint.y, this.eraserSize);
        }
    }

    mouseDownHandler = (e: MouseEvent) => {
        this.clicked = true;
        this.startX = e.clientX;
        this.startY = e.clientY;
        
        // Start new pencil stroke
        if (this.selectedTool === "pencil") {
            this.currentPencilPoints = [{ x: e.clientX, y: e.clientY }];
        } else if (this.selectedTool === "eraser") {
            this.currentEraserPoints = [{ x: e.clientX, y: e.clientY }];
        }
    }

    mouseUpHandler = (e: MouseEvent) => {
        this.clicked = false;
        const width = e.clientX - this.startX;
        const height = e.clientY - this.startY;

        const selectedTool = this.selectedTool;
        let shape: Shape | null = null;
        
        if (selectedTool === "rect") {
            shape = {
                type: "rect",
                x: this.startX,
                y: this.startY,
                height,
                width,
                strokeColor: this.strokeColor,
                strokeWidth: this.strokeWidth,
                fillStyle: this.fillStyle
            };
        } else if (selectedTool === "square") {
            const size = Math.max(Math.abs(width), Math.abs(height));
            const x = this.startX;
            const y = this.startY;
            
            shape = {
                type: "square",
                x,
                y,
                size,
                strokeColor: this.strokeColor,
                strokeWidth: this.strokeWidth,
                fillStyle: this.fillStyle
            };
        } else if (selectedTool === "circle") {
            const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
            shape = {
                type: "circle",
                radius: radius,
                centerX: this.startX + width/2,
                centerY: this.startY + height/2,
                strokeColor: this.strokeColor,
                strokeWidth: this.strokeWidth,
                fillStyle: this.fillStyle
            };
        } else if (selectedTool === "diamond") {
            shape = {
                type: "diamond",
                centerX: this.startX + width/2,
                centerY: this.startY + height/2,
                width: Math.abs(width),
                height: Math.abs(height),
                strokeColor: this.strokeColor,
                strokeWidth: this.strokeWidth,
                fillStyle: this.fillStyle
            };
        } else if (selectedTool === "arrow") {
            shape = {
                type: "arrow",
                startX: this.startX,
                startY: this.startY,
                endX: e.clientX,
                endY: e.clientY,
                strokeColor: this.strokeColor,
                strokeWidth: this.strokeWidth
            };
        } else if (selectedTool === "pencil" && this.currentPencilPoints.length > 1) {
            // Finish pencil stroke
            shape = {
                type: "pencil",
                points: [...this.currentPencilPoints],
                color: this.strokeColor,
                strokeWidth: this.strokeWidth
            };
            this.currentPencilPoints = [];
        } else if (selectedTool === "eraser" && this.currentEraserPoints.length > 1) {
            // Finish eraser stroke
            shape = {
                type: "eraser",
                points: [...this.currentEraserPoints],
                size: this.eraserSize
            };
            
            this.socket.send(JSON.stringify({
                type: "eraser",
                message: JSON.stringify({
                    shape
                }),
                roomId: this.roomId
            }));
            
            this.existingShapes.push(shape);
            this.clearCanvas();
            this.currentEraserPoints = [];
            return;
        } else if (selectedTool === "text") {
            // For text, we'll create a simple text at the click position
            const text = prompt("Enter text:", "");
            if (text) {
                shape = {
                    type: "text",
                    x: this.startX,
                    y: this.startY,
                    text,
                    color: this.strokeColor,
                    fontSize: this.strokeWidth * 8 // Scale up stroke width for font size
                };
            }
        }

        if (!shape) {
            return;
        }

        this.existingShapes.push(shape);

        this.socket.send(JSON.stringify({
            type: "chat",
            message: JSON.stringify({
                shape
            }),
            roomId: this.roomId
        }));
    }

    mouseMoveHandler = (e: MouseEvent) => {
        if (this.clicked) {
            const width = e.clientX - this.startX;
            const height = e.clientY - this.startY;
            
            if (this.selectedTool === "eraser") {
                // Add point to current eraser stroke
                this.currentEraserPoints.push({ x: e.clientX, y: e.clientY });
                
                // Create a temporary copy of shapes to preview eraser effect
                const tempShapes = [...this.existingShapes, {
                    type: "eraser" as const,
                    points: [...this.currentEraserPoints],
                    size: this.eraserSize
                }];
                
                // Clear the canvas and draw all shapes including the temporary eraser
                this.clearCanvas();
                
                // Draw the eraser cursor
                this.drawEraser(e.clientX, e.clientY, this.eraserSize);
                return;
            } else if (this.selectedTool === "pencil") {
                // Add point to current pencil stroke
                this.currentPencilPoints.push({ x: e.clientX, y: e.clientY });
                
                // Create a temporary shape for preview
                const tempShape: Shape = {
                    type: "pencil",
                    points: [...this.currentPencilPoints],
                    color: this.strokeColor,
                    strokeWidth: this.strokeWidth
                };
                
                // Clear and redraw with the temporary pencil stroke
                const tempShapes = [...this.existingShapes, tempShape];
                this.clearCanvas();
                return;
            }
            
            this.clearCanvas();
            
            // Draw preview of the current shape
            this.ctx.strokeStyle = this.strokeColor;
            this.ctx.lineWidth = this.strokeWidth;
            
            if (this.selectedTool === "rect") {
                this.ctx.strokeRect(this.startX, this.startY, width, height);
            } else if (this.selectedTool === "square") {
                const size = Math.max(Math.abs(width), Math.abs(height));
                const x = width < 0 ? this.startX - size : this.startX;
                const y = height < 0 ? this.startY - size : this.startY;
                this.ctx.strokeRect(x, y, size, size);
            } else if (this.selectedTool === "circle") {
                const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
                const centerX = this.startX + width/2;
                const centerY = this.startY + height/2;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.closePath();
            } else if (this.selectedTool === "diamond") {
                const centerX = this.startX + width/2;
                const centerY = this.startY + height/2;
                const halfWidth = Math.abs(width) / 2;
                const halfHeight = Math.abs(height) / 2;
                
                this.ctx.beginPath();
                this.ctx.moveTo(centerX, centerY - halfHeight); // Top
                this.ctx.lineTo(centerX + halfWidth, centerY); // Right
                this.ctx.lineTo(centerX, centerY + halfHeight); // Bottom
                this.ctx.lineTo(centerX - halfWidth, centerY); // Left
                this.ctx.closePath();
                this.ctx.stroke();
            } else if (this.selectedTool === "arrow") {
                this.ctx.beginPath();
                
                // Draw the main line
                this.ctx.moveTo(this.startX, this.startY);
                this.ctx.lineTo(e.clientX, e.clientY);
                
                // Calculate arrow head
                const angle = Math.atan2(e.clientY - this.startY, e.clientX - this.startX);
                const headLength = 15; // Length of arrow head
                
                // Draw the arrow head
                this.ctx.lineTo(
                    e.clientX - headLength * Math.cos(angle - Math.PI / 6),
                    e.clientY - headLength * Math.sin(angle - Math.PI / 6)
                );
                this.ctx.moveTo(e.clientX, e.clientY);
                this.ctx.lineTo(
                    e.clientX - headLength * Math.cos(angle + Math.PI / 6),
                    e.clientY - headLength * Math.sin(angle + Math.PI / 6)
                );
                
                this.ctx.stroke();
            }
        }
    }

    initMouseHandlers() {
        this.canvas.addEventListener("mousedown", this.mouseDownHandler)
        this.canvas.addEventListener("mouseup", this.mouseUpHandler)
        this.canvas.addEventListener("mousemove", this.mouseMoveHandler)    
    }

    clearAllShapes() {
        this.existingShapes = [];
        this.clearCanvas();
        
        // Notify other users that the canvas has been cleared
        this.socket.send(JSON.stringify({
            type: "clear_canvas",
            roomId: this.roomId
        }));
    }

    // Method to apply different fill styles
    private applyFillStyle(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, style: FillStyle, color: string) {
        ctx.fillStyle = color;
        
        if (style === 'solid') {
            // For solid fill, use a semi-transparent fill
            ctx.globalAlpha = 0.2;
            ctx.fill();
            ctx.globalAlpha = 1;
        } else if (style === 'hachure') {
            // For hachure, use diagonal lines
            ctx.save();
            ctx.globalAlpha = 0.15;
            
            const lineSpacing = 8;
            ctx.beginPath();
            
            for (let i = 0; i < width + height; i += lineSpacing) {
                ctx.moveTo(x + Math.min(i, width), y);
                ctx.lineTo(x, y + Math.min(i, height));
            }
            
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.restore();
        } else if (style === 'cross-hatch') {
            // For cross-hatch, use diagonal lines in both directions
            ctx.save();
            ctx.globalAlpha = 0.15;
            
            const lineSpacing = 8;
            ctx.beginPath();
            
            // First direction (top-left to bottom-right)
            for (let i = 0; i < width + height; i += lineSpacing) {
                ctx.moveTo(x + Math.min(i, width), y);
                ctx.lineTo(x, y + Math.min(i, height));
            }
            
            // Second direction (top-right to bottom-left)
            for (let i = 0; i < width + height; i += lineSpacing) {
                ctx.moveTo(x + Math.max(0, i - height), y + Math.min(i, height));
                ctx.lineTo(x + Math.min(width, i), y + Math.max(0, i - width));
            }
            
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.restore();
        }
    }
}