import tkinter as tk
from app import SmartCalculatorApp

# Simulate user pressing ALPHA then CALC with variables in expression
root = tk.Tk()
root.withdraw()
app = SmartCalculatorApp(root)

# Put an expression with variables
app.display.delete(0, tk.END)
app.display.insert(0, '2*A + 3*B - X')
# Enable alpha to simulate ALPHA modifier
app.alpha = True
# Simulate pressing '=' (should start variable input mode)
app.on_button_click('=')
print('var_input_mode:', app.var_input_mode)
print('var_list:', app.var_list)
# Simulate entering A=5 and pressing '='
app.display.delete(0, tk.END)
app.display.insert(0, '5')
app.on_button_click('=')
print('vars after A:', app.vars)
# Simulate entering B=2 and pressing '='
app.display.delete(0, tk.END)
app.display.insert(0, '2')
app.on_button_click('=')
print('vars after B:', app.vars)
# Simulate entering X=1 and pressing '='
app.display.delete(0, tk.END)
app.display.insert(0, '1')
app.on_button_click('=')
print('final display:', app.display.get())
root.destroy()
