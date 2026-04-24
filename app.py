import tkinter as tk
from tkinter import messagebox, simpledialog
import math
import cmath
import re
import statistics
import fractions
import decimal
from decimal import Decimal
import numpy as np
import matplotlib.pyplot as plt

decimal.getcontext().prec = 15

# 47 Scientific Constants (Casio fx-991EX CODATA values)
CASIO_CONSTANTS = {
    '1: mp': ('1.672621923e-27', 'Proton mass'),
    '2: mn': ('1.674927498e-27', 'Neutron mass'),
    '3: me': ('9.109383701e-31', 'Electron mass'),
    '4: mμ': ('1.883531627e-28', 'Muon mass'),
    '5: a0': ('0.5291772109e-10', 'Bohr radius'),
    '6: h': ('6.62607015e-34', 'Planck constant'),
    '7: μN': ('5.050783746e-27', 'Nuclear magneton'),
    '8: μB': ('9.274010078e-24', 'Bohr magneton'),
    '9: ℏ': ('1.054571817e-34', 'Reduced Planck constant'),
    '10: α': ('7.297352569e-3', 'Fine-structure constant'),
    '11: re': ('2.817940322e-15', 'Classical electron radius'),
    '12: λc': ('2.426310238e-12', 'Compton wavelength'),
    '13: γp': ('2.675221874e8', 'Proton gyromagnetic ratio'),
    '14: λcp': ('1.321409853e-15', 'Proton Compton wavelength'),
    '15: λcn': ('1.319590904e-15', 'Neutron Compton wavelength'),
    '16: R∞': ('10973731.568', 'Rydberg constant'),
    '17: u': ('1.660539066e-27', 'Atomic mass unit'),
    '18: μp': ('1.410606797e-26', 'Proton magnetic moment'),
    '19: μe': ('-9.284764704e-24', 'Electron magnetic moment'),
    '20: μn': ('-0.96623651e-26', 'Neutron magnetic moment'),
    '21: μμ': ('-4.4904483e-26', 'Muon magnetic moment'),
    '22: F': ('96485.33212', 'Faraday constant'),
    '23: e': ('1.602176634e-19', 'Elementary charge'),
    '24: NA': ('6.02214076e23', 'Avogadro constant'),
    '25: k': ('1.380649e-23', 'Boltzmann constant'),
    '26: Vm': ('0.022413962', 'Molar volume of ideal gas'),
    '27: R': ('8.314462618', 'Molar gas constant'),
    '28: C0': ('299792458', 'Speed of light'),
    '29: C1': ('3.741771852e-16', 'First radiation constant'),
    '30: C2': ('0.01438776877', 'Second radiation constant'),
    '31: σ': ('5.670374419e-8', 'Stefan-Boltzmann constant'),
    '32: ε0': ('8.854187812e-12', 'Electric constant'),
    '33: μ0': ('1.256637062e-6', 'Magnetic constant'),
    '34: Φ0': ('2.067833848e-15', 'Magnetic flux quantum'),
    '35: g': ('9.80665', 'Standard acceleration of gravity'),
    '36: G': ('6.67430e-11', 'Newtonian constant of gravitation'),
    '37: Z0': ('376.7303136', 'Characteristic impedance of vacuum'),
    '38: t': ('273.15', 'Celsius temperature 0K'),
    '39: G0': ('7.748091729e-5', 'Conductance quantum'),
    '40: KJ': ('483597.8484e9', 'Josephson constant'),
    '41: RK': ('25812.80745', 'von Klitzing constant'),
    '42: Rme': ('1836.152673', 'Proton mass / electron mass'),
    '43: GF': ('1.1663787e-5', 'Fermi coupling constant'),
    '44: ZW': ('0.22290', 'Weak mixing angle'),
    '45: W': ('80.379', 'W boson mass'),
    '46: Z': ('91.1876', 'Z boson mass'),
    '47: a': ('2.17647e-8', 'Planck mass'),
}

def dec_wrap(func):
    def wrapper(*args):
        try:
            return Decimal(str(func(*[float(a) for a in args])))
        except Exception:
            return func(*args)
    return wrapper

class SmartCalculatorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Casio fx-991EX ClassWiz Emulator")
        self.root.geometry("1000x750")

        self.DISPLAY_FONT = ("Consolas", 28, "bold")

        self.mode = 'Standard'  # Standard, Complex, Matrix, Graph
        self.shift = False
        self.alpha = False
        self.sd_mode = False
        self.eng_mode = False
        self.waiting_store = False
        
        # 9-Variable Registry + Matrix placeholders
        self.variables = {v: Decimal('0') for v in ['A', 'B', 'C', 'D', 'E', 'F', 'M', 'X', 'Y']}
        self.vars = self.variables  # Alias for existing code
        self.matrices = {'MatA': [], 'MatB': [], 'MatC': []}
        
        self.ans = Decimal('0')
        self.history = []
        
        self.window_settings = {'Xmin': -10, 'Xmax': 10, 'Ymin': -10, 'Ymax': 10}

        self.safe_funcs = {
            'sin': dec_wrap(math.sin), 'cos': dec_wrap(math.cos), 'tan': dec_wrap(math.tan),
            'asin': dec_wrap(math.asin), 'acos': dec_wrap(math.acos), 'atan': dec_wrap(math.atan),
            'sinh': dec_wrap(math.sinh), 'cosh': dec_wrap(math.cosh), 'tanh': dec_wrap(math.tanh),
            'sqrt': dec_wrap(math.sqrt), 'ln': dec_wrap(math.log), 'log': dec_wrap(math.log10),
            'exp': dec_wrap(math.exp), 'abs': dec_wrap(abs), 'pow': dec_wrap(math.pow),
            'pi': Decimal(str(math.pi)), 'e': Decimal(str(math.e)), 'factorial': dec_wrap(math.factorial),
            'Arg': lambda z: Decimal(str(cmath.phase(complex(z)))),
            'Conjg': lambda z: complex(z).conjugate(),
            'Det': self._det, 'Trn': self._trn, 'Dot': self._dot,
            'num_int': self.num_int, 'num_deriv': self.num_deriv
        }

        self.button_widgets = {}
        self.create_widgets()

    def _det(self, mat): return Decimal(str(np.linalg.det(np.array(mat))))
    def _trn(self, mat): return np.array(mat).T.tolist()
    def _dot(self, m1, m2): return np.dot(np.array(m1), np.array(m2)).tolist()

    def create_widgets(self):
        BG_MAIN = "#1e1e2f"
        self.root.configure(bg=BG_MAIN)
        self.left_frame = tk.Frame(self.root, bg=BG_MAIN)
        self.left_frame.pack(side="left", fill="both", expand=True, padx=20, pady=20)

        self.right_frame = tk.Frame(self.root, width=350, bg="#252538")
        self.right_frame.pack(side="right", fill="y", padx=20, pady=20)
        self.right_frame.pack_propagate(False)

        tk.Label(self.right_frame, text="LOGIC STEPS", font=("Segoe UI", 14, "bold"), bg="#252538", fg="#00e5ff").pack(pady=(15, 5))
        self.steps_list = tk.Listbox(self.right_frame, font=("Consolas", 12), bg="#181825", fg="#a6accd", selectbackground="#3e3e5c", highlightthickness=0, bd=0)
        self.steps_list.pack(fill="both", expand=True, padx=15, pady=(0, 15))

        # Status bar
        self.status_var = tk.StringVar(value="D   Standard")
        self.status_label = tk.Label(self.left_frame, textvariable=self.status_var, font=("Consolas", 11, "bold"), bg="#1e1e2f", fg="#a6accd", anchor="w")
        self.status_label.grid(row=0, column=0, columnspan=5, sticky="nsew", pady=(0,5))

        self.display = tk.Entry(self.left_frame, font=self.DISPLAY_FONT, justify='right', bg="#cceae7", fg="#003333", bd=0)
        self.display.grid(row=1, column=0, columnspan=5, sticky="nsew", pady=(0, 20), ipady=15)

        def make_btn(txt, r, c, cmd, bg="#33334d", fg="#ffffff", font=("Segoe UI", 13, "bold"), hover_bg="#4d4d73"):
            btn = tk.Button(self.left_frame, text=txt, command=cmd, bg=bg, fg=fg, font=font, 
                            activebackground=hover_bg, activeforeground="white", 
                            relief="flat", bd=0, cursor="hand2")
            btn.grid(row=r, column=c, sticky="nsew", padx=4, pady=4)
            btn.bind("<Enter>", lambda e, b=btn, h=hover_bg: b.config(bg=h))
            btn.bind("<Leave>", lambda e, b=btn, color=bg: b.config(bg=color))
            return btn

        # Row 2
        self.btn_shift = make_btn("SHIFT", 2, 0, self.toggle_shift, bg="#3b4252", hover_bg="#4c566a")
        self.btn_alpha = make_btn("ALPHA", 2, 1, self.toggle_alpha, bg="#3b4252", hover_bg="#4c566a")
        make_btn("MODE", 2, 2, self.toggle_mode, bg="#3b4252", hover_bg="#4c566a")
        make_btn("S-D", 2, 3, self.toggle_sd, bg="#3b4252", hover_bg="#4c566a")
        make_btn("ENG", 2, 4, self.toggle_eng, bg="#3b4252", hover_bg="#4c566a")

        # Row 3
        make_btn("CALC\n(=)", 3, 0, self.on_calc)
        make_btn("∫", 3, 1, self.prompt_integration)
        make_btn("d/dx", 3, 2, self.prompt_derivative)
        make_btn("WINDOW", 3, 3, self.on_window)
        make_btn("STO", 3, 4, self.toggle_store)

        # Row 4
        make_btn("x⁻¹", 4, 0, lambda: self.insert_text("⁻¹"))
        make_btn("√", 4, 1, lambda: self.insert_text("√("))
        make_btn("x²", 4, 2, lambda: self.insert_text("²"))
        make_btn("^", 4, 3, lambda: self.insert_text("^"))
        make_btn("i", 4, 4, lambda: self.insert_text("i"))

        # Row 5
        make_btn("log", 5, 0, lambda: self.insert_text("log("))
        make_btn("ln", 5, 1, lambda: self.insert_text("ln("))
        make_btn("sin", 5, 2, lambda: self.insert_text("sin("))
        make_btn("cos", 5, 3, lambda: self.insert_text("cos("))
        make_btn("tan", 5, 4, lambda: self.insert_text("tan("))

        # Row 6
        for i, v in enumerate(["A", "B", "C", "D", "E"]):
            make_btn(v, 6, i, lambda x=v: self.insert_text(x), fg="#ff79c6")

        # Row 7
        make_btn("F", 7, 0, lambda: self.insert_text("F"), fg="#ff79c6")
        make_btn("X", 7, 1, lambda: self.insert_text("X"), fg="#ff79c6")
        make_btn("Y", 7, 2, lambda: self.insert_text("Y"), fg="#ff79c6")
        make_btn("M", 7, 3, lambda: self.insert_text("M"), fg="#ff79c6")
        make_btn(",", 7, 4, lambda: self.insert_text(","))

        # Row 8
        make_btn("(", 8, 0, lambda: self.insert_text("("))
        make_btn(")", 8, 1, lambda: self.insert_text(")"))
        make_btn("M+", 8, 2, self.m_plus)
        make_btn("M-", 8, 3, self.m_minus)
        make_btn("∠", 8, 4, lambda: self.insert_text("∠"))

        # Row 9
        make_btn("Det", 9, 0, lambda: self.insert_text("Det("))
        make_btn("Trn", 9, 1, lambda: self.insert_text("Trn("))
        make_btn("Dot", 9, 2, lambda: self.insert_text("Dot("))
        make_btn("Arg", 9, 3, lambda: self.insert_text("Arg("))
        make_btn("Conjg", 9, 4, lambda: self.insert_text("Conjg("))

        # Keypad (Rows 10-13)
        keys = [
            ("7\n(CONST)",10,0), ("8",10,1), ("9\n(RESET)",10,2), ("DEL",10,3, "#ff5555", "#ff7777", "white"), ("AC",10,4, "#ff5555", "#ff7777", "white"),
            ("4",11,0), ("5",11,1), ("6",11,2), ("*",11,3, "#44475a", "#6272a4", "white"), ("/",11,4, "#44475a", "#6272a4", "white"),
            ("1",12,0), ("2",12,1), ("3",12,2), ("+",12,3, "#44475a", "#6272a4", "white"), ("-",12,4, "#44475a", "#6272a4", "white"),
            ("0",13,0), (".",13,1), ("EXP",13,2), ("Ans",13,3), ("=",13,4, "#00e5ff", "#5cffff", "#000000")
        ]
        
        for item in keys:
            txt, r, c = item[0], item[1], item[2]
            bg = item[3] if len(item) > 3 else "#e6e6e6"
            hover_bg = item[4] if len(item) > 4 else "#ffffff"
            fg = item[5] if len(item) > 5 else ("white" if len(item) > 3 else "black")
            
            if txt == "AC": cmd = self.clear_entry
            elif txt == "DEL": cmd = self.delete_one
            elif txt == "=": cmd = self.calculate
            elif txt == "Ans": cmd = lambda: self.insert_text("ans")
            elif txt == "EXP": cmd = lambda: self.insert_text("E")
            elif txt == "7\n(CONST)": cmd = lambda x="7": self.insert_text(x)
            elif txt == "9\n(RESET)": cmd = lambda x="9": self.insert_text(x)
            else: cmd = lambda x=txt: self.insert_text(x)
            make_btn(txt, r, c, cmd, bg=bg, fg=fg, font=("Segoe UI", 15, "bold"), hover_bg=hover_bg)

        for r in range(14): self.left_frame.grid_rowconfigure(r, weight=1)
        for c in range(5): self.left_frame.grid_columnconfigure(c, weight=1)

        self.update_status()

    def update_status(self):
        status = ["D"]
        status.append(self.mode)
        if self.shift: status.append("[SHIFT]")
        if self.alpha: status.append("[ALPHA]")
        if self.sd_mode: status.append("[S-D]")
        if self.eng_mode: status.append("[ENG]")
        if self.waiting_store: status.append("[STO]")
        self.status_var.set("   ".join(status))

    def add_step(self, step_text):
        self.steps_list.insert(tk.END, step_text)
        self.steps_list.yview(tk.END)

    def insert_text(self, txt):
        if self.waiting_store and txt in self.vars:
            self.store_var(txt)
            return
        if self.shift:
            if txt == "sin(": txt = "asin("
            elif txt == "cos(": txt = "acos("
            elif txt == "tan(": txt = "atan("
            elif txt == "7":
                self.toggle_shift()
                self.show_constants_menu()
                return
            elif txt == "9":
                self.toggle_shift()
                self.reset_all()
                return
            self.toggle_shift()
        self.display.insert(tk.END, txt)

    def clear_entry(self):
        self.display.delete(0, tk.END)

    def delete_one(self):
        txt = self.display.get()
        self.display.delete(0, tk.END)
        self.display.insert(0, txt[:-1])

    def toggle_shift(self):
        self.shift = not self.shift
        self.btn_shift.config(bg="#cca12b" if self.shift else "#444", fg="black" if self.shift else "white")
        self.update_status()

    def toggle_alpha(self):
        self.alpha = not self.alpha
        self.btn_alpha.config(bg="#cc3333" if self.alpha else "#444")
        self.update_status()

    def toggle_sd(self):
        self.sd_mode = not self.sd_mode
        self.eng_mode = False
        self.add_step("S-D Mode: " + ("Exact" if self.sd_mode else "Decimal"))
        self.update_status()
        if self.history:
            self.display_result(self.history[-1])

    def toggle_eng(self):
        self.eng_mode = not self.eng_mode
        self.sd_mode = False
        self.add_step("ENG Mode: " + ("On" if self.eng_mode else "Off"))
        self.update_status()
        if self.history:
            self.display_result(self.history[-1])

    def show_constants_menu(self):
        w = tk.Toplevel(self.root)
        w.title("Scientific Constants")
        w.geometry("400x300")
        listbox = tk.Listbox(w, font=("Arial", 12))
        listbox.pack(fill="both", expand=True)
        for c in CASIO_CONSTANTS:
            listbox.insert(tk.END, f"{c}  ({CASIO_CONSTANTS[c][1]})")
        
        def on_select(evt):
            sel = listbox.curselection()
            if sel:
                key = listbox.get(sel[0]).split('  (')[0]
                val = CASIO_CONSTANTS[key][0]
                self.display.insert(tk.END, f"({val})")
                self.add_step(f"Inserted Constant {key}")
                w.destroy()
                
        listbox.bind("<<ListboxSelect>>", on_select)

    def toggle_mode(self):
        w = tk.Toplevel(self.root)
        w.title("MODE SELECTION")
        w.geometry("300x400")
        w.configure(bg="#1e1e2f")
        w.transient(self.root)
        w.grab_set()
        
        tk.Label(w, text="Select Mode", font=("Segoe UI", 16, "bold"), bg="#1e1e2f", fg="#00e5ff").pack(pady=20)
        
        modes = [
            ("1: Standard", 'Standard'),
            ("2: Complex", 'Complex'),
            ("3: Matrix", 'Matrix'),
            ("4: Graph (Plot)", 'Graph')
        ]
        
        def set_mode(m):
            self.mode = m
            self.update_title()
            self.update_status()
            self.add_step(f"Switched to {self.mode} Mode")
            w.destroy()
            
        for text, mode_val in modes:
            b = tk.Button(w, text=text, font=("Segoe UI", 14, "bold"), bg="#252538", fg="#ffffff", 
                          relief="flat", activebackground="#4d4d73", activeforeground="white",
                          command=lambda m=mode_val: set_mode(m), cursor="hand2")
            b.pack(fill="x", padx=40, pady=10, ipady=8)
            b.bind("<Enter>", lambda e, btn=b: btn.config(bg="#4d4d73"))
            b.bind("<Leave>", lambda e, btn=b: btn.config(bg="#252538"))

    def toggle_store(self):
        self.waiting_store = not self.waiting_store
        self.update_status()
        self.add_step("Select variable to STO")

    def store_var(self, var_name):
        val, err = self._safe_eval(self.display.get())
        if err: messagebox.showerror("Error", err)
        else:
            self.vars[var_name] = val
            self.add_step(f"Stored {val} -> {var_name}")
        self.waiting_store = False

    def update_title(self):
        self.root.title(f"Casio fx-991EX ClassWiz Emulator - {self.mode}")

    def m_plus(self):
        val, err = self._safe_eval(self.display.get())
        if not err:
            self.vars['M'] += val
            self.add_step(f"M+ => M={self.vars['M']}")

    def m_minus(self):
        val, err = self._safe_eval(self.display.get())
        if not err:
            self.vars['M'] -= val
            self.add_step(f"M- => M={self.vars['M']}")

    def reset_all(self):
        self.variables = {v: Decimal('0') for v in ['A', 'B', 'C', 'D', 'E', 'F', 'M', 'X', 'Y']}
        self.vars = self.variables
        self.mode = 'Standard'
        self.sd_mode = False
        self.eng_mode = False
        self.history.clear()
        self.steps_list.delete(0, tk.END)
        self.clear_entry()
        self.update_title()
        self.update_status()
        self.add_step("Reset Complete")

    def num_int(self, expr_str, a, b):
        a, b = float(a), float(b)
        n = 1000
        if n % 2 != 0: n += 1
        h = (b - a) / n
        
        env = self._get_env()
        def f(x_val):
            env['X'] = Decimal(str(x_val))
            res = eval(expr_str, {}, env)
            return float(res.real if isinstance(res, complex) else res)

        s = f(a) + f(b)
        for i in range(1, n, 2): s += 4 * f(a + i * h)
        for i in range(2, n-1, 2): s += 2 * f(a + i * h)
        return Decimal(str(s * h / 3))

    def num_deriv(self, expr_str, x_val):
        x_val = float(x_val)
        h = 1e-7
        env = self._get_env()
        def f(x):
            env['X'] = Decimal(str(x))
            res = eval(expr_str, {}, env)
            return float(res.real if isinstance(res, complex) else res)
        return Decimal(str((f(x_val + h) - f(x_val - h)) / (2 * h)))

    def prompt_integration(self):
        expr = simpledialog.askstring("Integration", "Enter function f(X):")
        if not expr: return
        a = simpledialog.askstring("Integration", "Enter lower limit a:")
        if not a: return
        b = simpledialog.askstring("Integration", "Enter upper limit b:")
        if not b: return
        self.insert_text(f"∫({expr}, {a}, {b})")

    def prompt_derivative(self):
        expr = simpledialog.askstring("Derivative", "Enter function f(X):")
        if not expr: return
        x_val = simpledialog.askstring("Derivative", "Enter value for X:")
        if not x_val: return
        self.insert_text(f"d/dx({expr}, {x_val})")

    def on_calc(self):
        if self.shift:
            self.toggle_shift()
            self.on_solve()
            return
            
        if self.alpha:
            self.alpha = False
            self.btn_alpha.config(bg="#444")
            self.update_status()
            self.insert_text("=")
            return
            
        expr = self.display.get()
        vars_found = list(set(re.findall(r'[A-FXYM]', expr)))
        if not vars_found: return
        for v in vars_found:
            val = simpledialog.askstring("Input", f"{v}?")
            if val is not None:
                parsed, err = self._safe_eval(val)
                if not err: self.vars[v] = parsed
        self.add_step("CALC Variable Substitution:")
        for v in vars_found: self.add_step(f"  {v} = {self.vars[v]}")
        self.calculate()

    def on_solve(self):
        expr = self.display.get()
        # lowercase x, y -> uppercase X, Y
        expr = re.sub(r'\b[xX]\b', 'X', expr)
        expr = re.sub(r'\b[yY]\b', 'Y', expr)

        if "=" not in expr:
            func_str = expr
        else:
            lhs, rhs = expr.split('=')
            func_str = f"({lhs})-({rhs})"
        
        func_str = self.preprocess_expression(func_str)
        
        guess_str = simpledialog.askstring("SOLVE", "Initial guess for X?", initialvalue="0")
        if guess_str is None: return
        try: initial_guess = float(guess_str)
        except: initial_guess = 0.0

        env = self._get_env()
        def f(val):
            env['X'] = Decimal(str(val))
            res = eval(func_str, {}, env)
            if isinstance(res, complex): return res.real
            return float(res)

        guesses = [initial_guess, 1.0, -1.0, 10.0, -10.0, 100.0, -100.0, 3.14, 0.1]
        solution = None
        
        for guess in guesses:
            x = guess
            found = False
            for _ in range(100):
                try:
                    fx = f(x)
                    if abs(fx) < 1e-10:
                        found = True
                        break
                    dfx = (f(x + 1e-7) - f(x - 1e-7)) / 2e-7
                    if abs(dfx) < 1e-12: 
                        x += 0.1
                        continue
                    x_new = x - fx / dfx
                    if abs(x_new - x) < 1e-10:
                        if abs(f(x_new)) < 1e-8:
                            found = True
                        break
                    x = x_new
                except:
                    break
            if found:
                solution = x
                break
                
        if solution is not None:
            self.vars['X'] = Decimal(str(solution))
            self.add_step(f"SOLVE: X = {solution:.10g}")
            self.display.delete(0, tk.END)
            self.display.insert(0, f"{solution:.10g}")
        else:
            messagebox.showerror("SOLVE Error", "Could not find a solution.")

    def on_window(self):
        w = tk.Toplevel(self.root)
        w.title("WINDOW Settings")
        entries = {}
        for i, key in enumerate(['Xmin', 'Xmax', 'Ymin', 'Ymax']):
            tk.Label(w, text=key).grid(row=i, column=0)
            e = tk.Entry(w)
            e.insert(0, str(self.window_settings[key]))
            e.grid(row=i, column=1)
            entries[key] = e
        
        def save():
            try:
                for k in entries: self.window_settings[k] = float(entries[k].get())
                w.destroy()
                self.add_step(f"WINDOW updated: {self.window_settings}")
            except: messagebox.showerror("Error", "Invalid number")
        tk.Button(w, text="Apply", command=save).grid(row=4, columnspan=2)

    def on_graph(self):
        expr_raw = self.display.get()
        if not expr_raw: return
        
        expr_raw = re.sub(r'\b[xX]\b', 'X', expr_raw)
        expr_raw = re.sub(r'\b[yY]\b', 'Y', expr_raw)
        
        xmin, xmax = self.window_settings['Xmin'], self.window_settings['Xmax']
        ymin, ymax = self.window_settings['Ymin'], self.window_settings['Ymax']
        
        plt.figure("Smart Calc Graph", figsize=(8, 6))
        plt.clf()
        
        x_vals = np.linspace(xmin, xmax, 400)
        y_vals = np.linspace(ymin, ymax, 400)
        X_grid, Y_grid = np.meshgrid(x_vals, y_vals)
        
        if "=" in expr_raw:
            lhs_raw, rhs_raw = expr_raw.split('=')
            func_str = f"({lhs_raw})-({rhs_raw})"
        else:
            func_str = f"Y-({expr_raw})"
            
        s = self.preprocess_expression(func_str)
        # Remove Decimal wrapper to allow numpy operations
        s = re.sub(r'Decimal\("([^"]+)"\)', r'\1', s)
        
        env = {
            'sin': np.sin, 'cos': np.cos, 'tan': np.tan,
            'asin': np.arcsin, 'acos': np.arccos, 'atan': np.arctan,
            'sinh': np.sinh, 'cosh': np.cosh, 'tanh': np.tanh,
            'sqrt': np.sqrt, 'ln': np.log, 'log': np.log10,
            'exp': np.exp, 'abs': np.abs, 'pi': np.pi, 'e': np.e,
            'X': X_grid, 'Y': Y_grid
        }
        
        try:
            import warnings
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                Z = eval(s, {}, env)
                if np.isscalar(Z):
                    Z = np.full_like(X_grid, Z)
                plt.contour(X_grid, Y_grid, Z, levels=[0], colors=['#ff0055'], linewidths=2)
            plt.title(f"Graph of: {expr_raw}", fontsize=14, fontweight='bold', color='#33334d')
        except Exception as e:
            messagebox.showerror("Graph Error", f"Could not plot equation.\n{e}")
            return
            
        plt.xlim(xmin, xmax)
        plt.ylim(ymin, ymax)
        plt.axhline(0, color='black', linewidth=1)
        plt.axvline(0, color='black', linewidth=1)
        plt.grid(True, linestyle='--', alpha=0.6)
        
        ax = plt.gca()
        ax.set_facecolor('#f8f9fa')
        plt.show()

    def preprocess_expression(self, expr):
        s = expr
        s = re.sub(r'\b[xX]\b', 'X', s)
        s = re.sub(r'\b[yY]\b', 'Y', s)
        s = re.sub(r'\b[aA]\b', 'A', s)
        s = re.sub(r'\b[bB]\b', 'B', s)
        s = re.sub(r'\b[cC]\b', 'C', s)
        s = re.sub(r'\b[dD]\b', 'D', s)
        s = re.sub(r'\b[fF]\b', 'F', s)
        s = re.sub(r'\b[mM]\b', 'M', s)

        # Substitute Visuals
        s = s.replace("²", "**2").replace("³", "**3").replace("⁻¹", "**-1")
        s = s.replace("√(", "sqrt(")
        s = s.replace("∠", "*exp(1j*")
        s = s.replace("^", "**")
        
        # Unary Minus & Exponents (Handled naturally by python precedence: -3**2 = -9)
        # Numerical Calculus substitutions
        s = re.sub(r'∫\(([^,]+),\s*([^,]+),\s*([^)]+)\)', r'num_int("\1", \2, \3)', s)
        s = re.sub(r'd/dx\(([^,]+),\s*([^)]+)\)', r'num_deriv("\1", \2)', s)
        
        # Implicit Multiplication (e.g. 2X -> 2*X, X Y -> X*Y, 2(3) -> 2*(3))
        # We wrap implicit multiplications in parenthesis to ensure Casio priority 1/2X becomes 1/(2*X)
        old_s = ""
        while old_s != s:
            old_s = s
            s = re.sub(r'(\d+(?:\.\d+)?|\b[A-FXYM]\b|\))\s*([A-FXYM]\b|\bpi\b|\be\b|\(|sin\b|cos\b|tan\b|log\b|ln\b|sqrt\b|Arg\b|Conjg\b)', r'(\1*\2)', s)
        
        # Decimal Wrapper for numbers
        s = re.sub(r'\b(\d+\.\d+|\d+)\b', r'Decimal("\1")', s)
        
        # Complex Mode i
        s = re.sub(r'\bi\b', r'1j', s)
        
        return s

    def _get_env(self):
        env = dict(self.safe_funcs)
        env.update(self.vars)
        env['ans'] = self.ans
        if self.mode == 'Complex':
            env['i'] = 1j
        return env

    def _safe_eval(self, expr):
        if not expr.strip(): return Decimal('0'), ""
        try:
            self.add_step(f"Input: {expr}")
            
            # Extract and log variables substitution BEFORE parsing
            vars_in_expr = set(re.findall(r'\b[A-FXYM]\b', expr))
            if vars_in_expr:
                sub_str = ", ".join(f"{v}={self.vars[v]}" for v in sorted(vars_in_expr))
                self.add_step(f"Substituted: {sub_str}")
                
            s = self.preprocess_expression(expr)
            self.add_step(f"Parsed: {s}")
            
            env = self._get_env()
            res = eval(s, {}, env)
            
            if isinstance(res, complex) and self.mode != 'Complex':
                if abs(res.imag) < 1e-10:
                    res = Decimal(str(res.real))
                else:
                    return None, "Math Error: Non-real result in Standard mode"
            
            return res, ""
        except ZeroDivisionError:
            return None, "Math ERROR: Division by zero"
        except ValueError as e:
            if "math domain error" in str(e).lower():
                return None, "Math ERROR: Domain error"
            return None, f"Math ERROR: {e}"
        except Exception as e:
            return None, f"Syntax/Math ERROR: {e}"

    def calculate(self):
        expr = self.display.get()
        
        if self.mode == 'Graph':
            self.on_graph()
            return
            
        if "=" in expr:
            self.on_solve()
            return
            
        val, err = self._safe_eval(expr)
        if err:
            messagebox.showerror("Error", err)
            self.add_step(f"Error: {err}")
            return
            
        self.ans = val
        self.history.append(val)
        self.display_result(val)
        
    def display_result(self, val):
        self.display.delete(0, tk.END)
        
        if self.sd_mode:
            if isinstance(val, (int, float, Decimal)):
                try:
                    frac = fractions.Fraction(float(val)).limit_denominator(1000000)
                    out = f"{frac.numerator}/{frac.denominator}"
                except:
                    out = f"{float(val):.10g}"
            else:
                out = str(val)
        else:
            if self.eng_mode:
                try:
                    v_float = float(val)
                    if v_float == 0: out = "0"
                    else:
                        exponent = int(math.floor(math.log10(abs(v_float))))
                        eng_exp = (exponent // 3) * 3
                        mantissa = v_float / (10**eng_exp)
                        out = f"{mantissa:.5g}E{eng_exp:+d}"
                except: out = str(val)
            else:
                if isinstance(val, Decimal):
                    out = f"{float(val):.10g}"
                elif isinstance(val, complex):
                    out = f"{val.real:.5g}{val.imag:+.5g}i"
                elif isinstance(val, float):
                    out = f"{val:.10g}"
                else:
                    out = str(val)
                
        self.display.insert(0, out)
        self.add_step(f"Result: {out}")
        self.add_step("-" * 20)

if __name__ == "__main__":
    root = tk.Tk()
    app = SmartCalculatorApp(root)
    root.mainloop()