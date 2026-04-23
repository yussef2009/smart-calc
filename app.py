import tkinter as tk
from tkinter import messagebox

class SmartCalculatorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Smart Calculator")
        self.root.geometry("400x500")
        self.create_widgets()
    
    def create_widgets(self):
        # Display
        self.display = tk.Entry(self.root, font=("Arial", 20), justify='right')
        self.display.grid(row=0, column=0, columnspan=4, sticky="nsew", padx=10, pady=10)
        
        # Buttons
        buttons = [
            ('7', 1, 0), ('8', 1, 1), ('9', 1, 2), ('/', 1, 3),
            ('4', 2, 0), ('5', 2, 1), ('6', 2, 2), ('*', 2, 3),
            ('1', 3, 0), ('2', 3, 1), ('3', 3, 2), ('-', 3, 3),
            ('0', 4, 0), ('.', 4, 1), ('+', 4, 2), ('=', 4, 3),
            ('√', 5, 0), ('^', 5, 1), ('%', 5, 2), ('C', 5, 3),
        ]
        
        for (text, row, col) in buttons:
            self.create_button(text, row, col)
    
    def create_button(self, text, row, col):
        btn = tk.Button(self.root, text=text, font=("Arial", 18), 
                       command=lambda: self.on_button_click(text))
        btn.grid(row=row, column=col, sticky="nsew", padx=5, pady=5)
    
    def on_button_click(self, char):
        if char == 'C':
            self.display.delete(0, tk.END)
        elif char == '=':
            self.calculate()
        else:
            self.display.insert(tk.END, char)
    
    def calculate(self):
        try:
            result = eval(self.display.get())
            self.display.delete(0, tk.END)
            self.display.insert(0, str(result))
        except Exception as e:
            messagebox.showerror("Error", "Invalid expression")

if __name__ == "__main__":
    root = tk.Tk()
    app = SmartCalculatorApp(root)
    root.mainloop()