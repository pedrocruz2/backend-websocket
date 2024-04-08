from pydobot import Dobot

class Robot:
    def __new__(cls):
        if cls._self is None:
            cls._self = super().__new__(cls)
        return cls._self
    def __init__(self):
        pass
    