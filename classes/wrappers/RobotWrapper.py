import asyncio 
from services.RobotServices import Robot
class RobotWrapper():
    def __new__(cls):
        if cls._self is None:
            cls._self = super().__new__(cls)
        return cls._self
    def __init__(self,ws, qr):
        self.ws = ws
        self.qr = qr
        
        