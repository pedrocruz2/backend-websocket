from classes.wrappers.QrCodeWrapper import QrCodeWrapper
from classes.wrappers.WebSocketWrapper import WebSocketWrapper
ws = WebSocketWrapper('localhost', 3000)
ws.run()
qr = QrCodeWrapper()
qr.run()

