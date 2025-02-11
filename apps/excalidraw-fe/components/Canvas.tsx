import { initDraw } from "@/draw"
import { useEffect, useRef, useState } from "react"
import { IconButton } from "./IconButton"
import { Circle, Pencil, RectangleHorizontal } from "lucide-react"


type Shape = "circle" | "rect" | "pencil"

export function Canvas({ roomId, socket } : { roomId : string, socket: WebSocket }) {
    
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [ selectedTool, setSelectedTool ] = useState<Shape>("circle")

    useEffect(() => {
        //@ts-ignore
        window.selectedTool = selectedTool
    }, [selectedTool])



        useEffect(() => {

            if(canvasRef.current) {
                initDraw(canvasRef.current, roomId, socket)
            }
        }, [canvasRef])


return (

    <div style={{
        
        // height: "100vh",
        // overflow: "hidden"
        
    }}>

        <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} />        
    {/*  TODO:  use this hook to add a feature for updating components when the size or orientation of the window changes.(@react-hook/window-size)
    */}
        <TopBar selectedTool= {selectedTool} setSelectedTool = {setSelectedTool} />
    </div>
    )
}


function TopBar ({selectedTool, setSelectedTool}: {
    selectedTool: Shape,
    setSelectedTool: (s: Shape) => void
}) {
    return (
        <div style={{
            position: "fixed",
            top: 10,
            left: 10
        }}>
            <div className="flex gap-3">
                <IconButton activated={selectedTool === "pencil"} icon={<Pencil />} onClick={(() => setSelectedTool("pencil"))}></IconButton>
                <IconButton activated={selectedTool === "rect"} icon={<RectangleHorizontal />} 
                onClick={(() => setSelectedTool("rect"))}></IconButton>
                <IconButton activated={selectedTool === "circle"} icon={<Circle />} onClick={(() => setSelectedTool("circle"))}></IconButton>
            </div>
        </div>
    )
}

