import cv2
from qreader import QReader
import asyncio
import json
from datetime import datetime, timedelta

class QRCodeReader:
    def __init__(self):
        self.cam = cv2.VideoCapture(0)
        print("Camera initialized")
        self.qr = QReader(model_size='l', min_confidence=0.3)

    async def read_qr_code(self,target_medication: str):
        while True:
            ret, img = self.cam.read()
            if ret:
                rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                data = self.qr.detect_and_decode(rgb_img)
                if data and data[0] is not None:
                    print(f"QR Code detected: {data}")
                    break
            await asyncio.sleep(2)  # non-blocking sleep

    
        qr_data = json.loads(data[0])
        print(f"QR Code data: {qr_data}")
        if qr_data['Nome'] != target_medication:
            return 'Medicamento incorreto'
        

            

