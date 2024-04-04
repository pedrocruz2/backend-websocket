import asyncio

from services.qr_code_reader import QRCodeReader

class QrCodeWrapper:
    def __init__(self, ws):
        self.ws = ws
        self.qr_reader = QRCodeReader()
    
    async def start_qr_reader(self):
        while True:
            qr_data = await self.qr_reader.read_qr_code()
            if qr_data:
                await self.send_qr_data(qr_data)

    async def send_qr_data(self, data):
        await self.ws.send(data)
