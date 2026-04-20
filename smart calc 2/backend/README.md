Calculator backend

This folder contains a Python backend for a calculator app. It provides:
- `calculator.py`: parse, evaluate, and produce step-by-step explanations and error diagnostics.
- `plotter.py`: draw a plot for an expression in variable `x` and save to PNG.
- `run_demo.py`: small demo that shows evaluation, explanation, and produces a plot.

Install dependencies:

pip install -r backend/requirements.txt

Usage examples (from host UI):
- Call `evaluate(expr)` to get numeric result and error info.
- Call `explain_steps(expr)` to receive a list of human-readable steps explaining evaluation.
- Call `plot_expression(expr, filename)` to generate `filename` with the plot for variable `x`.
