#import dos wrappers
from classes.wrappers.WebSocketWrapper import WebSocketWrapper
from classes.wrappers.RobotWrapper import RobotWrapper
from classes.wrappers.QrCodeWrapper import QrCodeWrapper

#listeners do websocket

from classes.handlers.QrCodeWebSocketHandler import QrCodeWebSocketHandler as QRH
from classes.handlers.RobotWebSocketHandler import RobotWebSocketHandler as RH

qrHandler= QRH()  # Instantiate the QR code WebSocket listener
robotHandler = RH() 
ws = WebSocketWrapper('localhost', 3000)
qr = QrCodeWrapper(qrHandler)
robot = RobotWrapper(robotHandler, qr)
qr.read_qr_code()

ws.run()    

