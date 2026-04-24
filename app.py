import tkinter as tk
from tkinter import messagebox
import math
import re
import statistics


class SmartCalculatorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Smart Calculator")
        # Slightly larger window to fit scientific buttons
        self.root.geometry("480x640")

        # Styling constants (preserve original fonts)
        self.DISPLAY_FONT = ("Arial", 20)
        self.BTN_FONT = ("Arial", 18)
        self.BTN_PADX = 5
        self.BTN_PADY = 5

        # Calculator state
        self.mode = 'Standard'  # Standard | Scientific | Statistical
        self.shift = False
        self.alpha = False
        self.waiting_store = False
        self.waiting_recall = False
        self.vars = {}  # variable storage when using Alpha/STO
        # alias to satisfy API expecting `self.variables`
        self.variables = self.vars
        self.ans = 0
        self.history = []
        # Variable input mode state
        self.var_input_mode = False
        self.pending_expr = ''
        self.var_list = []
        self.var_index = 0

        # Safe functions available to evaluations
        self.safe_funcs = {
            'sin': math.sin, 'cos': math.cos, 'tan': math.tan,
            'asin': math.asin, 'acos': math.acos, 'atan': math.atan,
            'sinh': math.sinh, 'cosh': math.cosh, 'tanh': math.tanh,
            'sqrt': math.sqrt, 'ln': math.log, 'log': math.log10,
            'exp': math.exp, 'abs': abs, 'pow': pow,
            'pi': math.pi, 'e': math.e, 'factorial': math.factorial,
            'mean': statistics.mean, 'median': statistics.median, 'std': statistics.pstdev
        }

        # Keep created button widgets so we can update them
        self.button_widgets = {}

        self.create_widgets()

    def create_widgets(self):
        # Display
        self.display = tk.Entry(self.root, font=self.DISPLAY_FONT, justify='right')
        self.display.grid(row=0, column=0, columnspan=4, sticky="nsew", padx=10, pady=10)

        # Prompt/status label for variable input mode
        self.prompt_label = tk.Label(self.root, text='', font=("Arial", 14), anchor='w')
        self.prompt_label.grid(row=11, column=0, columnspan=4, sticky="nsew", padx=6, pady=(0,6))

        # Top controls: Mode, Shift, Alpha, Reset
        top_controls = [
            ('Mode', self.toggle_mode),
            ('Shift', self.toggle_shift),
            ('Alpha', self.toggle_alpha),
            ('Reset', self.reset_all),
        ]
        for i, (label, cmd) in enumerate(top_controls):
            btn = tk.Button(self.root, text=label, font=self.BTN_FONT, command=cmd)
            btn.grid(row=1, column=i, sticky="nsew", padx=self.BTN_PADX, pady=self.BTN_PADY)
            self.button_widgets[label] = btn

        # Scientific row (visible in Scientific mode)
        sci_row_1 = [
            ('π', lambda: self.insert_text('pi')),
            ('e', lambda: self.insert_text('e')),
            ('(', lambda: self.insert_text('(')),
            (')', lambda: self.insert_text(')')),
        ]
        for i, (label, cmd) in enumerate(sci_row_1):
            btn = tk.Button(self.root, text=label, font=self.BTN_FONT, command=cmd)
            btn.grid(row=2, column=i, sticky="nsew", padx=self.BTN_PADX, pady=self.BTN_PADY)
            self.button_widgets[label] = btn

        sci_row_2 = [
            ('sin', lambda: self.handle_trig('sin')),
            ('cos', lambda: self.handle_trig('cos')),
            ('tan', lambda: self.handle_trig('tan')),
            ('!', lambda: self.insert_text('!')),
        ]
        for i, (label, cmd) in enumerate(sci_row_2):
            btn = tk.Button(self.root, text=label, font=self.BTN_FONT, command=cmd)
            btn.grid(row=3, column=i, sticky="nsew", padx=self.BTN_PADX, pady=self.BTN_PADY)
            self.button_widgets[label] = btn

        sci_row_3 = [
            ('ln', lambda: self.insert_text('ln(')),
            ('log', lambda: self.insert_text('log(')),
            ('ANS', self.insert_ans),
            ('STO', self.toggle_store),
        ]
        for i, (label, cmd) in enumerate(sci_row_3):
            btn = tk.Button(self.root, text=label, font=self.BTN_FONT, command=cmd)
            btn.grid(row=4, column=i, sticky="nsew", padx=self.BTN_PADX, pady=self.BTN_PADY)
            self.button_widgets[label] = btn

        # Numeric keypad and basic operations (preserve original layout)
        keypad = [
            ('7', 5, 0), ('8', 5, 1), ('9', 5, 2), ('/', 5, 3),
            ('4', 6, 0), ('5', 6, 1), ('6', 6, 2), ('*', 6, 3),
            ('1', 7, 0), ('2', 7, 1), ('3', 7, 2), ('-', 7, 3),
            ('0', 8, 0), ('.', 8, 1), ('+', 8, 2), ('=', 8, 3),
        ]
        for (text, row, col) in keypad:
            btn = tk.Button(self.root, text=text, font=self.BTN_FONT,
                            command=lambda t=text: self.on_button_click(t))
            btn.grid(row=row, column=col, sticky="nsew", padx=self.BTN_PADX, pady=self.BTN_PADY)
            self.button_widgets[text] = btn

        # Extra row: power, sqrt, percent, clear
        extra = [
            ('^', lambda: self.insert_text('^')),
            ('√', lambda: self.insert_text('sqrt(')),
            ('%', lambda: self.insert_text('%')),
            ('C', self.clear_entry),
        ]
        for i, (label, cmd) in enumerate(extra):
            btn = tk.Button(self.root, text=label, font=self.BTN_FONT, command=cmd)
            btn.grid(row=9, column=i, sticky="nsew", padx=self.BTN_PADX, pady=self.BTN_PADY)
            self.button_widgets[label] = btn

        # Variable buttons for Alpha mode and recall
        vars_row = [
            ('A', lambda: self.handle_variable_key('A')),
            ('B', lambda: self.handle_variable_key('B')),
            ('X', lambda: self.handle_variable_key('X')),
            ('RCL', self.toggle_recall),
        ]
        for i, (label, cmd) in enumerate(vars_row):
            btn = tk.Button(self.root, text=label, font=self.BTN_FONT, command=cmd)
            btn.grid(row=10, column=i, sticky="nsew", padx=self.BTN_PADX, pady=self.BTN_PADY)
            self.button_widgets[label] = btn

        # Configure grid to expand
        for r in range(0, 12):
            self.root.grid_rowconfigure(r, weight=1)
        for c in range(0, 4):
            self.root.grid_columnconfigure(c, weight=1)

        self.update_mode_indicator()

    # --- UI helper methods ---
    def insert_text(self, txt: str):
        self.display.insert(tk.END, txt)

    def clear_entry(self):
        self.display.delete(0, tk.END)

    def on_button_click(self, char: str):
        if char == '=':
            # If we're in variable-entry flow, handle storing the typed value
            if self.var_input_mode:
                self._handle_var_entry()
                return

            # If Alpha modifier is active, start variable input mode when '=' pressed
            if self.alpha:
                started = self._start_variable_input_mode()
                if started:
                    return
                # if not started (no variables found) fall through to calculate
            self.calculate()
            return
        if char == 'C':
            self.clear_entry()
            return
        self.insert_text(char)

    # --- Variable input mode helpers ---
    def _start_variable_input_mode(self) -> bool:
        expr = self.display.get()
        # Find single-letter uppercase variables (A-Z) not adjacent to other letters/digits
        vars_found = []
        for m in re.finditer(r"(?<![A-Za-z0-9_])([A-Z])(?![A-Za-z0-9_])", expr):
            v = m.group(1)
            if v not in vars_found:
                vars_found.append(v)

        if not vars_found:
            # nothing to collect — don't intercept '='
            messagebox.showinfo('No variables', 'No variables found to input.')
            return False

        # Initialize variable input state
        self.var_input_mode = True
        self.pending_expr = expr
        self.var_list = vars_found
        self.var_index = 0
        # Clear display for user to type first value
        self.clear_entry()
        self.prompt_label.config(text=f"Enter value for {self.var_list[self.var_index]} and press =")
        # keep Alpha active so typing letters still works; focus input
        self.display.focus_set()
        return True

    def _handle_var_entry(self):
        # Read user input for current variable
        cur_var = self.var_list[self.var_index]
        text = self.display.get().strip()
        if text == '':
            messagebox.showerror('Input error', f'Please enter a value for {cur_var}')
            return

        # Evaluate the entered text to allow expressions like 1/2
        val, err = self._safe_eval(text)
        if err:
            messagebox.showerror('Input error', f'Invalid value for {cur_var}: {err}')
            return

        # Store value
        self.vars[cur_var] = val
        # move to next variable or evaluate final expression
        self.var_index += 1
        if self.var_index < len(self.var_list):
            next_var = self.var_list[self.var_index]
            self.clear_entry()
            self.prompt_label.config(text=f"Enter value for {next_var} and press =")
            self.display.focus_set()
            return

        # All variables assigned — evaluate pending expression with variables available
        self.var_input_mode = False
        self.prompt_label.config(text='')
        # Evaluate using stored self.vars
        val, err = self._safe_eval(self.pending_expr)
        if err:
            messagebox.showerror('Evaluation error', err)
            # Reset pending state but keep stored variables
            self.pending_expr = ''
            return

        # Show result
        try:
            out = int(val) if isinstance(val, (int,)) or (isinstance(val, float) and val.is_integer()) else val
        except Exception:
            out = val
        self.display.delete(0, tk.END)
        self.display.insert(0, str(out))
        self.ans = val
        self.history.append((self.pending_expr, val))
        self.pending_expr = ''
        # Optionally clear Alpha modifier
        self.alpha = False
        btn = self.button_widgets.get('Alpha')
        if btn:
            btn.config(bg=None)

    # --- Mode and toggles ---
    def toggle_mode(self):
        modes = ['Standard', 'Scientific', 'Statistical']
        idx = modes.index(self.mode)
        self.mode = modes[(idx + 1) % len(modes)]
        self.update_mode_indicator()

    def toggle_shift(self):
        self.shift = not self.shift
        # Visual indicator
        btn = self.button_widgets.get('Shift')
        if btn:
            btn.config(bg='#ffd966' if self.shift else None)

    def toggle_alpha(self):
        self.alpha = not self.alpha
        btn = self.button_widgets.get('Alpha')
        if btn:
            btn.config(bg='#ffd966' if self.alpha else None)

    def toggle_store(self):
        self.waiting_store = not self.waiting_store
        btn = self.button_widgets.get('STO')
        if btn:
            btn.config(bg='#a6f3a6' if self.waiting_store else None)

    def toggle_recall(self):
        self.waiting_recall = not self.waiting_recall
        btn = self.button_widgets.get('RCL')
        if btn:
            btn.config(bg='#a6f3a6' if self.waiting_recall else None)

    def reset_all(self):
        # Clear memory, history, modes, and display
        self.vars.clear()
        self.history.clear()
        self.ans = 0
        self.mode = 'Standard'
        self.shift = False
        self.alpha = False
        self.waiting_store = False
        self.waiting_recall = False
        # Reset button colors
        for key in ('Shift', 'Alpha', 'STO', 'RCL'):
            btn = self.button_widgets.get(key)
            if btn:
                btn.config(bg=None)
        self.update_mode_indicator()
        self.clear_entry()
        messagebox.showinfo('Reset', 'Calculator reset to defaults')

    def update_mode_indicator(self):
        btn = self.button_widgets.get('Mode')
        if btn:
            btn.config(text=f"Mode: {self.mode}")

    # --- Variable handling ---
    def handle_variable_key(self, var: str):
        if self.waiting_store:
            # Store current evaluated value into variable
            val, err = self._safe_eval(self.display.get())
            if err:
                messagebox.showerror('Store error', err)
            else:
                self.vars[var] = val
                messagebox.showinfo('Stored', f'{var} = {val}')
            self.waiting_store = False
            btn = self.button_widgets.get('STO')
            if btn:
                btn.config(bg=None)
            return

        if self.waiting_recall:
            # Insert variable name (will be resolved during evaluation)
            self.insert_text(var)
            self.waiting_recall = False
            btn = self.button_widgets.get('RCL')
            if btn:
                btn.config(bg=None)
            return

        # If Alpha mode is active, allow typing variable letter
        if self.alpha:
            self.insert_text(var)
        else:
            # Default: insert the letter anyway (user may want variable)
            self.insert_text(var)

    def insert_ans(self):
        self.insert_text('ans')

    # --- Trig handling (respect Shift -> inverse) ---
    def handle_trig(self, which: str):
        if self.shift:
            inv = {'sin': 'asin', 'cos': 'acos', 'tan': 'atan'}.get(which, which)
            self.insert_text(f"{inv}(")
            # clear shift after use (like many calculators)
            self.shift = False
            btn = self.button_widgets.get('Shift')
            if btn:
                btn.config(bg=None)
        else:
            self.insert_text(f"{which}(")

    # --- Preprocessing expressions before evaluation ---
    def preprocess_expression(self, expr: str) -> str:
        s = expr
        # Replace unicode pi symbol if present
        s = s.replace('π', 'pi')
        # Replace caret with python power
        s = s.replace('^', '**')
        # Percent operator: convert x% to (x/100)
        s = re.sub(r"(\d+(?:\.\d+)?)%", r"(\1/100)", s)

        # Transform postfix factorial 'n!' into factorial(n)
        # Repeat until no more '!' to handle nested cases like (2+3)!
        while '!' in s:
            new = re.sub(r"(\d+(?:\.\d+)?|\([^()]*\))!", r"factorial(\1)", s)
            if new == s:
                # cannot transform further; break to avoid infinite loop
                break
            s = new

        # Protect known function names that are followed immediately by '('
        # so we don't insert a '*' between the function name and its argument list.
        func_names = [fn for fn in self.safe_funcs.keys() if fn.isalpha()]
        for fn in func_names:
            # Mark function occurrences with a temporary marker so implicit
            # multiplication rules don't break function calls (we'll restore later).
            s = re.sub(r'\b' + re.escape(fn) + r"\s*\(", '__FUNC_' + fn + '#(', s)

        # Allow implicit multiplication like 2pi or 2A or )(
        # Insert '*' between number and variable/function/paren where appropriate
        s = re.sub(r"(?<=[0-9\.])(?=[A-Za-z(])", r"*", s)
        s = re.sub(r"(?<=[A-Za-z0-9\)])(?=\()", r"*", s)

        # Restore protected function names
        for fn in func_names:
            s = s.replace('__FUNC_' + fn + '#(', fn + '(')

        return s

    # --- Evaluation ---
    def _safe_eval(self, expr: str):
        # Returns (value, error_message) where error_message is empty string on success
        s = expr.strip()
        if not s:
            return None, 'Empty expression'
        # Replace display-specific tokens and preprocess
        try:
            s2 = self.preprocess_expression(s)
        except Exception as e:
            return None, f'Preprocessing error: {e}'

        # Build evaluation environment
        env = dict(self.safe_funcs)
        # Merge variables (A, B, X, etc.)
        for k, v in self.vars.items():
            env[k] = v
        # Current answer available as 'ans'
        env['ans'] = self.ans

        try:
            # Use empty globals dict to avoid NameError/TypeError issues
            result = eval(s2, {}, env)
            return result, ''
        except ZeroDivisionError:
            return None, 'Division by zero'
        except ValueError as e:
            return None, f'Math domain error: {e}'
        except NameError as e:
            return None, f'Unknown symbol or variable: {e}'
        except Exception as e:
            return None, f'Evaluation error: {e}'

    def calculate(self):
        expr = self.display.get()
        val, err = self._safe_eval(expr)
        if err:
            messagebox.showerror('Error', err)
            return
        # Update display, history and ans
        try:
            # Format floats neatly
            out = int(val) if isinstance(val, (int,)) or (isinstance(val, float) and val.is_integer()) else val
        except Exception:
            out = val
        self.display.delete(0, tk.END)
        self.display.insert(0, str(out))
        self.ans = val
        self.history.append((expr, val))


if __name__ == "__main__":
    root = tk.Tk()
    app = SmartCalculatorApp(root)
    root.mainloop()