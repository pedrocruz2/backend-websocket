import cv2
from qreader import QReader
import asyncio

class QRCodeReader:
    def __init__(self):
        self.cam = cv2.VideoCapture(0)
        print("Camera initialized")
        self.qr = QReader(model_size='l', min_confidence=0.3)
    
    async def read_qr_code(self):
        while True:
            ret, img = self.cam.read()
            if ret:
                rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                data = self.qr.detect_and_decode(rgb_img)
                if data and data[0] is not None:
                    print(f"QR Code detected: {data}")
                    return data[0]
            await asyncio.sleep(2)  # non-blocking sleep
