import math
from typing import Optional

import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import sympy as sp


def plot_expression(expr: str, filename: str = 'plot.png', x_min: float = -10, x_max: float = 10, points: int = 1000) -> Optional[str]:
    """Plot expression in variable `x` and save to filename.

    Returns the filename on success or None on failure.
    """
    try:
        parsed = sp.sympify(expr, locals={'ln': sp.log})
    except Exception as e:
        raise ValueError(f"Could not parse expression for plotting: {e}")

    x = sp.Symbol('x')
    # Create a fast numeric function using numpy
    f = sp.lambdify(x, parsed, modules=['numpy', {'ln': np.log}])

    xs = np.linspace(x_min, x_max, points)
    try:
        ys = f(xs)
    except Exception:
        # Try safe evaluation pointwise to handle domain issues
        ys = np.empty_like(xs)
        ys.fill(np.nan)
        for i, xv in enumerate(xs):
            try:
                yv = f(xv)
                ys[i] = yv
            except Exception:
                ys[i] = np.nan

    # Mask invalid values
    mask = np.isfinite(ys)
    if mask.sum() == 0:
        raise ValueError('Expression produced no finite outputs on the plotting range.')

    plt.figure(figsize=(6, 4))
    plt.plot(xs[mask], ys[mask], '-b')
    plt.axhline(0, color='k', linewidth=0.5)
    plt.axvline(0, color='k', linewidth=0.5)
    plt.title(f'y = {expr}')
    plt.xlabel('x')
    plt.ylabel('y')
    plt.grid(True, linestyle='--', alpha=0.5)
    plt.tight_layout()
    plt.savefig(filename)
    plt.close()
    return filename


if __name__ == '__main__':
    print('Use plot_expression(expr, filename) to create a PNG plot for variable x.')
