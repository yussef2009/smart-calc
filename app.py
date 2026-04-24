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
        
        self.DISPLAY_FONT = ("Consolas", 32, "bold")

        self.modes = ['COMP', 'CMPLX', 'BASE-N', 'MATRIX', 'VECTOR', 'STAT', 'EQN', 'TABLE', 'DIST']
        self.mode = 'COMP'
        self.base_n_state = 'DEC'
        
        self.shift = False
        self.alpha = False
        self.sd_mode = False
        self.eng_mode = False
        self.waiting_store = False
        
        self.variables = {v: Decimal('0') for v in ['A', 'B', 'C', 'D', 'E', 'F', 'M', 'X', 'Y']}
        self.vars = self.variables
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
            'Id': self._id_mat, 'Cross': self._cross, 'Angle': self._angle,
            'num_int': self.num_int, 'num_deriv': self.num_deriv
        }

        self.sci_btns = {}
        self.keypad_btns = {}
        self.create_widgets()
        self.update_grid()

    def _det(self, mat): return Decimal(str(np.linalg.det(np.array(mat))))
    def _trn(self, mat): return np.array(mat).T.tolist()
    def _dot(self, m1, m2): return np.dot(np.array(m1), np.array(m2)).tolist()
    def _id_mat(self, n): return np.identity(int(n)).tolist()
    def _cross(self, v1, v2): return np.cross(np.array(v1), np.array(v2)).tolist()
    def _angle(self, v1, v2):
        v1_arr, v2_arr = np.array(v1), np.array(v2)
        return math.degrees(math.acos(np.dot(v1_arr, v2_arr) / (np.linalg.norm(v1_arr) * np.linalg.norm(v2_arr))))

    def create_widgets(self):
        self.sidebar_state = "hidden"
        
        BG_MAIN = "#1e1e2f"
        self.root.configure(bg=BG_MAIN)
        self.left_frame = tk.Frame(self.root, bg=BG_MAIN)
        self.left_frame.pack(side="left", fill="both", expand=True, padx=20, pady=20)

        self.right_frame = tk.Frame(self.root, width=380, bg="#252538")
        self.right_frame.pack_propagate(False)

        self.side_title = tk.Label(self.right_frame, text="LOGIC STEPS", font=("Segoe UI", 14, "bold"), bg="#252538", fg="#00e5ff")
        self.side_title.pack(fill="x", pady=(15, 5), padx=15)
        self.side_divider = tk.Frame(self.right_frame, height=2, bg="#3e3e5c")
        self.side_divider.pack(fill="x", padx=15, pady=(0, 8))

        self.steps_list = tk.Listbox(self.right_frame, font=("Consolas", 12), bg="#181825", fg="#a6accd", selectbackground="#3e3e5c", highlightthickness=0, bd=0)
        
        self.guide_text = tk.Text(
            self.right_frame, font=("Consolas", 11), bg="#181825", fg="#a6accd",
            wrap="word", relief="flat", padx=18, pady=18, cursor="arrow",
            spacing1=2, spacing3=4
        )
        self.guide_text.tag_config("heading", foreground="#00e5ff", font=("Segoe UI", 12, "bold"))
        self.guide_text.tag_config("subheading", foreground="#50fa7b", font=("Consolas", 10, "bold"))
        self.guide_text.tag_config("key", foreground="#f1fa8c", font=("Consolas", 11, "bold"))
        self.guide_text.tag_config("tip", foreground="#ffb86c", font=("Consolas", 10, "italic"))
        self.guide_text.tag_config("body", foreground="#cdd6f4", font=("Consolas", 11))
        self.guide_text.tag_config("divider", foreground="#3e3e5c")

        def g(text, tag="body"): self.guide_text.insert(tk.END, text, tag)

        g("━━━ MATHENGINE OS — USER GUIDE ━━━\n", "heading")
        g("\n")
        g("BASIC OPERATIONS\n", "subheading")
        g("  Use keyboard or buttons to enter numbers.\n", "body")
        g("  Operators: ", "body"); g("+ - * / ^ ( )", "key"); g("\n", "body")
        g("  Press ", "body"); g("= or Enter", "key"); g(" to evaluate.\n", "body")
        g("\n")
        g("SHIFT KEY\n", "subheading")
        g("  Press ", "body"); g("SHIFT", "key"); g(" then:\n", "body")
        g("    sin → sin⁻¹,  cos → cos⁻¹,  tan → tan⁻¹\n", "body")
        g("    7 → Constants Menu\n", "body")
        g("    9 → RESET all (clears to COMP mode)\n", "body")
        g("\n")
        g("ALPHA KEY\n", "subheading")
        g("  Press ", "body"); g("ALPHA", "key"); g(" to toggle variable mode.\n", "body")
        g("  Variables: ", "body"); g("A B C D E F X Y M\n", "key")
        g("\n")
        g("CALC MODE\n", "subheading")
        g("  Type an equation with variables: ", "body"); g("2X + 3Y\n", "key")
        g("  Press ", "body"); g("CALC(=)", "key")
        g(" → prompted for each variable's value.\n", "body")
        g("\n")
        g("EQUATION SOLVER\n", "subheading")
        g("  Switch to ", "body"); g("EQN mode", "key"); g(" via MODE.\n", "body")
        g("  Type: ", "body"); g("2X + 5 = 15", "key"); g(" → press ", "body"); g("SOLVE", "key"); g(".\n", "body")
        g("  Uses Newton's method with multiple starting guesses.\n", "body")
        g("\n")
        g("GRAPHING\n", "subheading")
        g("  Switch to ", "body"); g("TABLE mode", "key"); g(".\n", "body")
        g("  Enter: ", "body"); g("X^2", "key"); g(" or ", "body"); g("X^2 + Y^2 = 25\n", "key")
        g("  Press ", "body"); g("=", "key"); g(" or ", "body"); g("TABLE", "key"); g(" to plot.\n", "body")
        g("  Use ", "body"); g("WINDOW", "key"); g(" to set axis bounds.\n", "body")
        g("\n")
        g("INTEGRATION & DERIVATIVE\n", "subheading")
        g("  Use ", "body"); g("∫", "key"); g(" button → enter f(X), a, b\n", "body")
        g("  Use ", "body"); g("d/dx", "key"); g(" button → enter f(X), x-value\n", "body")
        g("\n")
        g("BASE-N MODE\n", "subheading")
        g("  Select ", "body"); g("BASE-N", "key"); g(" → choose BIN/OCT/DEC/HEX.\n", "body")
        g("  Invalid digits are auto-disabled (e.g., 2-9 in BIN).\n", "body")
        g("  Bitwise ops: ", "body"); g("AND OR XOR NOT\n", "key")
        g("\n")
        g("KEYBOARD SHORTCUTS\n", "subheading")
        shortcuts = [
            ("0-9, . + - * / ^ ( )", "Type directly"),
            ("Enter / Return", "Execute (=)"),
            ("Backspace", "Delete last char (DEL)"),
            ("Escape / Delete", "Clear All (AC)"),
            ("A-F, X, Y, M, i", "Type variables"),
            ("F1", "Toggle this Guide"),
            ("F2", "Toggle History panel"),
        ]
        for k, v in shortcuts:
            g(f"  ", "body"); g(f"{k:<22}", "key"); g(f" → {v}\n", "body")
        g("\n")
        g("★ Tip: ", "tip")
        g("Button flash (yellow) confirms each keypress.\n", "tip")
        g("★ Tip: ", "tip")
        g("Use STO to store results into variables A-M.\n", "tip")

        self.guide_text.config(state="disabled")

        # Branded title bar
        title_bar = tk.Frame(self.left_frame, bg="#1e1e2f")
        title_bar.grid(row=0, column=0, columnspan=5, sticky="nsew", pady=(0, 6))
        title_bar.grid_columnconfigure(0, weight=1)

        tk.Label(title_bar, text="MATHENGINE OS", font=("Segoe UI", 10, "bold"),
                 bg="#1e1e2f", fg="#44475a", anchor="w").grid(row=0, column=0, sticky="w")

        top_bar = tk.Frame(self.left_frame, bg="#1e1e2f")
        top_bar.grid(row=1, column=0, columnspan=5, sticky="nsew", pady=(0, 4))
        top_bar.grid_columnconfigure(0, weight=1)
        
        self.status_var = tk.StringVar(value="D   COMP")
        self.status_label = tk.Label(top_bar, textvariable=self.status_var,
                                     font=("Consolas", 11, "bold"), bg="#1e1e2f", fg="#00e5ff", anchor="w")
        self.status_label.grid(row=0, column=0, sticky="w")

        self.btn_history = tk.Button(top_bar, text="📜 LOG", command=self.toggle_history,
                                     bg="#252538", fg="#a6accd", bd=0,
                                     activebackground="#3e3e5c", cursor="hand2",
                                     takefocus=0, font=("Segoe UI", 9, "bold"), padx=10, pady=2)
        self.btn_history.grid(row=0, column=1, padx=3)

        self.btn_guide = tk.Button(top_bar, text="❓ GUIDE", command=self.toggle_guide,
                                   bg="#252538", fg="#a6accd", bd=0,
                                   activebackground="#3e3e5c", cursor="hand2",
                                   takefocus=0, font=("Segoe UI", 9, "bold"), padx=10, pady=2)
        self.btn_guide.grid(row=0, column=2, padx=3)

        # Window starts compact
        self.root.geometry("620x790")
        self.root.resizable(False, False)

        # Display — with a sub-label showing the previous expression
        display_frame = tk.Frame(self.left_frame, bg="#e6f0ea", padx=4, pady=4)
        display_frame.grid(row=3, column=0, columnspan=5, sticky="nsew", pady=(0, 12))
        display_frame.grid_columnconfigure(0, weight=1)
        
        self.expr_label = tk.Label(display_frame, text="", font=("Consolas", 11),
                                   bg="#e6f0ea", fg="#558870", anchor="e", justify="right")
        self.expr_label.grid(row=0, column=0, sticky="ew", padx=8)
        
        self.display = tk.Entry(display_frame, font=self.DISPLAY_FONT, justify='right',
                                bg="#e6f0ea", fg="#0d1f15", bd=0,
                                insertbackground="#0d1f15", relief="flat")
        self.display.grid(row=1, column=0, sticky="ew", padx=8, ipady=10)
        
        # Keyboard Integration - bind ONLY to root to prevent double-firing
        self.root.bind("<KeyPress>", self.handle_keypress)
        self.root.after(100, self.display.focus_set)

        for r in range(2, 10):
            for c in range(5):
                self.sci_btns[(r, c)] = self.make_btn("", r, c, lambda: None)

        keys = [
            ("7\n(CONST)",10,0, "#282a36", "#44475a", "white"), ("8",10,1, "#282a36", "#44475a", "white"), ("9\n(RESET)",10,2, "#282a36", "#44475a", "white"), ("DEL",10,3, "#ff5555", "#ff7777", "white"), ("AC",10,4, "#ff5555", "#ff7777", "white"),
            ("4",11,0, "#282a36", "#44475a", "white"), ("5",11,1, "#282a36", "#44475a", "white"), ("6",11,2, "#282a36", "#44475a", "white"), ("*",11,3, "#44475a", "#6272a4", "white"), ("/",11,4, "#44475a", "#6272a4", "white"),
            ("1",12,0, "#282a36", "#44475a", "white"), ("2",12,1, "#282a36", "#44475a", "white"), ("3",12,2, "#282a36", "#44475a", "white"), ("+",12,3, "#44475a", "#6272a4", "white"), ("-",12,4, "#44475a", "#6272a4", "white"),
            ("0",13,0, "#282a36", "#44475a", "white"), (".",13,1, "#282a36", "#44475a", "white"), ("EXP",13,2, "#44475a", "#6272a4", "white"), ("Ans",13,3, "#44475a", "#6272a4", "white"), ("=",13,4, "#00e5ff", "#5cffff", "black")
        ]
        
        for item in keys:
            txt, r, c = item[0], item[1], item[2]
            bg = item[3]
            hover_bg = item[4]
            fg = item[5]
            
            if txt == "AC": cmd = self.clear_entry
            elif txt == "DEL": cmd = self.delete_one
            elif txt == "=": cmd = self.calculate
            elif txt == "Ans": cmd = lambda: self.insert_text("ans")
            elif txt == "EXP": cmd = lambda: self.insert_text("E")
            elif txt == "7\n(CONST)": cmd = lambda x="7": self.insert_text(x)
            elif txt == "9\n(RESET)": cmd = lambda x="9": self.insert_text(x)
            else: cmd = lambda x=txt: self.insert_text(x)
            
            btn = self.make_btn(txt, r, c, cmd, bg=bg, fg=fg, hover_bg=hover_bg, font=("Segoe UI", 15, "bold"))
            self.keypad_btns[txt] = btn

        for r in range(14): self.left_frame.grid_rowconfigure(r, weight=1)
        # Row 0,1 (title/status) and row 3 (display) are smaller
        self.left_frame.grid_rowconfigure(0, weight=0)
        self.left_frame.grid_rowconfigure(1, weight=0)
        self.left_frame.grid_rowconfigure(3, weight=1)
        for c in range(5): self.left_frame.grid_columnconfigure(c, weight=1)

    def toggle_history(self):
        if self.sidebar_state == "history":
            self.hide_sidebar()
        else:
            self.show_sidebar("history")

    def toggle_guide(self):
        if self.sidebar_state == "guide":
            self.hide_sidebar()
        else:
            self.show_sidebar("guide")

    def show_sidebar(self, panel_type):
        self.sidebar_state = panel_type
        self.root.geometry("1020x790")
        self.right_frame.pack(side="right", fill="y", padx=(0, 20), pady=20)
        
        self.steps_list.pack_forget()
        self.guide_text.pack_forget()
        
        if panel_type == "history":
            self.side_title.config(text="📜  LOGIC STEPS", fg="#00e5ff")
            self.side_divider.config(bg="#00e5ff")
            self.steps_list.pack(fill="both", expand=True, padx=15, pady=(0, 15))
            self.btn_history.config(bg="#00e5ff", fg="black")
            self.btn_guide.config(bg="#252538", fg="#a6accd")
        elif panel_type == "guide":
            self.side_title.config(text="❓  USER GUIDE", fg="#50fa7b")
            self.side_divider.config(bg="#50fa7b")
            self.guide_text.pack(fill="both", expand=True, padx=0, pady=(0, 15))
            self.btn_guide.config(bg="#50fa7b", fg="black")
            self.btn_history.config(bg="#252538", fg="#a6accd")
            
        self.display.focus_set()

    def hide_sidebar(self):
        self.sidebar_state = "hidden"
        self.right_frame.pack_forget()
        self.root.geometry("620x790")
        self.btn_history.config(bg="#252538", fg="#a6accd")
        self.btn_guide.config(bg="#252538", fg="#a6accd")
        self.display.focus_set()

    def handle_keypress(self, event):
        keysym = event.keysym
        char = event.char.upper() if event.char else ""

        if keysym in ['Left', 'Right', 'Up', 'Down', 'Home', 'End']:
            return None 

        if keysym == 'Return' or keysym == 'KP_Enter':
            self.flash_button('=')
            self.calculate()
            return "break"
        elif keysym == 'BackSpace':
            self.flash_button('DEL')
            self.delete_one()
            return "break"
        elif keysym in ['Escape', 'Delete']:
            self.flash_button('AC')
            self.clear_entry()
            return "break"
        elif keysym == 'F1':
            self.toggle_guide()
            return "break"
        elif keysym == 'F2':
            self.toggle_history()
            return "break"
        
        if char in '0123456789.+-*/^()=' and char != "":
            self.flash_button(char)
            self.insert_text(char)
            return "break"
        elif char in 'ABCDEFXYMI' and char != "":
            insert_c = 'i' if char == 'I' else char
            self.flash_button('i' if char == 'I' else char)
            self.insert_text(insert_c)
            return "break"
            
        if event.char and event.char.isprintable():
            return "break"
            
        return None

    def flash_button(self, key):
        btn_to_flash = None
        
        for txt, btn in self.keypad_btns.items():
            if txt == key:
                btn_to_flash = btn
                break
            if txt.startswith(key + "\n"):
                btn_to_flash = btn
                break
                
        if not btn_to_flash:
            for btn in self.sci_btns.values():
                if btn.cget("text") == key:
                    btn_to_flash = btn
                    break
                    
        if btn_to_flash:
            original_bg = btn.cget("bg")
            original_fg = btn.cget("fg")
            btn.config(bg="#f1fa8c", fg="black")
            self.root.after(150, lambda b=btn, obg=original_bg, ofg=original_fg: b.config(bg=obg, fg=ofg))

    def make_btn(self, txt, r, c, cmd, bg="#33334d", fg="#ffffff", font=("Segoe UI", 13, "bold"), hover_bg="#4d4d73"):
        btn = tk.Button(self.left_frame, text=txt, command=cmd, bg=bg, fg=fg, font=font, 
                        activebackground=hover_bg, activeforeground="white", 
                        relief="flat", bd=0, cursor="hand2", takefocus=0)
        btn.grid(row=r, column=c, sticky="nsew", padx=4, pady=4)
        btn.bind("<Enter>", lambda e, b=btn, h=hover_bg: b.config(bg=h))
        btn.bind("<Leave>", lambda e, b=btn, color=bg: b.config(bg=color))
        return btn

    def config_btn(self, r, c, txt, cmd, bg="#33334d", fg="#ffffff", hover_bg=None):
        btn = self.sci_btns[(r, c)]
        if hover_bg is None:
            if bg == "#33334d": hover_bg = "#4d4d73"
            elif bg == "#1e1e2f": hover_bg = "#1e1e2f"
            elif bg == "#2e4a3d": hover_bg = "#3a5c4d"
            elif bg == "#2a3b5c": hover_bg = "#354a73"
            elif bg == "#5c4b2a": hover_bg = "#735e35"
            elif bg == "#4b2a5c": hover_bg = "#5e3573"
            elif bg == "#2a5c5c": hover_bg = "#357373"
            elif bg == "#5c2a3b": hover_bg = "#73354a"
            elif bg == "#50fa7b": hover_bg = "#75ffa2"
            elif bg == "#00e5ff": hover_bg = "#33ebff"
            elif bg == "#bd93f9": hover_bg = "#d1b3ff"
            elif bg == "#3b4252": hover_bg = "#4c566a"
            else: hover_bg = bg
            
        btn.config(text=txt, command=cmd, bg=bg, fg=fg)
        btn.bind("<Enter>", lambda e, b=btn, h=hover_bg: b.config(bg=h))
        btn.bind("<Leave>", lambda e, b=btn, color=bg: b.config(bg=color))

    def switch_mode(self, mode_name):
        self.mode = mode_name
        self.update_title()
        self.update_grid()
        self.add_step(f"Switched to {self.mode} Mode")
        self.display.focus_set()

    def update_grid(self):
        for r in range(2, 10):
            for c in range(5):
                self.config_btn(r, c, "", lambda: None, "#1e1e2f", "#1e1e2f")
                
        self.config_btn(2, 0, "SHIFT", self.toggle_shift, "#3b4252")
        self.config_btn(2, 1, "ALPHA", self.toggle_alpha, "#3b4252")
        self.config_btn(2, 2, "MODE", self.switch_mode_menu, "#3b4252")
        
        for key, btn in self.keypad_btns.items():
            btn.config(state="normal")
            
        if self.mode == 'COMP': self._setup_comp_grid()
        elif self.mode == 'CMPLX': self._setup_cmplx_grid()
        elif self.mode == 'EQN': self._setup_eqn_grid()
        elif self.mode == 'BASE-N': self._setup_basen_grid()
        elif self.mode == 'MATRIX': self._setup_matrix_grid()
        elif self.mode == 'VECTOR': self._setup_vector_grid()
        elif self.mode == 'STAT': self._setup_stat_grid()
        elif self.mode == 'TABLE': self._setup_table_grid()
        elif self.mode == 'DIST': self._setup_dist_grid()
        else: self._setup_comp_grid()
            
        self.update_status()

    def _setup_comp_grid(self):
        self.config_btn(2, 3, "S-D", self.toggle_sd, "#3b4252")
        self.config_btn(2, 4, "ENG", self.toggle_eng, "#3b4252")
        
        self.config_btn(3, 0, "CALC\n(=)", self.on_calc)
        self.config_btn(3, 1, "∫", self.prompt_integration)
        self.config_btn(3, 2, "d/dx", self.prompt_derivative)
        self.config_btn(3, 3, "WINDOW", self.on_window)
        self.config_btn(3, 4, "STO", self.toggle_store)

        self.config_btn(4, 0, "x⁻¹", lambda: self.insert_text("⁻¹"))
        self.config_btn(4, 1, "√", lambda: self.insert_text("√("))
        self.config_btn(4, 2, "x²", lambda: self.insert_text("²"))
        self.config_btn(4, 3, "^", lambda: self.insert_text("^"))
        self.config_btn(4, 4, "log", lambda: self.insert_text("log("))

        self.config_btn(5, 0, "ln", lambda: self.insert_text("ln("))
        self.config_btn(5, 1, "sin", lambda: self.insert_text("sin("))
        self.config_btn(5, 2, "cos", lambda: self.insert_text("cos("))
        self.config_btn(5, 3, "tan", lambda: self.insert_text("tan("))
        self.config_btn(5, 4, "(-)", lambda: self.insert_text("-"))

        for i, v in enumerate(["A", "B", "C", "D", "E"]):
            self.config_btn(6, i, v, lambda x=v: self.insert_text(x), fg="#ff79c6")

        self.config_btn(7, 0, "F", lambda: self.insert_text("F"), fg="#ff79c6")
        self.config_btn(7, 1, "X", lambda: self.insert_text("X"), fg="#ff79c6")
        self.config_btn(7, 2, "Y", lambda: self.insert_text("Y"), fg="#ff79c6")
        self.config_btn(7, 3, "M", lambda: self.insert_text("M"), fg="#ff79c6")
        self.config_btn(7, 4, ",", lambda: self.insert_text(","))

        self.config_btn(8, 0, "(", lambda: self.insert_text("("))
        self.config_btn(8, 1, ")", lambda: self.insert_text(")"))
        self.config_btn(8, 2, "M+", self.m_plus)
        self.config_btn(8, 3, "M-", self.m_minus)
        self.config_btn(8, 4, "π", lambda: self.insert_text("pi"))

    def _setup_cmplx_grid(self):
        self._setup_comp_grid()
        self.config_btn(2, 4, "i", lambda: self.insert_text("i"), bg="#bd93f9", fg="black") 
        self.config_btn(9, 0, "Arg", lambda: self.insert_text("Arg("))
        self.config_btn(9, 1, "Conjg", lambda: self.insert_text("Conjg("))
        self.config_btn(9, 2, "r∠θ", lambda: self.insert_text("∠"))

    def _setup_eqn_grid(self):
        btn_bg = "#2e4a3d" 
        self.config_btn(3, 0, "SOLVE", self.on_solve, bg="#50fa7b", fg="black")
        self.config_btn(3, 1, "X", lambda: self.insert_text("X"), bg=btn_bg, fg="white")
        self.config_btn(3, 2, "=", lambda: self.insert_text("="), bg=btn_bg, fg="white")
        self.config_btn(3, 3, "a", lambda: self.insert_text("A"), bg=btn_bg, fg="white")
        self.config_btn(3, 4, "b", lambda: self.insert_text("B"), bg=btn_bg, fg="white")
        
        self.config_btn(4, 0, "c", lambda: self.insert_text("C"), bg=btn_bg, fg="white")
        self.config_btn(4, 1, "x²", lambda: self.insert_text("²"), bg=btn_bg, fg="white")
        self.config_btn(4, 2, "x³", lambda: self.insert_text("³"), bg=btn_bg, fg="white")
        self.config_btn(4, 3, "xⁿ", lambda: self.insert_text("^"), bg=btn_bg, fg="white")
        
        self.config_btn(5, 0, "(", lambda: self.insert_text("("), bg=btn_bg, fg="white")
        self.config_btn(5, 1, ")", lambda: self.insert_text(")"), bg=btn_bg, fg="white")

    def _setup_matrix_grid(self):
        self._setup_comp_grid()
        btn_bg = "#2a3b5c" 
        self.config_btn(9, 0, "Dim", lambda: self.insert_text("Dim("), bg=btn_bg)
        self.config_btn(9, 1, "Det", lambda: self.insert_text("Det("), bg=btn_bg)
        self.config_btn(9, 2, "Trn", lambda: self.insert_text("Trn("), bg=btn_bg)
        self.config_btn(9, 3, "Identity", lambda: self.insert_text("Id("), bg=btn_bg)
        self.config_btn(9, 4, "MatA", lambda: self.insert_text("MatA"), bg=btn_bg)

    def _setup_vector_grid(self):
        self._setup_comp_grid()
        btn_bg = "#5c4b2a" 
        self.config_btn(9, 0, "Dot", lambda: self.insert_text("Dot("), bg=btn_bg)
        self.config_btn(9, 1, "Cross", lambda: self.insert_text("Cross("), bg=btn_bg)
        self.config_btn(9, 2, "Angle", lambda: self.insert_text("Angle("), bg=btn_bg)
        self.config_btn(9, 3, "VctA", lambda: self.insert_text("VctA"), bg=btn_bg)
        self.config_btn(9, 4, "VctB", lambda: self.insert_text("VctB"), bg=btn_bg)

    def _setup_stat_grid(self):
        self._setup_comp_grid()
        btn_bg = "#4b2a5c" 
        self.config_btn(9, 0, "1-Var", lambda: self.insert_text("1Var("), bg=btn_bg)
        self.config_btn(9, 1, "2-Var", lambda: self.insert_text("2Var("), bg=btn_bg)
        self.config_btn(9, 2, "Reg", lambda: self.insert_text("Reg("), bg=btn_bg)
        self.config_btn(9, 3, "Sum", lambda: self.insert_text("Sum("), bg=btn_bg)
        self.config_btn(9, 4, "Data", lambda: self.insert_text("Data"), bg=btn_bg)

    def _setup_table_grid(self):
        self._setup_comp_grid()
        btn_bg = "#2a5c5c" 
        self.config_btn(9, 0, "f(x)", lambda: self.insert_text("f(X)="), bg=btn_bg)
        self.config_btn(9, 1, "g(x)", lambda: self.insert_text("g(X)="), bg=btn_bg)
        self.config_btn(9, 2, "Range", lambda: self.insert_text("Range("), bg=btn_bg)
        self.config_btn(9, 3, "X", lambda: self.insert_text("X"), bg=btn_bg)
        self.config_btn(9, 4, "TABLE", self.on_graph, bg="#00e5ff", fg="black") 

    def _setup_dist_grid(self):
        self._setup_comp_grid()
        btn_bg = "#5c2a3b" 
        self.config_btn(9, 0, "Normal", lambda: self.insert_text("NormPD("), bg=btn_bg)
        self.config_btn(9, 1, "NormCD", lambda: self.insert_text("NormCD("), bg=btn_bg)
        self.config_btn(9, 2, "Binom", lambda: self.insert_text("BinomPD("), bg=btn_bg)
        self.config_btn(9, 3, "Poisson", lambda: self.insert_text("PoissonPD("), bg=btn_bg)
        self.config_btn(9, 4, "InvN", lambda: self.insert_text("InvNorm("), bg=btn_bg)

    def _setup_basen_grid(self):
        self._setup_comp_grid()
        self.config_btn(5, 0, "AND", lambda: self.insert_text("&"))
        self.config_btn(5, 1, "OR", lambda: self.insert_text("|"))
        self.config_btn(5, 2, "XOR", lambda: self.insert_text("^"))
        self.config_btn(5, 3, "NOT", lambda: self.insert_text("~"))
        self.config_btn(5, 4, "DEC", lambda: self.set_base('DEC'))
        
        self.config_btn(9, 0, "HEX", lambda: self.set_base('HEX'))
        self.config_btn(9, 1, "BIN", lambda: self.set_base('BIN'))
        self.config_btn(9, 2, "OCT", lambda: self.set_base('OCT'))
        self.set_base(self.base_n_state)

    def set_base(self, base):
        self.base_n_state = base
        self.add_step(f"BASE-N: {base}")
        self.update_status()
        for k in ["2","3","4","5","6","7\n(CONST)","8","9\n(RESET)"]:
            if k in self.keypad_btns: self.keypad_btns[k].config(state="normal")
        if base == 'BIN':
            for k in ["2","3","4","5","6","7\n(CONST)","8","9\n(RESET)"]:
                if k in self.keypad_btns: self.keypad_btns[k].config(state="disabled")
        elif base == 'OCT':
            for k in ["8","9\n(RESET)"]:
                if k in self.keypad_btns: self.keypad_btns[k].config(state="disabled")

    def update_status(self):
        status = ["D"]
        status.append(self.mode)
        if self.mode == 'BASE-N': status.append(f"[{self.base_n_state}]")
        if self.shift: status.append("[SHIFT]")
        if self.alpha: status.append("[ALPHA]")
        if self.sd_mode: status.append("[S-D]")
        if self.eng_mode: status.append("[ENG]")
        if self.waiting_store: status.append("[STO]")
        self.status_var.set("   ".join(status))

    def add_step(self, step_text):
        self.steps_list.insert(tk.END, step_text)
        self.steps_list.yview(tk.END)
        if self.sidebar_state != "history":
            self.btn_history.config(fg="#00e5ff")
            self.root.after(400, lambda: self.btn_history.config(fg="#a6accd") if self.sidebar_state != "history" else None)

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
        self.display.insert(tk.INSERT, txt)
        self.display.focus_set()

    def clear_entry(self):
        self.display.delete(0, tk.END)
        self.display.focus_set()

    def delete_one(self):
        idx = self.display.index(tk.INSERT)
        if idx > 0:
            self.display.delete(idx - 1)
        self.display.focus_set()

    def toggle_shift(self):
        self.shift = not self.shift
        self.sci_btns[(2,0)].config(bg="#cca12b" if self.shift else "#3b4252", fg="black" if self.shift else "white")
        self.update_status()

    def toggle_alpha(self):
        self.alpha = not self.alpha
        self.sci_btns[(2,1)].config(bg="#cc3333" if self.alpha else "#3b4252")
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
                self.display.focus_set()
                
        listbox.bind("<<ListboxSelect>>", on_select)

    def switch_mode_menu(self):
        w = tk.Toplevel(self.root)
        w.title("MODE SELECTION")
        w.geometry("300x550")
        w.configure(bg="#1e1e2f")
        w.transient(self.root)
        w.grab_set()
        
        tk.Label(w, text="Select Mode", font=("Segoe UI", 16, "bold"), bg="#1e1e2f", fg="#00e5ff").pack(pady=10)
        
        modes = [
            ("1: COMP", 'COMP'),
            ("2: CMPLX", 'CMPLX'),
            ("3: BASE-N", 'BASE-N'),
            ("4: MATRIX", 'MATRIX'),
            ("5: VECTOR", 'VECTOR'),
            ("6: STAT", 'STAT'),
            ("7: EQN", 'EQN'),
            ("8: TABLE (Graph)", 'TABLE'),
            ("9: DIST", 'DIST')
        ]
        
        def set_mode(m):
            self.switch_mode(m)
            w.destroy()
            
        for text, mode_val in modes:
            b = tk.Button(w, text=text, font=("Segoe UI", 11, "bold"), bg="#252538", fg="#ffffff", 
                          relief="flat", activebackground="#4d4d73", activeforeground="white",
                          command=lambda m=mode_val: set_mode(m), cursor="hand2", takefocus=0)
            b.pack(fill="x", padx=40, pady=3, ipady=3)
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
        self.switch_mode('COMP')
        self.sd_mode = False
        self.eng_mode = False
        self.history.clear()
        self.steps_list.delete(0, tk.END)
        self.clear_entry()
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
            self.sci_btns[(2,1)].config(bg="#3b4252")
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
        self.display.focus_set()

    def on_solve(self):
        expr = self.display.get()
        expr = re.sub(r'\b[xX]\b', 'X', expr)
        expr = re.sub(r'\b[yY]\b', 'Y', expr)

        if "=" not in expr: func_str = expr
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
                except: break
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
            
        self.display.focus_set()

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
                if np.isscalar(Z): Z = np.full_like(X_grid, Z)
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

        s = s.replace("²", "**2").replace("³", "**3").replace("⁻¹", "**-1")
        s = s.replace("√(", "sqrt(")
        s = s.replace("∠", "*exp(1j*")
        s = s.replace("^", "**")
        
        s = re.sub(r'∫\(([^,]+),\s*([^,]+),\s*([^)]+)\)', r'num_int("\1", \2, \3)', s)
        s = re.sub(r'd/dx\(([^,]+),\s*([^)]+)\)', r'num_deriv("\1", \2)', s)
        
        old_s = ""
        while old_s != s:
            old_s = s
            s = re.sub(r'(\d+(?:\.\d+)?|\b[A-FXYM]\b|\))\s*([A-FXYM]\b|\bpi\b|\be\b|\(|sin\b|cos\b|tan\b|log\b|ln\b|sqrt\b|Arg\b|Conjg\b)', r'(\1*\2)', s)
        
        if self.mode == 'BASE-N':
            # Handle bitwise and hex logic here if needed, but python eval handles &, |, ^, ~ fine
            pass

        s = re.sub(r'\b(\d+\.\d+|\d+)\b', r'Decimal("\1")', s)
        s = re.sub(r'\bi\b', r'1j', s)
        
        return s

    def _get_env(self):
        env = dict(self.safe_funcs)
        env.update(self.vars)
        env['ans'] = self.ans
        if self.mode == 'CMPLX':
            env['i'] = 1j
        return env

    def _safe_eval(self, expr):
        if not expr.strip(): return Decimal('0'), ""
        try:
            self.add_step(f"Input: {expr}")
            vars_in_expr = set(re.findall(r'\b[A-FXYM]\b', expr))
            if vars_in_expr:
                sub_str = ", ".join(f"{v}={self.vars[v]}" for v in sorted(vars_in_expr))
                self.add_step(f"Substituted: {sub_str}")
                
            s = self.preprocess_expression(expr)
            self.add_step(f"Parsed: {s}")
            
            env = self._get_env()
            res = eval(s, {}, env)
            
            if isinstance(res, complex) and self.mode != 'CMPLX':
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
        if self.mode == 'TABLE':
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
        self.display_result(val, source_expr=expr)
        
    def display_result(self, val, source_expr=""):
        self.display.delete(0, tk.END)
        # Show the input expression in the secondary label
        if source_expr:
            label_text = source_expr if len(source_expr) <= 36 else source_expr[-36:]
            self.expr_label.config(text=label_text)
        else:
            self.expr_label.config(text="")
        
        if self.mode == 'BASE-N':
            try:
                int_val = int(val)
                if self.base_n_state == 'DEC': out = str(int_val)
                elif self.base_n_state == 'HEX': out = hex(int_val)[2:].upper()
                elif self.base_n_state == 'BIN': out = bin(int_val)[2:]
                elif self.base_n_state == 'OCT': out = oct(int_val)[2:]
                self.display.insert(0, out)
                self.add_step(f"Result ({self.base_n_state}): {out}")
                self.add_step("-" * 20)
                return
            except:
                pass # Fallback to standard if it's not an int
                
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
        self.display.focus_set()

if __name__ == "__main__":
    root = tk.Tk()
    app = SmartCalculatorApp(root)
    root.mainloop()