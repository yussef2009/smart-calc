from .calculator import evaluate, explain_steps
from .plotter import plot_expression


def demo():
    examples = [
        '2 + 3 * 4',
        'sin(pi/4) + cos(pi/4)',
        'log(10)',
        'sqrt(16) + 2^3',
        '1 / (x - 1)',
    ]

    print('=== Evaluation examples ===')
    for ex in examples:
        res, err = evaluate(ex)
        print(f"{ex} -> {res}  {('(error: ' + err + ')') if err else ''}")

    print('\n=== Explain steps (numeric) ===')
    explain = explain_steps('2 + 3 * (4 - 1)')
    print('Parsed:', explain['parsed'])
    for s in explain['steps']:
        print('-', s)
    print('Result:', explain['result'])

    # Demo plot: the function shown on many scientific calculators includes trig/log
    expr = 'sin(x) + log(x)'
    try:
        print(f"Creating plot for {expr} -> backend/plot_demo.png")
        plot_expression(expr, filename='backend/plot_demo.png', x_min=0.1, x_max=10)
        print('Plot saved to backend/plot_demo.png')
    except Exception as e:
        print('Plot error:', e)


if __name__ == '__main__':
    demo()
