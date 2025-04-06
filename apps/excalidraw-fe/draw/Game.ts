import { Tool } from "@/components/Canvas";
import { getExistingShapes } from "./http";

type Shape = {
    type: "rect";
    x: number;
    y: number;
    width: number;
    height: number;
} | {
    type: "circle";
    centerX: number;
    centerY: number;
    radius: number;
} | {
    type: "pencil";
    points: { x: number, y: number }[];
    color?: string;
} | {
    type: "eraser";
    points: { x: number, y: number }[];
    size: number;
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
        this.ctx.fillStyle = "rgba(0, 0, 0)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Create a temporary canvas for drawing with eraser applied
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d')!;
        
        // Fill with black background
        tempCtx.fillStyle = "rgba(0, 0, 0)";
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // First, draw all non-eraser shapes
        this.existingShapes.forEach((shape) => {
            if (shape.type !== "eraser") {
                if (shape.type === "rect") {
                    tempCtx.strokeStyle = "rgba(255, 255, 255)";
                    tempCtx.lineWidth = 2;
                    tempCtx.strokeRect(shape.x, shape.y, shape.width, shape.height);
                } else if (shape.type === "circle") {
                    tempCtx.beginPath();
                    tempCtx.strokeStyle = "rgba(255, 255, 255)";
                    tempCtx.lineWidth = 2;
                    tempCtx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, Math.PI * 2);
                    tempCtx.stroke();
                    tempCtx.closePath();                
                } else if (shape.type === "pencil") {
                    tempCtx.strokeStyle = shape.color || "rgba(255, 255, 255)";
                    tempCtx.lineWidth = 2;
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
                }
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
                width
            };
        } else if (selectedTool === "circle") {
            const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
            shape = {
                type: "circle",
                radius: radius,
                centerX: this.startX + width/2,
                centerY: this.startY + height/2,
            };
        } else if (selectedTool === "pencil" && this.currentPencilPoints.length > 1) {
            // Finish pencil stroke
            shape = {
                type: "pencil",
                points: [...this.currentPencilPoints],
                color: "rgba(255, 255, 255)"
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
                
                // Create a preview of the eraser effect
                const tempShape: Shape = {
                    type: "eraser",
                    points: [...this.currentEraserPoints],
                    size: this.eraserSize
                };
                
                // Make a temporary copy of shapes to preview eraser effect
                const tempShapes = [...this.existingShapes, tempShape];
                
                // Redraw with the temporary eraser shape
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.fillStyle = "rgba(0, 0, 0)";
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                
                // Create a temporary canvas for the preview
                const previewCanvas = document.createElement('canvas');
                previewCanvas.width = this.canvas.width;
                previewCanvas.height = this.canvas.height;
                const previewCtx = previewCanvas.getContext('2d')!;
                
                // Fill with black background
                previewCtx.fillStyle = "rgba(0, 0, 0)";
                previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
                
                // First draw all non-eraser shapes
                tempShapes.forEach((shape) => {
                    if (shape.type !== "eraser") {
                        if (shape.type === "rect") {
                            previewCtx.strokeStyle = "rgba(255, 255, 255)";
                            previewCtx.lineWidth = 2;
                            previewCtx.strokeRect(shape.x, shape.y, shape.width, shape.height);
                        } else if (shape.type === "circle") {
                            previewCtx.beginPath();
                            previewCtx.strokeStyle = "rgba(255, 255, 255)";
                            previewCtx.lineWidth = 2;
                            previewCtx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, Math.PI * 2);
                            previewCtx.stroke();
                            previewCtx.closePath();                
                        } else if (shape.type === "pencil") {
                            previewCtx.strokeStyle = shape.color || "rgba(255, 255, 255)";
                            previewCtx.lineWidth = 2;
                            previewCtx.beginPath();
                            const points = shape.points;
                            if (points.length > 0) {
                                previewCtx.moveTo(points[0].x, points[0].y);
                                for (let i = 1; i < points.length; i++) {
                                    previewCtx.lineTo(points[i].x, points[i].y);
                                }
                            }
                            previewCtx.stroke();
                            previewCtx.closePath();
                        }
                    }
                });
                
                // Then apply eraser shapes
                tempShapes.forEach((shape) => {
                    if (shape.type === "eraser") {
                        previewCtx.globalCompositeOperation = 'destination-out';
                        
                        // Draw the eraser path with filled circles
                        for (let i = 0; i < shape.points.length; i++) {
                            const point = shape.points[i];
                            previewCtx.beginPath();
                            previewCtx.arc(point.x, point.y, shape.size, 0, Math.PI * 2);
                            previewCtx.fill();
                        }
                        
                        // Reset composite operation
                        previewCtx.globalCompositeOperation = 'source-over';
                    }
                });
                
                // Draw the preview onto the main canvas
                this.ctx.drawImage(previewCanvas, 0, 0);
                
                // Draw the eraser cursor
                this.drawEraser(e.clientX, e.clientY, this.eraserSize);
                return;
            }
            
            this.clearCanvas();
            this.ctx.strokeStyle = "rgba(255, 255, 255)";
            const selectedTool = this.selectedTool;
            
            if (selectedTool === "rect") {
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(this.startX, this.startY, width, height);   
            } else if (selectedTool === "circle") {
                const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
                const centerX = this.startX + width/2;
                const centerY = this.startY + height/2;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.closePath();                
            } else if (selectedTool === "pencil") {
                // Add point to current pencil stroke
                this.currentPencilPoints.push({ x: e.clientX, y: e.clientY });
                
                // Draw current pencil stroke
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                if (this.currentPencilPoints.length > 0) {
                    this.ctx.moveTo(this.currentPencilPoints[0].x, this.currentPencilPoints[0].y);
                    for (let i = 1; i < this.currentPencilPoints.length; i++) {
                        this.ctx.lineTo(this.currentPencilPoints[i].x, this.currentPencilPoints[i].y);
                    }
                }
                this.ctx.stroke();
                this.ctx.closePath();
            }
        }
    }

    initMouseHandlers() {
        this.canvas.addEventListener("mousedown", this.mouseDownHandler)

        this.canvas.addEventListener("mouseup", this.mouseUpHandler)

        this.canvas.addEventListener("mousemove", this.mouseMoveHandler)    

    }
}