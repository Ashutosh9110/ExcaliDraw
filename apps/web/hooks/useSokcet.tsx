import { useEffect, useState } from "react";
import { WS_URL } from "../app/config";




export function useSocket () {

    const [ loading, setLoading ] = useState(true)
    const [ socket, setSocket ] = useState<WebSocket>()

    useEffect(() => {
        const ws = new WebSocket(`${WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmOWM2NjI2My05ZGRjLTQzOGUtYjUwNi04ZDhmYTAxMzM0NTMiLCJpYXQiOjE3Mzg5MjU2MDZ9.v9Thi6ta8wo6ahWS5yQaQjOxVPvlHU2S48se09FkYXE`)
        ws.onopen = () => {
            setLoading(false)
            setSocket(ws)
        }
    }, [])

    return {
        socket,
        loading
    }

}