import math
from typing import Any, Dict, List, Optional, Tuple

import sympy as sp

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
}


def parse_expression(expr: str) -> sp.Expr:
    """Parse a string into a sympy expression using safe locals.

    Raises SympifyError on parse problems.
    """
    return sp.sympify(expr, locals=_locals)


def evaluate(expr: str, variables: Optional[Dict[str, float]] = None) -> Tuple[Any, str]:
    """Evaluate `expr` numerically. Returns (result, error_message).

    If evaluation succeeds, error_message is empty. On error returns None plus explanation.
    """
    variables = variables or {}
    try:
        parsed = parse_expression(expr)
    except Exception as e:
        return None, f"Syntax error while parsing expression: {e}"

    # Substitute variables
    try:
        subs = {sp.Symbol(k): v for k, v in variables.items()}
        evaluated = parsed.subs(subs)
        numeric_eval = sp.N(evaluated)
        # Try converting to Python numeric types (float/complex)
        try:
            comp = complex(numeric_eval)
        except Exception:
            try:
                val = float(numeric_eval)
                return val, ""
            except Exception:
                return None, f"Could not evaluate numerically: {numeric_eval}"
        else:
            if abs(comp.imag) < 1e-12:
                return comp.real, ""
            return comp, ""
    except Exception as e:
        # Provide a helpful hint for domain errors and common issues
        msg = str(e)
        if 'log' in msg or 'sqrt' in msg:
            hint = 'Domain error: check input domain (e.g. log(x) requires x>0).'
        else:
            hint = 'Evaluation error: check expression syntax and variables.'
        return None, f"{msg} — {hint}"


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
    print('Calculator backend module. Use functions evaluate() and explain_steps().')
