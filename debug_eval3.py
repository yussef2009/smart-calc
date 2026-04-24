import traceback
def try_eval(globals_dict, locals_dict):
    try:
        print('-> globals:', globals_dict)
        eval('1/(x-1)', globals_dict, locals_dict)
    except Exception as e:
        traceback.print_exc()
        print('ERR:', type(e), e)

print('Test 1: __builtins__ = None')
try_eval({'__builtins__': None}, {})
print('\nTest 2: globals = {}')
try_eval({}, {})
print('\nTest 3: __builtins__ = {}')
try_eval({'__builtins__': {}}, {})
