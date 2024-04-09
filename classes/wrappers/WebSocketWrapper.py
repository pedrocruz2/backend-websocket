import asyncio
import websockets
import json
from classes.wrappers.QrCodeWrapper import QrCodeWrapper
from classes.wrappers.RobotWrapper import RobotWrapper
class WebSocketWrapper:
    def __init__(self, host, port):
        self.host = host
        self.port = port
        self.qr_code_service = QrCodeWrapper()

    async def handler(self, websocket, path):
        async for message in websocket:
            print(f"Message from WebSocket: {message}")
            try:
                data = json.loads(message)
                target = data.get('target')
                action = data.get('action')

                if target == 'QrCode':
                    print('Target: QRCODE ')
                    # Call the QR Code service action
                    await self.qr_code_service.handle_action(action, data)
                elif target == 'Robot':
                    # Call the Robot service action
                    await self.robot_service.handle_action(action, data)
                else:
                    print(f"Unknown target: {target}")

            except json.JSONDecodeError as e:
                print(f"Invalid JSON received: {e}")
                await websocket.send("Error: Invalid JSON format")

    async def start(self):
        async with websockets.serve(self.handler, self.host, self.port):
            print(f"WebSocket Server started at ws://{self.host}:{self.port}")
            await asyncio.Future()  # This will keep the server running indefinitely
