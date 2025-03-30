"use client"

import { WS_URL } from "@/config"
import { useEffect, useState } from "react"
import { Canvas } from "./Canvas"

export function RoomCanvas({roomId}: {roomId: string}) {
    const [socket, setSocket] = useState<WebSocket | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const ws = new WebSocket(`${WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkY2Y5N2JhZC02OTM3LTRhODUtYWNjZS1jZjU1MGY2YWQ4OWEiLCJpYXQiOjE3MzkyNTI3Nzl9.dp1Z0imIHfTjvpw-J-AItImZk1a1ONWAPszxZs_1KQU`)

        ws.onopen = () => {
            setSocket(ws)
            const data = JSON.stringify({
                type: "join_room", 
                roomId
            })
            ws.send(data)
        }

        ws.onerror = () => {
            setError("Connection failed. Please try again.")
        }

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close()
            }
        }
    }, [roomId])

    if (error) {
        return (
            <div className="w-screen h-screen flex items-center justify-center bg-background">
                <div className="max-w-md p-6 bg-card rounded-lg shadow-lg border border-border">
                    <h2 className="text-2xl font-bold text-destructive mb-4">Connection Error</h2>
                    <p className="text-foreground mb-6">{error}</p>
                    <button 
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                        onClick={() => window.location.reload()}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        )
    }

    if (!socket) {
        return (
            <div className="w-screen h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-foreground mb-4">Connecting to Room...</h1>
                    <p className="text-muted-foreground mb-6">Room ID: {roomId}</p>
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
            </div>
        )
    }

    return <Canvas roomId={roomId} socket={socket} />
}