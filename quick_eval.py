import tkinter as tk
from app import SmartCalculatorApp

root = tk.Tk()
root.withdraw()
app = SmartCalculatorApp(root)

# Predefine a variable for testing
app.vars['A'] = 7

tests = [
    "2+3*4",
    "sin(pi/4)+cos(pi/4)",
    "sqrt(16)+2^3",
    "5!",
    "ln(e)",
    "log(100)",
    "1/(x-1)",
    "2pi",
    "2*A",
]

for t in tests:
    val, err = app._safe_eval(t)
    if err:
        print(f"{t} -> (error: {err})")
    else:
        print(f"{t} -> {val}")

root.destroy()
