import asyncio 
from services.RobotServices import Robot
class RobotWrapper():
    def __init__(self,ws, qr):
        self.ws = ws
        self.qr = qr
        
        