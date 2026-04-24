# Smart Calculator

A full-stack calculator application with a modern React TypeScript frontend and Python backend for advanced mathematical operations, expression evaluation, step-by-step explanations, and plotting capabilities.

## 📋 Project Overview

**Smart Calculator** is a sophisticated calculator that combines:
- **Frontend**: React + TypeScript with Material-UI and Radix UI components
- **Backend**: Python with SymPy for symbolic mathematics, NumPy, and Matplotlib

### Features
- 🧮 Advanced expression evaluation with multiple mathematical functions
- 📊 Step-by-step evaluation explanation
- 📈 Expression plotting with interactive graphs
- 🎨 Modern, responsive UI with Material-UI components
- 🔄 Full-stack integration with Python backend

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have installed:
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.8 or higher) - [Download](https://www.python.org/)
- **Git** - [Download](https://git-scm.com/)

### Project Structure

```
smart-calc/
├── smart calc 2/
│   ├── src/                    # React frontend source
│   ├── backend/                # Python backend
│   │   ├── calculator.py       # Expression evaluation & step-by-step
│   │   ├── plotter.py          # Graph plotting
│   │   ├── requirements.txt    # Python dependencies
│   │   └── run_demo.py         # Demo script
│   ├── package.json            # Node.js dependencies
│   └── vite.config.js          # Vite configuration
```

---

## 💻 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yussef2009/smart-calc.git
cd smart-calc
```

### 2. Frontend Setup (Node.js)

Navigate to the project directory and install Node dependencies:

```bash
cd "smart calc 2"
npm install
```

**Dependencies include:**
- React 18.3.1 & React-DOM
- Vite 6.3.5 (build tool)
- Material-UI (MUI) 7.3.5
- Radix UI components
- TailwindCSS 4.1.12
- Recharts for data visualization
- MathJS for math operations

### 3. Backend Setup (Python)

#### Option A: Using Python Virtual Environment

```bash
# From the "smart calc 2" directory
python -m venv .venv

# Activate virtual environment
# On Windows:
.venv\Scripts\activate

# On macOS/Linux:
source .venv/bin/activate

# Install Python dependencies
pip install -r backend/requirements.txt
```

**Python Dependencies:**
- **sympy** (≥1.9) - Symbolic mathematics
- **numpy** (≥1.22) - Numerical computing
- **matplotlib** (≥3.5) - Plotting library

#### Option B: Using PowerShell on Windows

If you're on Windows, use the included PowerShell helper:

```powershell
.
un_backend.ps1
```

---

## ▶️ Running the Application

### Start the Frontend Development Server

```bash
npm run dev
```
if npm run dev doesn't work try press F5 or debugging button

This will:
- Start the Vite dev server
- Open your default browser automatically
- Serve the app at **http://localhost:5173/**

⚠️ **Important**: Do NOT open `index.html` via VS Code webview or `file://` protocol. The app must be loaded from the HTTP dev server.

### Start the Backend

Choose one of these methods:

#### Method 1: Direct Python Command
```bash
python -m backend.run_demo
```

#### Method 2: PowerShell Helper (Windows)
```powershell
.
un_backend.ps1
```

#### Method 3: NPM Helper
```bash
npm run backend:demo
```

---

## 📚 Backend Features

### Calculator Module (`backend/calculator.py`)

Provides mathematical expression evaluation with error handling:

```python
from backend.calculator import evaluate, explain_steps

# Evaluate an expression
result, error = evaluate("2 + 2 * sin(pi/2)")

# Get step-by-step explanation
steps = explain_steps("x^2 + 3x - 5", variables={"x": 2})
```

**Supported Functions:**
- Trigonometric: `sin`, `cos`, `tan`, `asin`, `acos`, `atan`
- Hyperbolic: `sinh`, `cosh`, `tanh`
- Logarithmic: `log`, `ln`, `log10`
- Other: `sqrt`, `abs`, `exp`, `factorial`, `binom`

### Plotter Module (`backend/plotter.py`)

Generate plots for mathematical expressions:

```python
from backend.plotter import plot_expression

# Create and save a plot
plot_expression("sin(x) * cos(x)", filename="plot.png", x_min=-2*pi, x_max=2*pi)
```

---

## 🛠️ Available NPM Scripts

```bash
npm run dev          # Start development server (opens browser)
npm run build        # Build for production
npm run backend:demo # Run Python backend demo (requires venv)
```

---

## 🔧 Configuration

### Frontend Configuration
- **Vite Config**: `vite.config.js` - Build and dev server settings
- **Tailwind**: `tailwind.config.js` - Styling configuration
- **React**: `vite.config.js` has React plugin settings

### Backend Configuration
The Python backend can be extended by modifying:
- `backend/calculator.py` - Add more functions to `_locals` dictionary
- `backend/plotter.py` - Customize plot styling and ranges

---

## 📖 Usage Examples

### Frontend
The React app provides an interactive interface to:
1. Enter mathematical expressions
2. View evaluation results
3. See step-by-step breakdown
4. Display graphs for expressions with variable `x`

### Backend API

#### Evaluate Expression
```python
result, error_msg = evaluate("3 + 4 * 2")  # Returns: (11.0, "")
```

#### Get Explanation
```python
info = explain_steps("sqrt(16)")
# Returns: {'parsed': 'sqrt(16)', 'steps': [...], 'result': 4.0, 'error': ''}
```

#### Plot Expression
```python
plot_expression("sin(x)", filename="sine_plot.png")
```

---

## ⚙️ Troubleshooting

### Issue: Port 5173 already in use
```bash
# Vite will automatically use the next available port
npm run dev
```

### Issue: Python module not found
Make sure your virtual environment is activated:
```bash
# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate
```

### Issue: `npm: command not found`
Install Node.js from https://nodejs.org/

### Issue: `python: command not found`
Install Python from https://www.python.org/

---

## 📦 Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

---

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

---

## 📄 License

This project is open source and available under the MIT License.

---

## 📞 Support

For issues or questions:
1. Check the [GitHub Issues](https://github.com/yussef2009/smart-calc/issues)
2. Review the backend README at `smart calc 2/backend/README.md`
3. Check the original quick start guide in the project

Happy calculating! 🎉
