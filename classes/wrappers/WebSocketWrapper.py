import asyncio
import websockets

class WebSocketWrapper:
    def __init__(self, host, port):
        self.host = host
        self.port = port
        self.server = websockets.serve(self.handler, self.host, self.port)

    async def handler(self, websocket, path):
        # This loop will run for as long as the WebSocket connection is open
        async for data in websocket:
            reply = f"Data received as: {data}!"
            await websocket.send(reply)
            print(reply)

    def run(self):
        loop = asyncio.get_event_loop()
        loop.run_until_complete(self.server)
        print(f"WebSocket server has started on ws://{self.host}:{self.port}")
        try:
            loop.run_forever()
        except KeyboardInterrupt:
            print("WebSocket server stopped by user")
            loop.close()
