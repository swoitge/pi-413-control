{
  "controllers": {
    "pitch": {
      "name": "pitch",
      "pid": {
        "P": 0,
        "I": 0.65,
        "D": 0,
        "DT": 1
      },
      "target": 37,
      "servos": [
        {
          "id": "servo1",
          "pin": 12,
          "multiply": -0.4,
          "neutral": -168
        }
      ]
    }
  },
  "interval": 473
}