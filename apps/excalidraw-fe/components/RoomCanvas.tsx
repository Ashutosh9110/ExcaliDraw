"use client"

import { WS_URL } from "@/config"
import { useEffect, useState } from "react"
import { Canvas } from "./Canvas"

export function RoomCanvas ({roomId} : {roomId: string}) {


    const [ socket, setSocket ] = useState<WebSocket | null>(null)

    useEffect(() => {
        const ws = new WebSocket(`${WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkY2Y5N2JhZC02OTM3LTRhODUtYWNjZS1jZjU1MGY2YWQ4OWEiLCJpYXQiOjE3MzkyNTI3Nzl9.dp1Z0imIHfTjvpw-J-AItImZk1a1ONWAPszxZs_1KQU`)

        ws.onopen = () => {
            setSocket(ws)
        const data = JSON.stringify({
            type: "join_room", 
            roomId
        })
            console.log(data)
            ws.send(data)

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
            <Canvas roomId = {roomId} socket={socket} />

            </div>  

)}