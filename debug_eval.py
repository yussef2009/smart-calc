import tkinter as tk
from app import SmartCalculatorApp
import traceback

root = tk.Tk()
root.withdraw()
app = SmartCalculatorApp(root)
expr = "sin(pi/4)+cos(pi/4)"
s2 = app.preprocess_expression(expr)
print('preprocessed:', repr(s2))
env = dict(app.safe_funcs)
env.update(app.vars)
env['ans'] = app.ans
print('env keys sample:', list(env.keys())[:40])
try:
    result = eval(s2, {'__builtins__': None}, env)
    print('result:', result)
except Exception as e:
    print('exception:', e)
    traceback.print_exc()
root.destroy()
