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
}

export async function initDraw(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
    const ctx = canvas.getContext("2d");

    let existingShapes: Shape[] = await getExistingShapes(roomId)

    if (!ctx) {
        return
    }

    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type == "chat") {
            const parsedShape = JSON.parse(message.message)
            existingShapes.push(parsedShape.shape)
            clearCanvas(existingShapes, canvas, ctx);
        }
    }
    

    clearCanvas(existingShapes, canvas, ctx);
    let clicked = false;
    let startX = 0;
    let startY = 0;
    let currentPencilPoints: { x: number, y: number }[] = [];

    canvas.addEventListener("mousedown", (e) => {
        clicked = true
        startX = e.clientX
        startY = e.clientY
        
        // @ts-ignore
        const selectedTool = window.selectedTool;
        if (selectedTool === "pencil") {
            currentPencilPoints = [{ x: e.clientX, y: e.clientY }];
        }
    })

    canvas.addEventListener("mouseup", (e) => {
        clicked = false
        const width = e.clientX - startX;
        const height = e.clientY - startY;

        // @ts-ignore
        const selectedTool = window.selectedTool;
        let shape: Shape | null = null;
        if (selectedTool === "rect") {
            shape = {
                type: "rect",
                x: startX,
                y: startY,
                height,
                width
            }
        } else if (selectedTool === "circle") {
            const radius = Math.max(width, height) / 2;
            shape = {
                type: "circle",
                radius: radius,
                centerX: startX + radius,
                centerY: startY + radius,
            }
        } else if (selectedTool === "pencil" && currentPencilPoints.length > 1) {
            // Finish pencil stroke
            shape = {
                type: "pencil",
                points: [...currentPencilPoints],
                color: "rgba(255, 255, 255)"
            }
            currentPencilPoints = [];
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
        }))

    })

    canvas.addEventListener("mousemove", (e) => {
        if (clicked) {
            const width = e.clientX - startX;
            const height = e.clientY - startY;
            clearCanvas(existingShapes, canvas, ctx);
            ctx.strokeStyle = "rgba(255, 255, 255)"
            // @ts-ignore
            const selectedTool = window.selectedTool;
            if (selectedTool === "rect") {
                ctx.strokeRect(startX, startY, width, height);   
            } else if (selectedTool === "circle") {
                const radius = Math.max(width, height) / 2;
                const centerX = startX + radius;
                const centerY = startY + radius;
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
    })            
}

function clearCanvas(existingShapes: Shape[], canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0, 0, 0)"
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    existingShapes.map((shape) => {
        if (shape.type === "rect") {
            ctx.strokeStyle = "rgba(255, 255, 255)"
            ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        } else if (shape.type === "circle") {
            ctx.beginPath();
            ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.closePath();                
        } else if (shape.type === "pencil") {
            ctx.strokeStyle = shape.color || "rgba(255, 255, 255)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            const points = shape.points;
            if (points && points.length > 0) {
                ctx.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length; i++) {
                    ctx.lineTo(points[i].x, points[i].y);
                }
            }
            ctx.stroke();
            ctx.closePath();
        }
    })
}

async function getExistingShapes(roomId: string) {
    const res = await axios.get(`${HTTP_BACKEND}/chats/${roomId}`);
    const messages = res.data.messages;

    const shapes = messages.map((x: {message: string}) => {
        const messageData = JSON.parse(x.message)
        return messageData.shape;
    })

    return shapes;
}