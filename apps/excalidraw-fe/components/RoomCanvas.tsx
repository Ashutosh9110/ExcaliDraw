"use client"

import { WS_URL } from "@/config"
import { useEffect, useState } from "react"
import { Canvas } from "./Canvas"

export function RoomCanvas ({roomId} : {roomId: string}) {


    const [ socket, setSocket ] = useState<WebSocket | null>(null)

    useEffect(() => {
        const ws = new WebSocket(`${WS_URL}?token${}`)

        ws.onopen = () => {
            setSocket(ws)
        ws.send(JSON.stringify({
            type: "join_room", 
            roomId
        })
            
        )
        }

    }, [])



    if (!socket) {
        return (
            <div>
                Connecting to the server . . .
            </div>
        )
    }


    return (
        <div>
            <Canvas roomId = {roomId} />
            {/* <div className="absolute bottom-0 right-0"> */}
                {/* <button className="bg-white text-black">Rectangle</button> */}
                {/* <button className="bg-white text-black">circle</button> */}
            </div>  

)}