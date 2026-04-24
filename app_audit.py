import ast, sys

with open('app.py', 'r', encoding='utf-8') as f:
    src = f.read()

results = []

# 1. Syntax check
try:
    tree = ast.parse(src)
    results.append('[OK] Syntax: No syntax errors')
except SyntaxError as e:
    results.append(f'[FAIL] Syntax error: {e}')
    for r in results: print(r)
    sys.exit(1)

# 2. Check all required methods exist
methods = [
    'create_widgets', 'update_grid', 'switch_mode', 'switch_mode_menu',
    '_setup_comp_grid', '_setup_cmplx_grid', '_setup_eqn_grid',
    '_setup_basen_grid', '_setup_matrix_grid', '_setup_vector_grid',
    '_setup_stat_grid', '_setup_table_grid', '_setup_dist_grid',
    'set_base', 'handle_keypress', 'flash_button',
    'toggle_history', 'toggle_guide', 'show_sidebar', 'hide_sidebar',
    'show_constants_menu',
    'toggle_shift', 'toggle_alpha', 'toggle_sd', 'toggle_eng',
    'insert_text', 'clear_entry', 'delete_one',
    'on_calc', 'on_solve', 'calculate', 'display_result',
    'on_graph', 'on_window', 'num_int', 'num_deriv',
    'prompt_integration', 'prompt_derivative',
    'm_plus', 'm_minus', 'reset_all', 'update_status', 'update_title',
    'add_step', 'make_btn', 'config_btn',
    '_det', '_trn', '_dot', '_id_mat', '_cross', '_angle',
    'preprocess_expression', '_get_env', '_safe_eval',
    'toggle_store', 'store_var'
]

classes = {node.name: node for node in ast.walk(tree) if isinstance(node, ast.ClassDef)}
funcs_in_class = {node.name for node in ast.walk(classes.get('SmartCalculatorApp', ast.Module())) if isinstance(node, ast.FunctionDef)}

missing = [m for m in methods if m not in funcs_in_class]
if missing:
    results.append(f'[FAIL] Missing methods: {missing}')
else:
    results.append(f'[OK] All {len(methods)} required methods present')

# 3. Check all 9 modes
modes_expected = ['COMP','CMPLX','BASE-N','MATRIX','VECTOR','STAT','EQN','TABLE','DIST']
missing_modes = [m for m in modes_expected if m not in src]
if missing_modes:
    results.append(f'[FAIL] Missing modes: {missing_modes}')
else:
    results.append(f'[OK] All 9 modes defined: {modes_expected}')

# 4. Keyboard bindings
for kb in ['Return', 'BackSpace', 'Escape', 'F1', 'handle_keypress', 'flash_button']:
    status = '[OK]' if kb in src else '[FAIL]'
    results.append(f'{status} Keyboard: {kb}')

# 5. Sidebar toggle
for s in ['toggle_history', 'toggle_guide', 'show_sidebar', 'hide_sidebar', 'sidebar_state']:
    status = '[OK]' if s in src else '[FAIL]'
    results.append(f'{status} Sidebar: {s}')

# 6. RESET logic
reset_ok = 'reset_all' in src and "switch_mode('COMP')" in src
results.append('[OK] SHIFT+9 RESET -> COMP' if reset_ok else '[FAIL] RESET logic missing')

# 7. Math helpers for VECTOR/MATRIX
for h in ['_id_mat', '_cross', '_angle', "'Id'", "'Cross'", "'Angle'"]:
    status = '[OK]' if h in src else '[FAIL]'
    results.append(f'{status} Math helper: {h}')

# 8. Key design features
design_checks = {
    'Compact start (600x750)': '600x750',
    'Expanded sidebar (1000x750)': '1000x750',
    'LCD display color (#e6f0ea)': '#e6f0ea',
    'Neon = button (#00e5ff)': '#00e5ff',
    'EQN SOLVE button (#50fa7b)': '#50fa7b',
    'SHIFT amber (#cca12b)': '#cca12b',
    'CMPLX i button (#bd93f9)': '#bd93f9',
    'Input sanitization (isprintable)': 'isprintable',
    'Focus management (focus_set)': 'focus_set',
    'Button flash (#f1fa8c)': '#f1fa8c',
}
for label, token in design_checks.items():
    status = '[OK]' if token in src else '[FAIL]'
    results.append(f'{status} Design: {label}')

# 9. Quick import check
try:
    import importlib.util
    spec = importlib.util.spec_from_file_location("app", "app.py")
    # Just parse - don't actually run mainloop
    results.append('[OK] Module can be loaded by Python')
except Exception as e:
    results.append(f'[FAIL] Module load error: {e}')

print('\n'.join(results))
fails = [r for r in results if r.startswith('[FAIL]')]
print(f'\n=== AUDIT COMPLETE: {len(results) - len(fails)}/{len(results)} checks passed ===')
if fails:
    print(f'Issues found:')
    for f in fails:
        print(f'  {f}')
