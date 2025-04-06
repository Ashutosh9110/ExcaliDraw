import { HTTP_BACKEND } from "@/config";
import axios from "axios";

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

export async function initDraw(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
    const ctx = canvas.getContext("2d");

    let existingShapes: Shape[] = await getExistingShapes(roomId);

    if (!ctx) {
        return;
    }

    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type == "chat") {
            const parsedShape = JSON.parse(message.message);
            existingShapes.push(parsedShape.shape);
            clearCanvas(existingShapes, canvas, ctx);
        } else if (message.type === "eraser") {
            const eraserData = JSON.parse(message.message);
            existingShapes.push(eraserData.shape);
            clearCanvas(existingShapes, canvas, ctx);
        }
    };

    clearCanvas(existingShapes, canvas, ctx);
    let clicked = false;
    let startX = 0;
    let startY = 0;
    let currentPencilPoints: { x: number, y: number }[] = [];
    let currentEraserPoints: { x: number, y: number }[] = [];
    const eraserSize = 20; // Size of the eraser in pixels

    canvas.addEventListener("mousedown", (e) => {
        clicked = true;
        startX = e.clientX;
        startY = e.clientY;
        
        // @ts-expect-error - window.selectedTool is defined in Canvas.tsx but TypeScript doesn't know about it
        const selectedTool = window.selectedTool;
        if (selectedTool === "pencil") {
            currentPencilPoints = [{ x: e.clientX, y: e.clientY }];
        } else if (selectedTool === "eraser") {
            currentEraserPoints = [{ x: e.clientX, y: e.clientY }];
        }
    });

    canvas.addEventListener("mouseup", (e) => {
        clicked = false;
        const width = e.clientX - startX;
        const height = e.clientY - startY;

        // @ts-expect-error - window.selectedTool is defined in Canvas.tsx but TypeScript doesn't know about it
        const selectedTool = window.selectedTool;
        let shape: Shape | null = null;
        
        if (selectedTool === "rect") {
            shape = {
                type: "rect",
                x: startX,
                y: startY,
                height,
                width
            };
        } else if (selectedTool === "circle") {
            const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
            shape = {
                type: "circle",
                radius: radius,
                centerX: startX + width/2,
                centerY: startY + height/2,
            };
        } else if (selectedTool === "pencil" && currentPencilPoints.length > 1) {
            // Finish pencil stroke
            shape = {
                type: "pencil",
                points: [...currentPencilPoints],
                color: "rgba(255, 255, 255)"
            };
            currentPencilPoints = [];
        } else if (selectedTool === "eraser" && currentEraserPoints.length > 1) {
            // Finish eraser stroke
            shape = {
                type: "eraser",
                points: [...currentEraserPoints],
                size: eraserSize
            };
            
            socket.send(JSON.stringify({
                type: "eraser",
                message: JSON.stringify({
                    shape
                }),
                roomId
            }));
            
            existingShapes.push(shape);
            clearCanvas(existingShapes, canvas, ctx);
            currentEraserPoints = [];
            return;
        }

        if (!shape) {
            return;
        }

        existingShapes.push(shape);

        socket.send(JSON.stringify({
            type: "chat",
            message: JSON.stringify({
                shape
            }),
            roomId
        }));
    });

    canvas.addEventListener("mousemove", (e) => {
        if (clicked) {
            const width = e.clientX - startX;
            const height = e.clientY - startY;
            
            // @ts-expect-error - window.selectedTool is defined in Canvas.tsx but TypeScript doesn't know about it
            const selectedTool = window.selectedTool;
            
            if (selectedTool === "eraser") {
                // Add point to current eraser stroke
                currentEraserPoints.push({ x: e.clientX, y: e.clientY });
                
                // Create a preview of the eraser effect
                const tempShape: Shape = {
                    type: "eraser",
                    points: [...currentEraserPoints],
                    size: eraserSize
                };
                
                // Make a temporary copy of shapes to preview eraser effect
                const tempShapes = [...existingShapes, tempShape];
                
                // Create a temporary canvas for the preview
                const previewCanvas = document.createElement('canvas');
                previewCanvas.width = canvas.width;
                previewCanvas.height = canvas.height;
                const previewCtx = previewCanvas.getContext('2d')!;
                
                // Fill with black background
                previewCtx.fillStyle = "rgba(0, 0, 0)";
                previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
                
                // Draw all shapes and apply the eraser effect
                // First, draw all non-eraser shapes
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
                            previewCtx.arc(shape.centerX, shape.centerY, shape.radius, 0, Math.PI * 2);
                            previewCtx.stroke();
                            previewCtx.closePath();                
                        } else if (shape.type === "pencil") {
                            previewCtx.strokeStyle = shape.color || "rgba(255, 255, 255)";
                            previewCtx.lineWidth = 2;
                            previewCtx.beginPath();
                            const points = shape.points;
                            if (points && points.length > 0) {
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
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "rgba(0, 0, 0)";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(previewCanvas, 0, 0);
                
                // Draw the eraser cursor
                drawEraser(ctx, currentEraserPoints, eraserSize);
                return;
            }
            
            clearCanvas(existingShapes, canvas, ctx);
            ctx.strokeStyle = "rgba(255, 255, 255)";
            
            if (selectedTool === "rect") {
                ctx.lineWidth = 2;
                ctx.strokeRect(startX, startY, width, height);   
            } else if (selectedTool === "circle") {
                const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
                const centerX = startX + width/2;
                const centerY = startY + height/2;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.closePath();                
            } else if (selectedTool === "pencil") {
                // Add point to current pencil stroke
                currentPencilPoints.push({ x: e.clientX, y: e.clientY });
                
                // Draw current pencil stroke
                ctx.lineWidth = 2;
                ctx.beginPath();
                if (currentPencilPoints.length > 0) {
                    ctx.moveTo(currentPencilPoints[0].x, currentPencilPoints[0].y);
                    for (let i = 1; i < currentPencilPoints.length; i++) {
                        ctx.lineTo(currentPencilPoints[i].x, currentPencilPoints[i].y);
                    }
                }
                ctx.stroke();
                ctx.closePath();
            }
        }
    });
}

function drawEraser(ctx: CanvasRenderingContext2D, points: { x: number, y: number }[], size: number) {
    // Draw the eraser cursor
    if (points.length > 0) {
        const lastPoint = points[points.length - 1];
        ctx.beginPath();
        ctx.arc(lastPoint.x, lastPoint.y, size, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
        ctx.stroke();
        ctx.closePath();
    }
}

function clearCanvas(existingShapes: Shape[], canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0, 0, 0)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Create a temporary canvas for drawing with eraser applied
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d')!;
    
    // Fill with black background
    tempCtx.fillStyle = "rgba(0, 0, 0)";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // First, draw all non-eraser shapes
    existingShapes.forEach((shape) => {
        if (shape.type !== "eraser") {
            if (shape.type === "rect") {
                tempCtx.strokeStyle = "rgba(255, 255, 255)";
                tempCtx.lineWidth = 2;
                tempCtx.strokeRect(shape.x, shape.y, shape.width, shape.height);
            } else if (shape.type === "circle") {
                tempCtx.beginPath();
                tempCtx.strokeStyle = "rgba(255, 255, 255)";
                tempCtx.lineWidth = 2;
                tempCtx.arc(shape.centerX, shape.centerY, shape.radius, 0, Math.PI * 2);
                tempCtx.stroke();
                tempCtx.closePath();                
            } else if (shape.type === "pencil") {
                tempCtx.strokeStyle = shape.color || "rgba(255, 255, 255)";
                tempCtx.lineWidth = 2;
                tempCtx.beginPath();
                const points = shape.points;
                if (points && points.length > 0) {
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
    existingShapes.forEach((shape) => {
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
    ctx.drawImage(tempCanvas, 0, 0);
}

async function getExistingShapes(roomId: string) {
    const res = await axios.get(`${HTTP_BACKEND}/chats/${roomId}`);
    const messages = res.data.messages;

    const shapes = messages.map((x: {message: string}) => {
        const messageData = JSON.parse(x.message);
        return messageData.shape;
    });
    
    return shapes;
}