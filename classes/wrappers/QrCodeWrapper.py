import asyncio
import json
from classes.services.QrCodeServices import QRCodeReader

class QrCodeWrapper:
    def __new__(cls):
        if cls._self is None:
            cls._self = super().__new__(cls)
        return cls._self
    def __init__(self, ws):
        self.ws = ws
        self.qr_reader = QRCodeReader()
    
    async def bipar(self, target_medication):
        data = await self.qr_reader.read_qr_code(target_medication)
    