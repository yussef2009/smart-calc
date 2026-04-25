import math
from typing import Any, Dict, List, Optional, Tuple, Set
from decimal import Decimal, getcontext
import re

import sympy as sp
import numpy as np

# Set high precision for decimal calculations
getcontext().prec = 50

# Local mapping for common calculator function names
_locals = {
    'sin': sp.sin,
    'cos': sp.cos,
    'tan': sp.tan,
    'asin': sp.asin,
    'acos': sp.acos,
    'atan': sp.atan,
    'sinh': sp.sinh,
    'cosh': sp.cosh,
    'tanh': sp.tanh,
    'log': sp.log,      # natural log by default
    'ln': sp.log,
    'log10': lambda x: sp.log(x, 10),
    'sqrt': sp.sqrt,
    'abs': sp.Abs,
    'exp': sp.exp,
    'factorial': sp.factorial,
    'binom': sp.binomial,
    'I': sp.I,  # Imaginary unit for complex numbers
    'oo': sp.oo,  # Infinity
}


def detect_variables(expr: str) -> Set[str]:
    """Detect all variables (A-F, X, Y, M) in an expression.
    
    Returns a set of variable names (uppercase).
    """
    # Pattern matches single uppercase letters A-F, X, Y, M
    pattern = r'\b([A-FM-YA-F])\b'
    # More specifically, match calculator variables
    calc_vars = set(re.findall(r'[A-FM-YA-F]', expr))
    # Filter to only known calculator variables
    known_vars = {'A', 'B', 'C', 'D', 'E', 'F', 'X', 'Y', 'M'}
    return calc_vars & known_vars


def numerical_derivative(expr: str, var: str = 'x', at_point: Optional[float] = None) -> Tuple[Any, str]:
    """Compute numerical derivative using central difference method.
    
    Args:
        expr: Expression string
        var: Variable to differentiate with respect to
        at_point: Point to evaluate derivative at (if None, returns symbolic derivative)
    
    Returns:
        (result, error_message) tuple
    """
    try:
        parsed = parse_expression(expr)
        x = sp.Symbol(var)
        
        # Compute symbolic derivative
        deriv = sp.diff(parsed, x)
        
        if at_point is not None:
            # Evaluate at specific point
            deriv_func = sp.lambdify(x, deriv, 'numpy')
            try:
                result = float(deriv_func(at_point))
                return result, ""
            except Exception as e:
                return None, f"Cannot evaluate derivative at {var}={at_point}: {e}"
        else:
            # Return symbolic form
            return str(deriv), ""
    except Exception as e:
        return None, f"Differentiation error: {e}"


def numerical_integration(expr: str, var: str = 'x', lower: float = 0, upper: float = 1, 
                         n_points: int = 1000) -> Tuple[Any, str]:
    """Compute numerical integration using Simpson's rule.
    
    Args:
        expr: Expression string
        var: Variable to integrate with respect to
        lower: Lower bound
        upper: Upper bound
        n_points: Number of points for Simpson's rule
    
    Returns:
        (result, error_message) tuple
    """
    try:
        parsed = parse_expression(expr)
        x = sp.Symbol(var)
        
        # Create lambdify function for numerical integration
        f = sp.lambdify(x, parsed, 'numpy')
        
        # Use Simpson's rule for numerical integration
        h = (upper - lower) / (n_points - 1)
        xs = np.linspace(lower, upper, n_points)
        ys = np.array([float(f(xi)) for xi in xs], dtype=float)
        
        # Simpson's rule
        integral = (h / 3.0) * (ys[0] + 4 * np.sum(ys[1:-1:2]) + 2 * np.sum(ys[2:-1:2]) + ys[-1])
        
        return float(integral), ""
    except Exception as e:
        return None, f"Integration error: {e}"


def summation(expr: str, var: str = 'n', start: int = 1, end: int = 10) -> Tuple[Any, str]:
    """Compute summation (Σ) from start to end.
    
    Args:
        expr: Expression string with variable
        var: Variable name
        start: Start value (inclusive)
        end: End value (inclusive)
    
    Returns:
        (result, error_message) tuple
    """
    try:
        total = 0
        for i in range(start, end + 1):
            parsed = parse_expression(expr.replace(var, str(i)))
            val, err = evaluate(str(parsed))
            if err:
                return None, f"Error in summation at {var}={i}: {err}"
            total += val
        return total, ""
    except Exception as e:
        return None, f"Summation error: {e}"


def product(expr: str, var: str = 'n', start: int = 1, end: int = 10) -> Tuple[Any, str]:
    """Compute product (Π) from start to end.
    
    Args:
        expr: Expression string with variable
        var: Variable name
        start: Start value (inclusive)
        end: End value (inclusive)
    
    Returns:
        (result, error_message) tuple
    """
    try:
        prod = 1
        for i in range(start, end + 1):
            parsed = parse_expression(expr.replace(var, str(i)))
            val, err = evaluate(str(parsed))
            if err:
                return None, f"Error in product at {var}={i}: {err}"
            prod *= val
        return prod, ""
    except Exception as e:
        return None, f"Product error: {e}"


def find_roots_and_extrema(expr: str, var: str = 'x', bounds: Tuple[float, float] = (-10, 10)) -> Dict[str, Any]:
    """Find roots and extrema of an expression for domain optimization.
    
    Args:
        expr: Expression string
        var: Variable name
        bounds: Search bounds
    
    Returns:
        Dictionary with 'roots', 'extrema', and 'discontinuities'
    """
    try:
        parsed = parse_expression(expr)
        x = sp.Symbol(var)
        
        roots = []
        extrema = []
        discontinuities = []
        
        # Try to find roots
        try:
            root_solutions = sp.solve(parsed, x)
            for root in root_solutions:
                try:
                    r = float(root)
                    if bounds[0] <= r <= bounds[1]:
                        roots.append(r)
                except:
                    pass
        except:
            pass
        
        # Find extrema by solving derivative = 0
        try:
            deriv = sp.diff(parsed, x)
            critical_points = sp.solve(deriv, x)
            for cp in critical_points:
                try:
                    cp_val = float(cp)
                    if bounds[0] <= cp_val <= bounds[1]:
                        extrema.append(cp_val)
                except:
                    pass
        except:
            pass
        
        return {
            'roots': sorted(set(roots)),
            'extrema': sorted(set(extrema)),
            'discontinuities': discontinuities,
            'bounds': bounds
        }
    except Exception as e:
        return {
            'roots': [],
            'extrema': [],
            'discontinuities': [],
            'bounds': bounds,
            'error': str(e)
        }


def calculate_optimal_domain(expr: str, var: str = 'x', initial_bounds: Tuple[float, float] = (-10, 10)) -> Tuple[float, float]:
    """Calculate an optimal viewing domain based on function features.
    
    Returns:
        (xmin, xmax) tuple
    """
    try:
        analysis = find_roots_and_extrema(expr, var, initial_bounds)
        
        all_points = analysis['roots'] + analysis['extrema']
        
        if all_points:
            min_val = min(all_points)
            max_val = max(all_points)
            
            # Expand domain by 30% on each side
            margin = (max_val - min_val) * 0.3
            if margin < 0.5:  # Ensure minimum margin
                margin = 1
            
            return (min_val - margin, max_val + margin)
        
        return initial_bounds
    except:
        return initial_bounds



from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application, convert_xor

def parse_expression(expr: str) -> sp.Expr:
    """Parse a string into a sympy expression using safe locals.

    Raises SympifyError on parse problems.
    """
    # Expand the locals for special functions
    locals_copy = _locals.copy()
    
    # Add support for special notation
    if 'Σ' in expr or 'sum(' in expr:
        locals_copy['sum'] = sp.summation
    if 'Π' in expr or 'product(' in expr or 'prod(' in expr:
        locals_copy['product'] = lambda *args: sp.prod([args])
    
    # Use standard transformations plus implicit multiplication and XOR (^) as power
    transformations = (standard_transformations + (implicit_multiplication_application, convert_xor))
    
    return parse_expr(expr, local_dict=locals_copy, transformations=transformations)


def evaluate(expr: str, variables: Optional[Dict[str, float]] = None) -> Tuple[Any, str]:
    """Evaluate `expr` numerically. Returns (result, error_message).

    If evaluation succeeds, error_message is empty. On error returns None plus explanation.
    Handles complex numbers, variables, and provides precise error messages.
    """
    variables = variables or {}
    try:
        parsed = parse_expression(expr)
    except Exception as e:
        return None, f"Syntax Error: {str(e)}"

    # Substitute variables
    try:
        subs = {sp.Symbol(k): float(v) for k, v in variables.items()}
        evaluated = parsed.subs(subs)
        
        # Check for domain errors before numeric evaluation
        numeric_eval = sp.N(evaluated)
        
        # Try converting to Python numeric types (float/complex)
        try:
            comp = complex(numeric_eval)
        except Exception:
            try:
                val = float(numeric_eval)
                return val, ""
            except Exception:
                return None, f"Math Error: Could not evaluate to number"
        else:
            # Return complex if has significant imaginary part, otherwise real
            if abs(comp.imag) < 1e-12:
                return float(comp.real), ""
            return comp, ""
    except ZeroDivisionError:
        return None, "Math Error: Division by zero"
    except ValueError as e:
        msg = str(e).lower()
        if 'log' in msg or 'negative' in msg:
            return None, "Math Error: Domain error (log of negative number or sqrt of negative)"
        if 'asin' in msg or 'acos' in msg:
            return None, "Math Error: Domain error (asin/acos requires [-1, 1])"
        return None, f"Math Error: {str(e)}"
    except Exception as e:
        msg = str(e).lower()
        if 'division' in msg:
            return None, "Math Error: Division by zero"
        if 'log' in msg or 'sqrt' in msg:
            return None, "Math Error: Domain error"
        return None, f"Math Error: {str(e)}"


def _eval_and_steps(expr: Any, subs: Dict[Any, float]) -> Tuple[Any, List[str]]:
    """Recursively evaluate a sympy expression and collect step-by-step strings.

    This is a lightweight evaluator that computes sub-expressions and records steps.
    """
    steps: List[str] = []

    def _rec(e: Any) -> Any:
        # Plain python numeric types
        if isinstance(e, (int, float)):
            return e
        if isinstance(e, complex):
            return e

        # SymPy numeric
        if getattr(e, 'is_Number', False):
            try:
                return float(sp.N(e))
            except Exception:
                try:
                    c = complex(sp.N(e))
                    return c.real if abs(c.imag) < 1e-12 else c
                except Exception:
                    return e

        # Symbol lookup
        if getattr(e, 'is_Symbol', False):
            if e in subs:
                return subs[e]
            raise ValueError(f"Unknown variable: {e}")

        # Evaluate args first
        args_vals = []
        for a in getattr(e, 'args', ()):  # safe access
            val = _rec(a)
            args_vals.append(val)

        # Now compute this node
        try:
            # For common operations use python math where possible for readable results
            if getattr(e, 'func', None) == sp.Add:
                res = sum(args_vals)
                steps.append(f"Add operands {args_vals} → {res}")
                return res
            if getattr(e, 'func', None) == sp.Mul:
                prod = 1
                for v in args_vals:
                    prod *= v
                steps.append(f"Multiply operands {args_vals} → {prod}")
                return prod
            if getattr(e, 'func', None) == sp.Pow or isinstance(e, sp.Pow):
                base, exp = args_vals
                res = base ** exp
                steps.append(f"Power: {base}^{exp} → {res}")
                return res
            # functions
            # fallback evaluate numerically
            try:
                val = sp.N(e.subs(subs))
            except Exception:
                val = e.subs(subs)

            try:
                fval = float(val)
                steps.append(f"Evaluate {str(e)} → {fval}")
                return fval
            except Exception:
                try:
                    cval = complex(val)
                    if abs(cval.imag) < 1e-12:
                        steps.append(f"Evaluate {str(e)} → {cval.real}")
                        return cval.real
                    steps.append(f"Evaluate {str(e)} → {cval}")
                    return cval
                except Exception:
                    steps.append(f"Evaluate {str(e)} → {val}")
                    return val
        except Exception:
            # generic fallback
            val = float(sp.N(e.subs(subs)))
            steps.append(f"Evaluate {str(e)} → {val}")
            return val

    result = _rec(sp.sympify(expr)) if isinstance(expr, str) else _rec(expr)
    return result, steps


def explain_steps(expr: str, variables: Optional[Dict[str, float]] = None) -> Dict[str, Any]:
    """Return a dictionary with structured explanation and possible issues.

    Keys:
    - `parsed`: sympy expression as string
    - `steps`: list of step strings describing evaluation
    - `result`: numeric result when possible
    - `error`: empty or an explanatory message
    """
    variables = variables or {}
    try:
        parsed = parse_expression(expr)
    except Exception as e:
        return {
            'parsed': None,
            'steps': [],
            'result': None,
            'error': f"Syntax error: {e}",
        }

    # If expression is symbolic with variables, show simplification step
    out = {'parsed': str(parsed), 'steps': [], 'result': None, 'error': ''}

    try:
        # If there are variables provided, evaluate numerically and show breakdown
        subs = {sp.Symbol(k): v for k, v in variables.items()}
        result, steps = _eval_and_steps(parsed, subs)
        out['steps'] = steps
        out['result'] = result
        return out
    except Exception as e:
        # Fall back to showing simplification
        try:
            simplified = sp.simplify(parsed)
            out['steps'] = [f"Simplify: {parsed} → {simplified}"]
            out['result'] = None
            out['error'] = f"Could not fully evaluate numerically: {e}"
            return out
        except Exception as e2:
            out['error'] = f"Evaluation error: {e} | simplify failed: {e2}"
            return out


if __name__ == '__main__':
    print('Calculator backend module.')
    print('Available functions:')
    print('  - evaluate(expr, variables) -> (result, error_message)')
    print('  - explain_steps(expr, variables) -> dict with parsed, steps, result, error')
    print('  - detect_variables(expr) -> set of variables')
    print('  - numerical_derivative(expr, var, at_point)')
    print('  - numerical_integration(expr, var, lower, upper)')
    print('  - summation(expr, var, start, end)')
    print('  - product(expr, var, start, end)')
    print('  - find_roots_and_extrema(expr, var, bounds)')
    print('  - calculate_optimal_domain(expr, var, initial_bounds)')
