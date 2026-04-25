import math
from typing import Optional, Tuple, Dict, Any
import re

import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import sympy as sp

from .calculator import calculate_optimal_domain, find_roots_and_extrema


def plot_expression(
    expr: str, 
    filename: str = 'plot.png', 
    x_min: float = -10, 
    x_max: float = 10, 
    y_min: Optional[float] = None,
    y_max: Optional[float] = None,
    points: int = 1000,
    auto_domain: bool = True
) -> Tuple[Optional[str], dict]:
    """Plot expression in variable `x` and save to filename.

    Args:
        expr: Expression string containing 'x'
        filename: Output filename
        x_min, x_max: X-axis bounds
        y_min, y_max: Y-axis bounds (auto-calculated if None)
        points: Number of sample points
        auto_domain: If True, calculate optimal domain based on function features
    
    Returns:
        (filename, plot_info) tuple. filename is None on failure.
        plot_info contains domain, range, and other metadata.
    """
    try:
        parsed = sp.sympify(expr, locals={'ln': sp.log})
    except Exception as e:
        return None, {'error': f"Could not parse expression for plotting: {e}"}

    # Calculate optimal domain if enabled
    if auto_domain:
        x_min, x_max = calculate_optimal_domain(expr, 'x', (x_min, x_max))
    
    x = sp.Symbol('x')
    # Create a fast numeric function using numpy
    try:
        f = sp.lambdify(x, parsed, modules=['numpy', {'ln': np.log}])
    except Exception as e:
        return None, {'error': f"Could not compile expression: {e}"}

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
        return None, {'error': 'Expression produced no finite outputs on the plotting range.'}

    # Calculate Y bounds if not provided
    if y_min is None or y_max is None:
        valid_ys = ys[mask]
        y_min_calc = np.min(valid_ys)
        y_max_calc = np.max(valid_ys)
        margin_y = (y_max_calc - y_min_calc) * 0.1
        if margin_y == 0:
            margin_y = 1
        if y_min is None:
            y_min = y_min_calc - margin_y
        if y_max is None:
            y_max = y_max_calc + margin_y

    # Create the plot
    plt.figure(figsize=(6, 4))
    plt.plot(xs[mask], ys[mask], '-b', linewidth=2.5)
    
    # Add axis lines at origin
    plt.axhline(0, color='k', linewidth=0.5, alpha=0.3)
    plt.axvline(0, color='k', linewidth=0.5, alpha=0.3)
    
    plt.title(f'y = {expr}', fontsize=12, fontweight='bold')
    plt.xlabel('x', fontsize=10)
    plt.ylabel('y', fontsize=10)
    plt.xlim(x_min, x_max)
    plt.ylim(y_min, y_max)
    plt.grid(True, linestyle='--', alpha=0.3)
    plt.tight_layout()
    
    try:
        plt.savefig(filename, dpi=100, facecolor='#0B0F19', edgecolor='#334155')
        plt.close()
        
        # Analyze the function for metadata
        analysis = find_roots_and_extrema(expr, 'x', (x_min, x_max))
        
        return filename, {
            'domain': (x_min, x_max),
            'range': (float(y_min), float(y_max)),
            'roots': analysis.get('roots', []),
            'extrema': analysis.get('extrema', []),
            'points_plotted': int(mask.sum()),
            'auto_domain_used': auto_domain
        }
    except Exception as e:
        return None, {'error': f"Could not save plot: {e}"}


def get_function_analysis(expr: str, x_min: float = -10, x_max: float = 10) -> dict:
    """Analyze a function to get its properties for window auto-scaling.
    
    Returns dictionary with domain, range, roots, and extrema recommendations.
    """
    try:
        analysis = find_roots_and_extrema(expr, 'x', (x_min, x_max))
        
        # Calculate suggested bounds
        opt_x_min, opt_x_max = calculate_optimal_domain(expr, 'x', (x_min, x_max))
        
        return {
            'success': True,
            'suggested_x_min': opt_x_min,
            'suggested_x_max': opt_x_max,
            'roots': analysis.get('roots', []),
            'extrema': analysis.get('extrema', []),
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'suggested_x_min': x_min,
            'suggested_x_max': x_max,
            'roots': [],
            'extrema': [],
        }

