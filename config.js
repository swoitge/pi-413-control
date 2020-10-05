{
  "controllers": {
    "pitch": {
      "name": "pitch",
      "pid": {
        "P": 0.76,
        "I": 0,
        "D": 0,
        "DT": 1
      },
      "target": 7,
      "servos": [
        {
          "id": "servo1",
          "pin": 12,
          "multiply": 1,
          "neutral": -7,
          "min": 108,
          "max": 366
        }
      ]
    }
  },
  "interval": 250
}