import { useState, useEffect, useRef } from 'react';
import * as math from 'mathjs';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { 
  Activity, Calculator, History, Check, X, 
  Terminal, BookOpen, Settings, AlertCircle, 
  Trash2, ChevronDown, Layers,
  LogOut
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from './lib/AuthContext';
import { AuthModal } from './components/AuthModal';
import { LoginPage } from './components/LoginPage';
import { saveHistoryToFirestore, fetchHistoryFromFirestore } from './lib/historyService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = 'graph' | 'steps' | 'history' | 'guide';
type CalcMode = 'COMP' | 'CMPLX' | 'BASE-N' | 'MATRIX' | 'VECTOR' | 'STAT' | 'EQN' | 'TABLE' | 'DIST' | 'LIMIT';

interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

interface Step {
  title: string;
  desc: string;
}

interface WindowSettings {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

interface CalculatorButton {
  label: string;
  val?: string;
  action?: () => void;
  shiftLabel?: string;
  shiftVal?: string;
  shiftAction?: () => void;
  alphaLabel?: string;
  alphaVal?: string;
  alphaAction?: () => void;
  type?: 'num' | 'ctrl' | 'op';
}

export default function App() {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');
  const [ans, setAns] = useState('0');
  
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('steps');
  const [isShift, setIsShift] = useState(false);
  const [isAlpha, setIsAlpha] = useState(false);
  
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [graphData, setGraphData] = useState<any[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  
  // New state for variable substitution
  const [detectedVars, setDetectedVars] = useState<string[]>([]);
  const [varValues, setVarValues] = useState<Record<string, string>>({});
  const [showVarPrompt, setShowVarPrompt] = useState(false);
  const [currentVarIndex, setCurrentVarIndex] = useState(0);
  
  // New state for calculator modes
  const [calcMode, setCalcMode] = useState<CalcMode>('COMP');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // New state for window settings
  const [windowSettings, setWindowSettings] = useState<WindowSettings>({
    xMin: -10,
    xMax: 10,
    yMin: -10,
    yMax: 10
  });
  const [showWindowSettings, setShowWindowSettings] = useState(false);
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [tempWindowSettings, setTempWindowSettings] = useState<WindowSettings>(windowSettings);
  
  // Auth state
  const { user, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const displayRef = useRef<HTMLDivElement>(null);

  // Auto-scroll display to right when typing long equations
  useEffect(() => {
    if (displayRef.current) {
      displayRef.current.scrollLeft = displayRef.current.scrollWidth;
    }
  }, [expression]);

  // Sync history from Firestore on login
  useEffect(() => {
    const loadHistory = async () => {
      if (user) {
        const cloudHistory = await fetchHistoryFromFirestore(user.uid);
        if (cloudHistory.length > 0) {
          setHistory(cloudHistory);
        }
      }
    };
    loadHistory();
  }, [user]);

  const analyzeError = (err: any) => {
    const msg = err.message || err.toString();
    if (msg.includes('Unexpected end of expression')) {
      return "It looks like the equation is incomplete. Are you missing a closing parenthesis or a number at the end?";
    }
    if (msg.includes('Undefined symbol')) {
      const match = msg.match(/Undefined symbol (.+)/);
      const symbol = match ? match[1] : 'unknown';
      if (symbol === 'x') return "Symbol 'x' is undefined. If you want to graph this function, click the Plot button instead of equals.";
      return `The symbol '${symbol}' is not recognized. If you meant to multiply, make sure to use '*' (e.g., 2*y instead of 2y).`;
    }
    if (msg.includes('Parenthesis ) expected')) {
      return "You might have an extra or missing parenthesis.";
    }
    if (msg.includes('Value expected')) {
      return "A number or variable is expected here, but an operator was found.";
    }
    return msg;
  };

  // Detect variables in expression
  const detectVariables = (expr: string): string[] => {
    const varPattern = /\b([A-FM-YA-F])\b/g;
    const matches = expr.match(varPattern) || [];
    const knownVars = ['A', 'B', 'C', 'D', 'E', 'F', 'X', 'Y', 'M'];
    const detected = [...new Set(matches.filter(v => knownVars.includes(v)))];
    return detected.sort();
  };

  // Start variable prompting sequence
  const startVariablePrompt = (expr: string) => {
    const vars = detectVariables(expr);
    if (vars.length > 0) {
      setDetectedVars(vars);
      setVarValues({});
      setCurrentVarIndex(0);
      setShowVarPrompt(true);
    } else {
      // No variables, just calculate
      performCalculation(expr, {});
    }
  };

  // Handle variable input submission
  const submitVariableValue = () => {
    if (currentVarIndex < detectedVars.length - 1) {
      setCurrentVarIndex(currentVarIndex + 1);
    } else {
      // All variables collected - convert to proper types
      const numVarValues: Record<string, number> = {};
      for (const [key, value] of Object.entries(varValues)) {
        numVarValues[key] = typeof value === 'string' ? parseFloat(value) || 0 : value;
      }
      performCalculation(expression, numVarValues);
      setShowVarPrompt(false);
      setDetectedVars([]);
      setVarValues({});
    }
  };

  // Perform actual calculation with variables
  const performCalculation = (expr: string, variables: Record<string, number>) => {
    try {
      const scope: Record<string, any> = { 
        Ans: Number(ans) || 0,
        ...variables,
        // Add complex number support
        i: math.complex(0, 1),
      };

      // Handle Matrix/Vector definitions if they look like [1,2;3,4]
      let processedExpr = expr;
      if (processedExpr.includes('Mat') || processedExpr.includes('Vct')) {
        // Simple mock mapping for MatA, MatB, etc.
        // In a real Casio, these are stored variables. We'll support literal entry for now.
        // processedExpr = processedExpr.replace(/MatA/g, '[[1,2],[3,4]]');
      }

      let res = math.evaluate(processedExpr, scope);

      // Handle Base-N conversions if requested
      if (calcMode === 'BASE-N') {
        if (processedExpr.endsWith('bin')) {
           const val = typeof res === 'number' ? res : math.evaluate(processedExpr.replace('bin', ''), scope);
           res = '0b' + val.toString(2);
        } else if (processedExpr.endsWith('hex')) {
           const val = typeof res === 'number' ? res : math.evaluate(processedExpr.replace('hex', ''), scope);
           res = '0x' + val.toString(16).toUpperCase();
        } else if (processedExpr.endsWith('oct')) {
           const val = typeof res === 'number' ? res : math.evaluate(processedExpr.replace('oct', ''), scope);
           res = '0o' + val.toString(8);
        }
      }

      const formatRes = typeof res === 'number' 
        ? Number(res.toFixed(10)).toString() 
        : (typeof res === 'string' ? res : math.format(res, { precision: 14 }));
      
      setResult(formatRes);
      setAns(formatRes);
      generateExplanation(expr, false);
      
      setHistory(prev => [{
        id: Math.random().toString(36).substring(2, 9),
        expression: expr,
        result: formatRes,
        timestamp: Date.now()
      }, ...prev]);

      // Sync to cloud if user is logged in
      if (user) {
        saveHistoryToFirestore(user.uid, {
          expression: expr,
          result: formatRes,
          timestamp: Date.now()
        });
      }
      
      setActiveTab('steps');
      setIsSidebarOpen(true);
    } catch(err: any) {
      setResult('Error');
      setError(analyzeError(err));
      generateExplanation(expr, false);
      setActiveTab('steps');
      setIsSidebarOpen(true);
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is in an input field (to allow typing in prompt modals)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key;
      
      // Numbers
      if (/[0-9]/.test(key)) {
        handleAppend(key);
      }
      // Operators
      else if (key === '+') handleAppend('+');
      else if (key === '-') handleAppend('-');
      else if (key === '*') handleAppend('*');
      else if (key === '/') handleAppend('/');
      else if (key === '.') handleAppend('.');
      else if (key === '(') handleAppend('(');
      else if (key === ')') handleAppend(')');
      else if (key === '^') handleAppend('^');
      
      // Controls
      else if (key === 'Enter') {
        if (calcMode === 'LIMIT') handleLimit();
        else handleCalculate();
      }
      else if (key === 'Backspace') handleBackspace();
      else if (key === 'Escape') handleClear();
      else if (key.toLowerCase() === 's') setIsShift(!isShift);
      else if (key.toLowerCase() === 'a') setIsAlpha(!isAlpha);
      else if (key.toLowerCase() === 'm') handleModeButton();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expression, isShift, isAlpha, calcMode]);

  // Handle MODE button - show selection table
  const handleModeButton = () => {
    setShowModeSelection(true);
  };

  // Handle Shift+MODE - open window settings
  const handleWindowSettings = () => {
    setTempWindowSettings({ ...windowSettings });
    setShowWindowSettings(true);
  };

  // Save window settings
  const saveWindowSettings = () => {
    setWindowSettings(tempWindowSettings);
    setShowWindowSettings(false);
    // Refresh graph with new settings
    if (expression) {
      handleGraph(expression);
    }
  };


  const generateExplanation = (expr: string, isGraph: boolean | string = false) => {
    const newSteps: Step[] = [];
    try {
      // Handle text explanations (mode changes, etc.)
      if (typeof isGraph === 'string') {
        newSteps.push({ title: 'System Message', desc: expr });
        setSteps(newSteps);
        setError('');
        return;
      }

      const node = math.parse(expr);
      newSteps.push({ title: 'Parsed Expression', desc: node.toString() });
      
      if (isGraph === true) {
         newSteps.push({ title: 'Function Identified', desc: `f(x) = ${expr}` });
         newSteps.push({ title: 'Action', desc: `Plotted over domain [${windowSettings.xMin}, ${windowSettings.xMax}]` });
         setSteps(newSteps);
         setError('');
         return;
      }
      
      // Try simplification
      try {
        const simplified = math.simplify(expr).toString();
        // Simple check to see if it actually simplified it visually
        if (simplified.replace(/\s/g, '') !== expr.replace(/\s/g, '')) {
          newSteps.push({ title: 'Simplified Form', desc: simplified });
        }
      } catch(e) {
          // Ignore simplification errors
      }

      // Evaluate
      const res = math.evaluate(expr, { Ans: Number(ans) || 0 });
      
      if (typeof res === 'number' || typeof res === 'boolean' || math.isComplex(res)) {
        newSteps.push({ title: 'Final Result', desc: res.toString() });
      } else if (math.isMatrix(res) || Array.isArray(res)) {
        newSteps.push({ title: 'Matrix/Array Result', desc: math.format(res) });
      } else {
        newSteps.push({ title: 'Evaluated', desc: res.toString() });
      }
      
      setSteps(newSteps);
      setError('');
    } catch (err: any) {
      setSteps([]);
      setError(analyzeError(err));
    }
  };

  const handleGraph = (exprToGraph?: string) => {
    let targetExpr = exprToGraph || expression;
    if (!targetExpr) return;
    
    // Extract RHS if it's an equation like "Y=X^2" or "X^2=Y"
    if (targetExpr.includes('=')) {
      const parts = targetExpr.split('=');
      if (parts[0].trim().toUpperCase() === 'Y') {
        targetExpr = parts[1].trim();
      } else if (parts[1].trim().toUpperCase() === 'Y') {
        targetExpr = parts[0].trim();
      } else {
        targetExpr = parts[1].trim(); // fallback
      }
    }
    
    // Pre-process math.js syntax replacements if necessary
    // e.g., 'Ans' is handled, but what if they typed an implicit multiplication like '2X'? mathjs usually handles 2X if X is a variable.
    
    setActiveTab('graph');
    
    try {
      const compiled = math.compile(targetExpr);
      const data = [];
      const seenX = new Set();
      
      // Calculate step size based on window
      const step = (windowSettings.xMax - windowSettings.xMin) / 200;
      
      for (let x = windowSettings.xMin; x <= windowSettings.xMax + 0.001; x += step) {
        try {
          // Provide both x and X for the graph evaluation
          let y = compiled.evaluate({ x, X: x, Ans: Number(ans) || 0 });
          if (typeof y === 'number' && !isNaN(y)) {
            // Clamp y to window if specified
            if (y > windowSettings.yMax) y = windowSettings.yMax;
            if (y < windowSettings.yMin) y = windowSettings.yMin;
            const fixedX = Number(x.toFixed(2));
            if (!seenX.has(fixedX)) {
              seenX.add(fixedX);
              data.push({ x: fixedX, y });
            }
          }
        } catch(e) {
            // Ignore evaluation errors for specific points
        }
      }
      setGraphData(data);
      generateExplanation(targetExpr, true);
    } catch (err: any) {
      setGraphData([]);
      setError(`Cannot plot function: ${analyzeError(err)}`);
      setActiveTab('steps');
    }
    setIsSidebarOpen(true);
  };

  const handleAppend = (val: string) => {
    if (error) setError('');
    
    if (result) {
      if (result === 'Error' || !['+', '-', '*', '/', '^'].includes(val)) {
        // If there's an error or we start typing a number/function, start fresh
        setExpression(val);
        setResult('');
        return;
      } else {
        // If there's a result and we type an operator, continue from result
        setExpression(result + val);
        setResult('');
        return;
      }
    }
    
    setExpression(prev => prev + val);
  };

  const handleBackspace = () => {
    setExpression(prev => prev.slice(0, -1));
    if (error) setError('');
  };

  const handleClear = () => {
    setExpression('');
    setResult('');
    setError('');
    setSteps([]);
  };

  // Advanced equation solver using Grid Search + Newton-Raphson for multiple roots
  const handleSolve = () => {
    if (!expression || !expression.includes('=')) return;
    
    try {
      const [lhs, rhs] = expression.split('=');
      const f_expr = `${lhs} - (${rhs || 0})`;
      const compiled = math.compile(f_expr);
      
      // Detect the variable being solved for (e.g. X, Y, A)
      const varsInExpr = expression.match(/[A-Z]/g) || ['X'];
      const targetVar = varsInExpr[0];
      
      const getF = (val: number) => compiled.evaluate({ [targetVar]: val, x: val, X: val, Ans: Number(ans) || 0 });
      
      let roots: number[] = [];
      
      // Grid search from -50 to 50 to find multiple roots (e.g., X^2 = 4 -> X=2, X=-2)
      for (let guess = -50; guess <= 50; guess += 2) {
        let x0 = guess;
        let found = false;
        
        for (let i = 0; i < 50; i++) {
          const f_x0 = getF(x0);
          if (Math.abs(f_x0) < 1e-9) {
            found = true;
            break;
          }
          
          const h = 1e-5;
          const f_prime = (getF(x0 + h) - getF(x0 - h)) / (2 * h);
          
          if (Math.abs(f_prime) < 1e-15) break; // avoid division by zero
          
          x0 = x0 - f_x0 / f_prime;
        }
        
        if (found) {
          // Round to prevent floating point duplicates (e.g. 1.9999999 and 2.0)
          const root = Number(x0.toFixed(6));
          if (!roots.includes(root)) {
            roots.push(root);
          }
        }
      }
      
      if (roots.length > 0) {
        // Sort roots ascending
        roots.sort((a, b) => a - b);
        
        // Format result string
        let resStr = roots.map((r, i) => roots.length > 1 ? `${targetVar}${i+1}=${r}` : `${targetVar}=${r}`).join(', ');
        
        setResult(resStr);
        setAns(roots[0].toString()); // Save first root to Ans
        generateExplanation(`Solved Equation: ${expression}\nRoots Found: ${resStr}`, 'text');
      } else {
        setResult('Error');
        setError("Could not converge on a solution. The equation may have no real roots.");
      }
      setActiveTab('steps');
      setIsSidebarOpen(true);
    } catch(err: any) {
      setResult('Error');
      setError(`Cannot solve: ${analyzeError(err)}`);
      setActiveTab('steps');
      setIsSidebarOpen(true);
    }
  };

  // Evaluate Limit numerically
  const handleLimit = () => {
    if (!expression) return;
    
    let targetStr: string | null = '0';
    let mathExpr = expression;
    if (!expression.includes(',')) {
       targetStr = prompt('Calculate limit as variable approaches what value? (e.g. 0, Infinity, pi)');
       if (targetStr === null) return;
    } else {
       // If expression is "sin(x)/x, 0", parse it
       const parts = expression.split(',');
       mathExpr = parts[0];
       targetStr = parts[1].trim();
    }
    
    let target: number;
    try {
      target = Number(math.evaluate(targetStr));
    } catch {
      target = parseFloat(targetStr);
    }
    
    try {
      const compiled = math.compile(mathExpr);
      // Try to find a variable name, default to 'x'
      const targetVarMatch = mathExpr.match(/\b([a-zA-Z])\b/);
      const targetVar = targetVarMatch ? targetVarMatch[1] : 'x';
      
      const getF = (val: number) => {
        try {
          const res = compiled.evaluate({ [targetVar]: val, x: val, X: val, Ans: Number(ans) || 0 });
          if (math.typeOf(res) === 'Complex') {
            if (Math.abs(res.im) > 1e-10) return NaN;
            return res.re;
          }
          return Number(res);
        } catch {
          return NaN;
        }
      };
      
      let resStr = '';
      let isValid = false;
      let explanation = '';
      
      if (!isFinite(target)) {
        const sign = target > 0 ? 1 : -1;
        const v1 = getF(sign * 1e5);
        const v2 = getF(sign * 1e6);
        const v3 = getF(sign * 1e7);
        
        if (isNaN(v3)) {
          resStr = 'Undefined';
          isValid = true;
          explanation = `Function is undefined at large values.`;
        } else if (Math.abs(v3) > 1e10) {
           resStr = v3 > 0 || v2 > v1 ? '+∞' : '-∞';
           isValid = true;
           explanation = `Evaluated at large values: f(1e6) ≈ ${v2.toExponential(2)}, f(1e7) ≈ ${v3.toExponential(2)}\nDiverges to ${resStr}`;
        } else if (Math.abs(v3 - v2) < 1e-3) {
           resStr = Number(v3.toFixed(6)).toString();
           isValid = true;
           explanation = `Evaluated at large values: f(1e6) ≈ ${v2.toFixed(6)}, f(1e7) ≈ ${v3.toFixed(6)}\nConverges to ${resStr}`;
        } else {
           resStr = 'Undefined (oscillates)';
           isValid = true;
           explanation = `Function does not converge at ${target > 0 ? '+∞' : '-∞'}.`;
        }
      } else {
        const h = 1e-7;
        const left = getF(target - h);
        const right = getF(target + h);
        
        if (isNaN(left) || isNaN(right)) {
           // Maybe one-sided limit exists
           if (!isNaN(right)) {
             resStr = Number(right.toFixed(6)).toString();
             isValid = true;
             explanation = `Left side undefined.\nRight side limit: ${right.toFixed(6)}`;
           } else if (!isNaN(left)) {
             resStr = Number(left.toFixed(6)).toString();
             isValid = true;
             explanation = `Right side undefined.\nLeft side limit: ${left.toFixed(6)}`;
           } else {
             resStr = 'Undefined';
             isValid = true;
             explanation = `Function undefined near ${target}.`;
           }
        } else if (Math.abs(left) > 1e7 && Math.abs(right) > 1e7) {
           if (left * right > 0) {
              resStr = left > 0 ? '+∞' : '-∞';
              isValid = true;
           } else {
              resStr = 'Undefined (diverges to opposite signs)';
              isValid = true;
           }
           explanation = `Approaching from left: ${left > 0 ? '+∞' : '-∞'}\nApproaching from right: ${right > 0 ? '+∞' : '-∞'}`;
        } else {
           const diff = Math.abs(left - right);
           if (diff < 1e-2) {
             const avg = (left + right) / 2;
             resStr = Number(avg.toFixed(6)).toString();
             isValid = true;
             explanation = `Approaching from left: ${left.toFixed(6)}\nApproaching from right: ${right.toFixed(6)}\nResult: ${resStr}`;
           } else {
             resStr = 'Undefined (limits do not match)';
             isValid = true;
             explanation = `Approaching from left: ${left.toFixed(6)}\nApproaching from right: ${right.toFixed(6)}\nLimits are unequal.`;
           }
        }
      }
      
      if (isValid) {
        setResult(`lim = ${resStr}`);
        generateExplanation(`Calculated Limit of ${mathExpr} as ${targetVar} -> ${targetStr}\n${explanation}`, 'text');
      } else {
        setResult('Error');
        setError('Limit could not be evaluated.');
      }
      setActiveTab('steps');
      setIsSidebarOpen(true);
    } catch(err: any) {
      setResult('Error');
      setError(`Cannot evaluate limit: ${analyzeError(err)}`);
      setActiveTab('steps');
      setIsSidebarOpen(true);
    }
  };

  const handleCalculate = () => {
    if (!expression) return;

    // Check if ALPHA is active - if so, trigger variable substitution mode
    if (isAlpha) {
      setIsAlpha(false);
      startVariablePrompt(expression);
      return;
    }

    if (expression.includes('=')) {
      handleSolve();
      return;
    }

    performCalculation(expression, {});
  };

  const handleBtnClick = (btn: any) => {
    if (error) setError('');
    
    if (isShift) {
      setIsShift(false);
      if (btn.label === 'MODE') {
        handleWindowSettings();
        return;
      }
      if (btn.shiftAction) { btn.shiftAction(); return; }
      if (btn.shiftVal) { handleAppend(btn.shiftVal); return; }
    }
    
    if (isAlpha) {
      setIsAlpha(false);
      if (btn.alphaAction) { btn.alphaAction(); return; }
      if (btn.alphaVal) { handleAppend(btn.alphaVal); return; }
    }
    
    if (btn.label === 'MODE') {
      handleModeButton();
      return;
    }
    
    if (btn.action) btn.action();
    else if (btn.val) handleAppend(btn.val);
  };

  const getSciRows = (mode: CalcMode): CalculatorButton[][] => {
    // Base layout (COMP Mode)
    const baseRows: CalculatorButton[][] = [
      [
        { label: 'CALC', action: handleCalculate, shiftLabel: 'SOLVE', shiftAction: handleSolve, alphaLabel: '=', alphaVal: '=' },
        { label: '∫dx', val: 'integrate(x,0,1,', shiftLabel: 'd/dx', shiftVal: 'derivative(x,0,', alphaLabel: 'nDeriv' },
        { label: 'x⁻¹', val: '^-1', shiftLabel: 'x!', shiftVal: 'factorial(' },
        { label: 'log_□', val: 'log(', shiftLabel: 'Σ', shiftVal: 'sum(n,1,10,', alphaLabel: 'Sum' },
        { label: 'a/b', val: '/', shiftLabel: 'd/c' }
      ],
      [
        { label: '√', val: 'sqrt(', shiftLabel: '∛', shiftVal: 'nthRoot(3,' },
        { label: 'x²', val: '^2', shiftLabel: 'x³', shiftVal: '^3' },
        { label: 'x^□', val: '^(', shiftLabel: 'x√', shiftVal: '^(1/' },
        { label: 'log', val: 'log10(', shiftLabel: '10^x', shiftVal: '10^(' },
        { label: 'ln', val: 'log(', shiftLabel: 'e^x', shiftVal: 'exp(' }
      ],
      [
        { label: '(-)', val: '-', shiftLabel: 'A', alphaLabel: 'A', alphaVal: 'A', alphaAction: () => handleAppend('A') },
        { label: '°\'"', val: 'deg', shiftLabel: 'B', alphaLabel: 'B', alphaVal: 'B', alphaAction: () => handleAppend('B') },
        { label: 'hyp', val: 'cosh(', shiftLabel: 'C', alphaLabel: 'C', alphaVal: 'C', alphaAction: () => handleAppend('C') },
        { label: 'sin', val: 'sin(', shiftLabel: 'sin⁻¹', shiftVal: 'asin(', alphaLabel: 'D', alphaVal: 'D', alphaAction: () => handleAppend('D') },
        { label: 'cos', val: 'cos(', shiftLabel: 'cos⁻¹', shiftVal: 'acos(', alphaLabel: 'E', alphaVal: 'E', alphaAction: () => handleAppend('E') },
        { label: 'tan', val: 'tan(', shiftLabel: 'tan⁻¹', shiftVal: 'atan(', alphaLabel: 'F', alphaVal: 'F', alphaAction: () => handleAppend('F') }
      ],
      [
        { label: 'RCL', action: () => {}, shiftLabel: 'STO', alphaLabel: 'X', alphaVal: 'X', alphaAction: () => handleAppend('X') },
        { label: 'ENG', val: 'e', shiftLabel: '←', alphaLabel: 'Y', alphaVal: 'Y', alphaAction: () => handleAppend('Y') },
        { label: '(', val: '(', shiftLabel: '%', shiftVal: '%' },
        { label: ')', val: ')', shiftLabel: ',', shiftVal: ',' },
        { label: 'S⇔D', action: () => {}, shiftLabel: 'a', alphaLabel: 'M', alphaVal: 'M', alphaAction: () => handleAppend('M') },
        { label: 'M+', val: '+', shiftLabel: 'M-', alphaLabel: 'Π', alphaVal: 'product(n,1,10,', alphaAction: () => handleAppend('Π') }
      ]
    ];

    let currentRows = [...baseRows];

    if (mode === 'CMPLX') {
      currentRows[1] = [...currentRows[1]];
      currentRows[1][3] = { label: 'i', val: 'i', shiftLabel: '∠', alphaLabel: 'C' };
      currentRows[1][4] = { label: 'Arg', val: 'arg(', shiftLabel: 'Conjg', alphaLabel: 'D' };
    } else if (mode === 'BASE-N') {
      currentRows[2] = [...currentRows[2]];
      currentRows[2][2] = { label: 'DEC', action: () => handleAppend('dec'), shiftLabel: 'HEX', shiftAction: () => handleAppend('hex') };
      currentRows[2][3] = { label: 'BIN', action: () => handleAppend('bin'), shiftLabel: 'OCT', shiftAction: () => handleAppend('oct') };
    } else if (mode === 'MATRIX') {
      currentRows[3] = [...currentRows[3]];
      currentRows[3][0] = { label: 'MatA', val: 'MatA', shiftLabel: 'Det' };
      currentRows[3][1] = { label: 'MatB', val: 'MatB', shiftLabel: 'Trn' };
    } else if (mode === 'VECTOR') {
      currentRows[3] = [...currentRows[3]];
      currentRows[3][0] = { label: 'VctA', val: 'VctA', shiftLabel: 'Dot' };
      currentRows[3][1] = { label: 'VctB', val: 'VctB', shiftLabel: 'Cross' };
    } else if (mode === 'STAT') {
      currentRows[2] = [...currentRows[2]];
      currentRows[2][2] = { label: '1-VAR', val: '1var' };
      currentRows[2][3] = { label: 'A+BX', val: 'a+bx' };
    } else if (mode === 'EQN') {
      currentRows[0] = [...currentRows[0]];
      currentRows[0][1] = { label: 'Simul', val: 'simul(' };
      currentRows[0][2] = { label: 'Poly', val: 'poly(' };
    } else if (mode === 'TABLE') {
      currentRows[3] = [...currentRows[3]];
      currentRows[3][0] = { label: 'f(x)', val: 'f(x)=' };
      currentRows[3][1] = { label: 'g(x)', val: 'g(x)=' };
    } else if (mode === 'DIST') {
      currentRows[2] = [...currentRows[2]];
      currentRows[2][2] = { label: 'Normal', val: 'normPD(' };
      currentRows[2][3] = { label: 'Binom', val: 'binomPD(' };
    } else if (mode === 'LIMIT') {
      currentRows[0] = [...currentRows[0]];
      // Replace CALC with EVAL LIM
      currentRows[0][0] = { label: 'EVAL', action: handleLimit, shiftLabel: 'SOLVE', shiftAction: handleSolve, alphaLabel: '=', alphaVal: '=' };
      currentRows[0][1] = { label: 'lim→', action: () => handleAppend(', ') };
      currentRows[0][2] = { label: '∞', val: 'Infinity' };
    }

    return currentRows;
  };

  const sciRows = getSciRows(calcMode);

  const numpadRows: CalculatorButton[][] = [
    [
      { label: '7', val: '7', type: 'num' },
      { label: '8', val: '8', type: 'num' },
      { label: '9', val: '9', type: 'num' },
      { label: 'DEL', action: handleBackspace, type: 'ctrl', shiftLabel: 'INS' },
      { label: 'AC', action: handleClear, type: 'ctrl', shiftLabel: 'OFF' }
    ],
    [
      { label: '4', val: '4', type: 'num' },
      { label: '5', val: '5', type: 'num' },
      { label: '6', val: '6', type: 'num' },
      { label: '×', val: '*', type: 'op', shiftLabel: 'nPr' },
      { label: '÷', val: '/', type: 'op', shiftLabel: 'nCr' }
    ],
    [
      { label: '1', val: '1', type: 'num' },
      { label: '2', val: '2', type: 'num' },
      { label: '3', val: '3', type: 'num' },
      { label: '+', val: '+', type: 'op', shiftLabel: 'Pol' },
      { label: '-', val: '-', type: 'op', shiftLabel: 'Rec' }
    ],
    [
      { label: '0', val: '0', type: 'num' },
      { label: '.', val: '.', type: 'num' },
      { label: '×10^x', val: '*10^', type: 'num', shiftLabel: 'π', shiftVal: 'pi', alphaLabel: 'e', alphaVal: 'e' },
      { label: 'Ans', val: 'Ans', type: 'num', shiftLabel: 'DRG', alphaLabel: 'Plot', alphaAction: () => handleGraph() },
      { label: '=', action: handleCalculate, type: 'ctrl' }
    ]
  ];

  const renderSciButton = (btn: any, i: number) => {
    return (
      <div key={i} className="flex flex-col items-center col-span-1">
        <div className="flex w-full justify-between px-[2px] mb-[2px] h-[12px]">
          <span className="text-[8px] font-bold text-amber-500 leading-none">{btn.shiftLabel}</span>
          <span className="text-[8px] font-bold text-red-500 leading-none">{btn.alphaLabel}</span>
        </div>
        <button
          onClick={() => handleBtnClick(btn)}
          className={cn(
            "w-full h-8 sm:h-9 bg-[#33334d] hover:bg-[#4d4d73] text-slate-100 rounded-[8px] sm:rounded-[10px] text-xs font-semibold shadow-sm border-b-[3px] border-[#1e1e2f] active:border-b-0 active:translate-y-[3px] transition-all",
            btn.label === 'CALC' ? "bg-slate-700 hover:bg-slate-600 border-slate-900" : ""
          )}
        >
          {btn.label}
        </button>
      </div>
    );
  };

  const renderNumButton = (btn: any, i: number) => {
    let variantClass = "bg-[#282a36] hover:bg-[#383a48] text-white border-b-[3px] border-[#161820]";
    
    if (btn.type === 'op') {
      variantClass = "bg-[#44475a] hover:bg-[#56596e] text-white border-b-[3px] border-[#292b36]";
    } else if (btn.type === 'ctrl') {
      variantClass = btn.label === '=' 
        ? "bg-[#00e5ff] hover:bg-[#33ebff] text-black border-b-[3px] border-[#00a3b8]"
        : "bg-[#ff5555] hover:bg-[#ff7777] text-white border-b-[3px] border-[#cc4444]";
    }

    return (
      <div key={i} className="flex flex-col items-center col-span-1">
        <div className="flex w-full justify-between px-1 mb-[2px] h-[12px]">
          <span className="text-[8px] font-bold text-amber-500 leading-none">{btn.shiftLabel}</span>
          <span className="text-[8px] font-bold text-red-500 leading-none">{btn.alphaLabel}</span>
        </div>
        <button
          onClick={() => handleBtnClick(btn)}
          className={cn(
            "w-full h-11 sm:h-12 rounded-[10px] text-lg font-bold shadow-sm active:border-b-0 active:translate-y-[3px] transition-all",
            variantClass
          )}
        >
          {btn.label}
        </button>
      </div>
    );
  };

  const toggleSidebar = (tab: Tab) => {
    if (isSidebarOpen && activeTab === tab) {
      setIsSidebarOpen(false);
    } else {
      setActiveTab(tab);
      setIsSidebarOpen(true);
    }
  };

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className={cn("min-h-[100dvh] font-sans selection:bg-blue-500/30 flex flex-col items-center transition-all duration-300", isDarkMode ? "bg-[#0f172a] text-slate-200" : "bg-slate-200 text-slate-800")}>
      
      {/* SYSTEM TOP BAR */}
      <div className="w-full h-12 bg-[#1A2235]/80 backdrop-blur-md border-b border-white/5 px-6 flex items-center justify-between z-[100] sticky top-0 shadow-xl">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
             <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-900/40">
               <Calculator className="w-4 h-4 text-white" />
             </div>
             <span className="text-[11px] font-black tracking-[0.2em] text-white uppercase opacity-80">SmartCalc OS</span>
          </div>
          
          <div className="h-4 w-px bg-white/10 hidden sm:block" />
          
          <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:flex">
             <span className="hover:text-blue-400 cursor-pointer transition-colors">Calculator</span>
             <span className="hover:text-blue-400 cursor-pointer transition-colors" onClick={() => setShowWindowSettings(true)}>Settings</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
           {/* Theme Toggle */}
           <button 
             onClick={() => setIsDarkMode(!isDarkMode)}
             className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all"
           >
             {isDarkMode ? '☀️' : '🌙'}
           </button>

           <div className="h-4 w-px bg-white/10" />

           {/* Account Section */}
           <div className="relative">
              {user ? (
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 transition-all group"
                >
                  <img src={user.photoURL || ''} alt="Avatar" className="w-6 h-6 rounded-full border-2 border-blue-400/50 group-hover:scale-105 transition-transform" />
                  <span className="text-[10px] font-bold text-blue-400 tracking-wider hidden sm:inline uppercase">{user.displayName?.split(' ')[0]}</span>
                  <ChevronDown className={cn("w-3 h-3 text-blue-400/50 transition-transform", showUserMenu && "rotate-180")} />
                </button>
              ) : (
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-[10px] font-bold tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20"
                >
                  SIGN IN
                </button>
              )}

              {showUserMenu && user && (
                <div className="absolute right-0 mt-3 w-56 bg-[#1e1e2f] border border-white/5 rounded-2xl shadow-2xl z-[100] py-3 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-5 py-3 border-b border-white/5 mb-2 bg-white/5">
                    <p className="text-xs font-bold text-white truncate">{user.displayName}</p>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{user.email}</p>
                  </div>
                  <button 
                    onClick={() => { toggleSidebar('history'); setShowUserMenu(false); }}
                    className="w-full text-left px-5 py-2.5 text-[11px] font-bold text-slate-300 hover:bg-blue-600/10 hover:text-blue-400 flex items-center gap-3 transition-all"
                  >
                    <History className="w-3.5 h-3.5" />
                    USER LOGS
                  </button>
                  <button 
                    onClick={() => { setShowWindowSettings(true); setShowUserMenu(false); }}
                    className="w-full text-left px-5 py-2.5 text-[11px] font-bold text-slate-300 hover:bg-blue-600/10 hover:text-blue-400 flex items-center gap-3 transition-all"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    SYSTEM PREFS
                  </button>
                  <div className="h-px bg-white/5 my-2" />
                  <button 
                    onClick={() => { logout(); setShowUserMenu(false); }}
                    className="w-full text-left px-5 py-2.5 text-[11px] font-bold text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    TERMINATE SESSION
                  </button>
                </div>
              )}
           </div>

           {/* Time Display */}
           <div className="h-4 w-px bg-white/10 hidden md:block" />
           <div className="hidden md:flex flex-col items-end leading-none">
              <span className="text-[10px] font-black text-white tracking-widest uppercase">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-[8px] font-bold text-slate-500 mt-0.5">
                {new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
           </div>
        </div>
      </div>

      <div className={cn("flex-1 w-full flex flex-col p-0 sm:p-6 md:p-8 transition-all duration-300")}>
        <div className={cn("w-full flex-1 md:h-[90vh] md:min-h-[600px] flex flex-col md:flex-row gap-6 mx-auto transition-all duration-500 ease-in-out", isSidebarOpen ? "max-w-6xl" : "max-w-[420px]", !isDarkMode && "invert hue-rotate-180")}>
        
        {/* LEFT PANEL: Calculator */}
        <div className="w-full flex-1 md:w-[420px] md:h-auto flex-shrink-0 flex flex-col bg-[#1e1e2f] md:rounded-3xl shadow-2xl shadow-blue-900/10 border-b md:border border-slate-800/60 overflow-hidden relative z-10 transition-all duration-300">
          
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-800/60 flex items-center justify-between bg-[#1A2235]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-slate-300">
                <Calculator className="w-5 h-5 text-blue-400" />
                <span className="font-bold text-xs tracking-wide uppercase">MATHENGINE OS</span>
              </div>
              
              {/* DB Status Badge */}
              <div className={cn(
                "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border",
                user?.uid?.startsWith('mock_') || user?.uid?.startsWith('guest_')
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              )}>
                <div className={cn("w-1 h-1 rounded-full", 
                  user?.uid?.startsWith('mock_') || user?.uid?.startsWith('guest_') ? "bg-amber-500" : "bg-emerald-500"
                )} />
                {user?.uid?.startsWith('mock_') || user?.uid?.startsWith('guest_') ? "Local DB" : "Cloud Active"}
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => toggleSidebar('history')}
                className={cn("text-[10px] font-bold px-2 py-1 rounded transition-colors", isSidebarOpen && activeTab === 'history' ? "bg-blue-600 text-white" : "bg-[#252538] text-slate-300 hover:bg-slate-700")}
              >
                📜 LOG
              </button>
              <button 
                onClick={() => toggleSidebar('guide')}
                className={cn("text-[10px] font-bold px-2 py-1 rounded transition-colors", isSidebarOpen && activeTab === 'guide' ? "bg-emerald-600 text-white" : "bg-[#252538] text-slate-300 hover:bg-slate-700")}
              >
                ❓ GUIDE
              </button>
            </div>
          </div>
          
          <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

          {/* Display */}
          <div className="bg-[#e6f0ea] p-4 pt-6 min-h-[120px] flex flex-col justify-end items-end relative shadow-inner mx-4 mt-2 mb-4 rounded border-2 border-slate-600/30">
            {/* Top LCD Status Bar */}
            <div className="absolute top-2 left-3 right-3 flex justify-between items-start text-[#558870] font-mono text-[10px] sm:text-xs font-bold tracking-widest opacity-90 select-none">
              <div className="flex gap-3 items-center">
                <span className="bg-[#558870]/10 px-1 rounded">{calcMode}</span>
                {isShift && <span className="bg-amber-900/10 px-1 rounded text-amber-800">S</span>}
                {isAlpha && <span className="bg-red-900/10 px-1 rounded text-red-800">A</span>}
              </div>
              <div className="flex gap-2">
                <span>MATH</span>
                <span>D</span>
              </div>
            </div>

            <div 
              ref={displayRef}
              className="w-full overflow-x-auto overflow-y-hidden text-right whitespace-nowrap scrollbar-hide mb-1 mt-2"
            >
              <div className="text-3xl sm:text-4xl font-mono text-[#0d1f15] font-semibold tracking-wider min-h-[40px]">
                {expression || <span className="opacity-30">0</span>}
              </div>
            </div>
            <div className="text-xl font-mono text-[#558870] font-semibold h-7 transition-all">
              {result && (result === 'Error' ? <span className="text-red-600">Error</span> : `= ${result}`)}
            </div>
          </div>

          {/* Keypad */}
          <div className="flex flex-col flex-1 bg-[#161D2E] p-3 sm:p-4 rounded-b-[24px] shadow-[inset_0_10px_20px_-10px_rgba(0,0,0,0.5)] overflow-y-auto scrollbar-hide">
            
            {/* TOP ROW: SHIFT, ALPHA, MODE, ON */}
            <div className="flex justify-between items-start mb-4 px-1 flex-shrink-0">
              <div className="flex gap-3 sm:gap-4">
                <div className="flex flex-col items-center">
                  <button 
                    onClick={() => { setIsShift(!isShift); setIsAlpha(false); }} 
                    className={cn("w-10 sm:w-12 h-7 sm:h-8 rounded-[8px] sm:rounded-[10px] text-[9px] sm:text-[10px] font-bold shadow-md active:translate-y-0.5 transition-all border-b-2", isShift ? "bg-amber-500 text-black border-amber-700" : "bg-[#1E293B] hover:bg-[#273549] text-slate-300 border-[#0F172A]")}
                  >
                    SHIFT
                  </button>
                </div>
                <div className="flex flex-col items-center">
                  <button 
                    onClick={() => { setIsAlpha(!isAlpha); setIsShift(false); }} 
                    className={cn("w-10 sm:w-12 h-7 sm:h-8 rounded-[8px] sm:rounded-[10px] text-[9px] sm:text-[10px] font-bold shadow-md active:translate-y-0.5 transition-all border-b-2", isAlpha ? "bg-red-500 text-white border-red-700" : "bg-[#1E293B] hover:bg-[#273549] text-slate-300 border-[#0F172A]")}
                  >
                    ALPHA
                  </button>
                </div>
              </div>
              
              {/* Nav Pad area (Visual) */}
              <div className="relative w-16 sm:w-20 h-14 sm:h-16 bg-[#1A2235] rounded-full flex flex-col items-center justify-center -mt-1 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] border-2 border-[#0F172A] cursor-pointer hover:bg-[#222E42] transition-colors">
                 <div className="absolute top-1 w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-l-transparent border-r-transparent border-b-slate-400" />
                 <div className="absolute bottom-1 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-400" />
                 <div className="absolute left-1 w-0 h-0 border-t-[4px] border-b-[4px] border-r-[6px] border-t-transparent border-b-transparent border-r-slate-400" />
                 <div className="absolute right-1 w-0 h-0 border-t-[4px] border-b-[4px] border-l-[6px] border-t-transparent border-b-transparent border-l-slate-400" />
                 <div className="w-8 h-8 rounded-full bg-[#131A2A] shadow-inner" />
              </div>

              <div className="flex gap-3 sm:gap-4">
                <button 
                  onClick={() => handleBtnClick({label: 'MODE'})}
                  title="Click for Mode (Normal/Complex/Matrix), Shift+Click for Window Settings"
                  className="w-10 sm:w-12 h-7 sm:h-8 rounded-[8px] sm:rounded-[10px] bg-[#1E293B] hover:bg-[#273549] text-slate-300 text-[9px] sm:text-[10px] font-bold border-b-2 border-[#0F172A] shadow-md active:translate-y-0.5 transition-all">
                  MODE
                  <div className="text-[7px] text-cyan-400 absolute -bottom-1 whitespace-nowrap">{calcMode}</div>
                </button>
                <button onClick={handleClear} className="w-10 sm:w-12 h-7 sm:h-8 rounded-[8px] sm:rounded-[10px] bg-[#1E293B] hover:bg-[#273549] text-slate-300 text-[9px] sm:text-[10px] font-bold border-b-2 border-[#0F172A] shadow-md active:translate-y-0.5 transition-all">
                  ON
                </button>
              </div>
            </div>

            {/* Scientific Area */}
            <div className="flex flex-col gap-[2px] sm:gap-1 mb-4 flex-shrink-0">
              {sciRows.map((row, rIdx) => (
                <div key={rIdx} className={cn("grid gap-1 sm:gap-2", row.length === 5 ? "grid-cols-5" : "grid-cols-6")}>
                  {row.map((btn, cIdx) => renderSciButton(btn, cIdx))}
                </div>
              ))}
            </div>

            {/* Numpad Area */}
            <div className="flex-1 grid grid-rows-4 gap-2 sm:gap-3 bg-[#131A2A]/50 p-2 sm:p-3 rounded-xl shadow-inner border border-slate-800/50 flex-shrink-0 min-h-[220px]">
              {numpadRows.map((row, rIdx) => (
                <div key={rIdx} className="grid grid-cols-5 gap-2 sm:gap-3">
                  {row.map((btn, cIdx) => renderNumButton(btn, cIdx))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Context / Features */}
        {isSidebarOpen && (
          <div className="flex-1 flex flex-col bg-[#252538] md:rounded-3xl border-t md:border border-slate-800/60 overflow-hidden shadow-xl animate-in slide-in-from-right-8 duration-300 fixed inset-0 z-50 md:relative md:inset-auto md:z-0">
            
            {/* Tabs & Mobile Close */}
            <div className="flex items-center border-b border-slate-800/60 bg-[#1e1e2f]">
              <div className="flex-1 flex p-3 gap-2 overflow-x-auto hide-scrollbar">
              <button 
                onClick={() => setActiveTab('steps')} 
                className={cn("px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap", activeTab === 'steps' ? 'bg-blue-600/20 text-blue-400 shadow-sm border border-blue-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50')}
              >
              <BookOpen className="w-4 h-4" /> Logic Steps
            </button>
            <button 
              onClick={() => setActiveTab('graph')} 
              className={cn("px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap", activeTab === 'graph' ? 'bg-emerald-600/20 text-emerald-400 shadow-sm border border-emerald-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50')}
            >
              <Activity className="w-4 h-4" /> Graph Viewer
            </button>
            <button 
              onClick={() => setActiveTab('history')} 
              className={cn("px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap", activeTab === 'history' ? 'bg-purple-600/20 text-purple-400 shadow-sm border border-purple-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50')}
            >
              <History className="w-4 h-4" /> History
            </button>
            <button 
              onClick={() => setActiveTab('guide')} 
              className={cn("px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap", activeTab === 'guide' ? 'bg-cyan-600/20 text-cyan-400 shadow-sm border border-cyan-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50')}
            >
                <BookOpen className="w-4 h-4" /> Guide
              </button>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden p-4 text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            
            {/* STEPS TAB */}
            {activeTab === 'steps' && (
              <div className="space-y-6 max-w-2xl mx-auto">
                {error ? (
                  <div className="bg-red-950/30 border border-red-900/50 rounded-2xl p-6 flex gap-4 text-red-400 animate-in fade-in slide-in-from-bottom-4">
                    <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-red-300">Calculation Error</h3>
                      <p className="leading-relaxed text-red-400/90">{error}</p>
                      
                      <div className="mt-4 p-4 bg-red-950/50 rounded-xl border border-red-900/30 font-mono text-sm text-red-300/80 break-all">
                        {expression}
                      </div>
                    </div>
                  </div>
                ) : steps.length > 0 ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-3 text-slate-300 mb-8">
                       <Terminal className="w-5 h-5 text-blue-400" />
                       <h2 className="text-lg font-medium">Evaluation Breakdown</h2>
                    </div>
                    
                    {steps.map((step, i) => (
                      <div key={i} className="flex gap-5 relative group">
                        <div className="flex flex-col items-center">
                          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 z-10 transition-colors", 
                            i === steps.length - 1 ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-[#1A2235] border-slate-700 text-slate-400 group-hover:border-slate-500'
                          )}>
                            {i + 1}
                          </div>
                          {i !== steps.length - 1 && (
                            <div className="w-0.5 h-full absolute top-10 bg-slate-800 group-hover:bg-slate-700 transition-colors" />
                          )}
                        </div>
                        <div className="pb-8 pt-1.5 flex-1">
                          <div className="text-sm text-slate-400 font-medium mb-2 uppercase tracking-wider">{step.title}</div>
                          <div className={cn(
                             "font-mono px-5 py-4 rounded-xl border inline-block max-w-full overflow-x-auto",
                             i === steps.length - 1 ? 'bg-blue-950/20 border-blue-900/50 text-blue-300 text-lg shadow-inner' : 'bg-[#1A2235]/50 border-slate-800/80 text-slate-300'
                          )}>
                            {step.desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 min-h-[300px] opacity-60">
                    <BookOpen className="w-16 h-16 mb-4 opacity-50 stroke-1" />
                    <p className="text-lg font-medium">No active calculation</p>
                    <p className="text-sm mt-2">Enter an expression to see step-by-step breakdown</p>
                  </div>
                )}
              </div>
            )}

            {/* GRAPH TAB */}
            {activeTab === 'graph' && (
              <div className="h-full flex flex-col animate-in fade-in">
                <div className="flex justify-between items-center mb-6 px-2">
                  <h3 className="text-xl font-semibold flex items-center gap-3 text-emerald-400">
                    <Activity className="w-6 h-6" />
                    Interactive Plot
                  </h3>
                  <div className="text-sm text-slate-400 font-mono bg-[#1A2235] px-3 py-1.5 rounded-lg border border-slate-800">
                    Domain: [-10, 10]
                  </div>
                </div>
                
                <div className="flex-1 bg-[#161D2E] rounded-2xl border border-slate-800/80 p-2 sm:p-6 shadow-inner relative min-h-[400px]">
                  {graphData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={graphData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                        <CartesianGrid key="grid" strokeDasharray="4 4" stroke="#1E293B" vertical={false} />
                        <XAxis 
                          key="x-axis"
                          dataKey="x" 
                          stroke="#475569" 
                          tick={{fill: '#64748B', fontSize: 12}} 
                          tickMargin={10}
                          axisLine={{stroke: '#334155'}}
                        />
                        <YAxis 
                          key="y-axis"
                          stroke="#475569" 
                          tick={{fill: '#64748B', fontSize: 12}}
                          tickMargin={10}
                          axisLine={{stroke: '#334155'}}
                        />
                        <RechartsTooltip 
                          key="tooltip"
                          contentStyle={{ 
                            backgroundColor: '#0F172A', 
                            border: '1px solid #334155', 
                            borderRadius: '12px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                          }}
                          itemStyle={{ color: '#34d399', fontWeight: 600, fontFamily: 'monospace' }}
                          labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                        />
                        <ReferenceLine key="ref-x" x={0} stroke="#334155" strokeWidth={2} />
                        <ReferenceLine key="ref-y" y={0} stroke="#334155" strokeWidth={2} />
                        <Line 
                          key="line"
                          type="monotone" 
                          dataKey="y" 
                          stroke="#10b981" 
                          strokeWidth={3} 
                          dot={false} 
                          activeDot={{r: 6, fill: '#34d399', stroke: '#064e3b', strokeWidth: 2}} 
                          animationDuration={1500}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 text-slate-500 bg-[#161D2E]/50">
                      <Activity className="w-16 h-16 opacity-20" />
                      <div className="text-center">
                        <p className="text-lg font-medium text-slate-400">Ready to Plot</p>
                        <p className="text-sm mt-2 max-w-xs mx-auto">Enter a function using 'x' (e.g. <code className="text-emerald-500/70 bg-emerald-900/20 px-1 py-0.5 rounded">sin(x) * x</code>) and click Plot</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* HISTORY TAB */}
            {activeTab === 'history' && (
              <div className="max-w-3xl mx-auto h-full animate-in fade-in">
                 <div className="flex justify-between items-center mb-6 px-2">
                  <h3 className="text-xl font-semibold flex items-center gap-3 text-purple-400">
                    <History className="w-6 h-6" />
                    Recent Calculations
                  </h3>
                  {history.length > 0 && (
                    <button 
                      onClick={() => setHistory([])}
                      className="text-sm text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-950/30"
                    >
                      <Trash2 className="w-4 h-4" /> Clear All
                    </button>
                  )}
                </div>
                
                {history.length > 0 ? (
                  <div className="space-y-3">
                    {history.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setExpression(item.expression);
                          setResult(item.result);
                        }}
                        className="w-full text-left bg-[#1A2235]/50 hover:bg-[#1E293B] border border-slate-800/80 hover:border-blue-500/30 p-5 rounded-2xl transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center gap-3 mb-2">
                             <div className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[9px] font-black text-blue-400 uppercase tracking-widest">
                               {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                             </div>
                             <div className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                               {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </div>
                          </div>
                          <div className="font-mono text-lg text-slate-300 truncate tracking-tight">{item.expression}</div>
                        </div>
                        <div className="flex items-center gap-4 text-right shrink-0">
                           <div className="font-mono text-2xl text-white font-black truncate max-w-[200px]">
                             <span className="text-blue-500 mr-2 text-sm opacity-50">=</span>
                             {item.result}
                           </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="h-[60%] flex flex-col items-center justify-center text-slate-500">
                    <div className="bg-[#1A2235] p-8 rounded-3xl border border-slate-800/50 flex flex-col items-center text-center max-w-sm">
                      <History className="w-16 h-16 mb-4 opacity-20 stroke-1" />
                      <p className="text-lg font-medium text-slate-300">No history yet</p>
                      <p className="text-sm mt-2 mb-6 text-slate-400">Your past calculations will appear here. {user ? "They are being saved to your account." : "Sign in to save them across all your devices."}</p>
                      {!user && (
                        <button 
                          onClick={() => setIsAuthModalOpen(true)}
                          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20"
                        >
                          Sign In Now
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* GUIDE TAB */}
            {activeTab === 'guide' && (
              <div className="max-w-3xl mx-auto h-full animate-in fade-in text-slate-300 space-y-6">
                <div className="flex justify-between items-center mb-4 px-2">
                  <h3 className="text-xl font-semibold flex items-center gap-3 text-cyan-400">
                    <BookOpen className="w-6 h-6" />
                    MATHENGINE OS — USER GUIDE
                  </h3>
                </div>
                
                {/* General Guide */}
                <div className="bg-[#1A2235]/50 border border-slate-800/80 p-6 rounded-2xl text-sm leading-relaxed space-y-4">
                  <h4 className="text-cyan-400 font-bold mb-2 text-lg border-b border-slate-700 pb-2">📚 General Calculator Guide</h4>
                  <div className="grid gap-6">
                    <div>
                      <h4 className="text-emerald-400 font-bold mb-2 text-base border-b border-slate-700/50 pb-1">1. ⌨️ Keyboard Shortcuts</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mt-3">
                        <div className="flex flex-col gap-1"><span className="text-yellow-200">0-9</span> Numbers</div>
                        <div className="flex flex-col gap-1"><span className="text-yellow-200">+, -, *, /</span> Operators</div>
                        <div className="flex flex-col gap-1"><span className="text-yellow-200">Enter</span> Calculate (=)</div>
                        <div className="flex flex-col gap-1"><span className="text-yellow-200">Bksp</span> Delete</div>
                        <div className="flex flex-col gap-1"><span className="text-yellow-200">Esc</span> Clear All (AC)</div>
                        <div className="flex flex-col gap-1"><span className="text-yellow-200">S / A</span> Shift / Alpha Toggle</div>
                        <div className="flex flex-col gap-1"><span className="text-yellow-200">M</span> Mode Menu</div>
                        <div className="flex flex-col gap-1"><span className="text-yellow-200">^</span> Power</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-emerald-400 font-bold mb-2 text-base border-b border-slate-700/50 pb-1">2. 🛠️ Advanced Features</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-slate-300 mt-3">
                        <li><strong>Variable Substitution:</strong> Press <span className="text-red-400">ALPHA</span> before clicking <span className="text-blue-400">=</span> to enter values for A-F, X, Y, M.</li>
                        <li><strong>Cloud Sync:</strong> Sign in to securely sync your calculation history across devices.</li>
                        <li><strong>Graph Settings:</strong> Press <span className="text-amber-500">SHIFT</span> then <span className="text-slate-300">MODE</span> to configure the window bounds for the graph viewer.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Mode Specific Guides */}
                <div className="bg-[#1A2235]/50 border border-slate-800/80 p-6 rounded-2xl text-sm leading-relaxed space-y-4">
                  <h4 className="text-blue-400 font-bold mb-2 text-lg border-b border-slate-700 pb-2">🧮 Mode-Specific Guides</h4>
                  <p className="text-slate-400 mb-4">Click on a mode to learn how to use it.</p>
                  
                  <div className="space-y-3">
                    <details className="bg-slate-800/30 rounded-xl border border-white/5 group">
                      <summary className="font-bold text-blue-400 p-4 cursor-pointer hover:bg-slate-800/50 rounded-xl">COMP (Standard)</summary>
                      <div className="p-4 pt-0 text-slate-300 text-sm">
                        Perform basic arithmetic, trigonometric, and logarithmic calculations. Supports parentheses and variable assignments. Use the main keypad for standard operations.
                      </div>
                    </details>
                    
                    <details className="bg-slate-800/30 rounded-xl border border-white/5 group">
                      <summary className="font-bold text-purple-400 p-4 cursor-pointer hover:bg-slate-800/50 rounded-xl">CMPLX (Complex)</summary>
                      <div className="p-4 pt-0 text-slate-300 text-sm">
                        Work with complex numbers. Press the <span className="text-yellow-200">i</span> button to enter the imaginary unit. Use <span className="text-yellow-200">Arg</span> to find the argument of a complex number. Example: <code className="bg-slate-800 px-1 rounded text-cyan-300">2 + 3i</code>.
                      </div>
                    </details>
                    
                    <details className="bg-slate-800/30 rounded-xl border border-white/5 group">
                      <summary className="font-bold text-red-400 p-4 cursor-pointer hover:bg-slate-800/50 rounded-xl">BASE-N</summary>
                      <div className="p-4 pt-0 text-slate-300 text-sm">
                        Perform calculations in different number bases (Binary, Octal, Decimal, Hexadecimal). Use the DEC, HEX, BIN, and OCT keys to format the output. Add suffixes like <code>hex</code> or <code>bin</code> to your expression to convert bases.
                      </div>
                    </details>
                    
                    <details className="bg-slate-800/30 rounded-xl border border-white/5 group">
                      <summary className="font-bold text-emerald-400 p-4 cursor-pointer hover:bg-slate-800/50 rounded-xl">MATRIX</summary>
                      <div className="p-4 pt-0 text-slate-300 text-sm">
                        Evaluate matrix operations. Use MatA, MatB keys. You can also input matrices directly using array syntax e.g., <code className="bg-slate-800 px-1 rounded text-cyan-300">[[1,2],[3,4]]</code>. Functions like Determinant (Det) and Transpose (Trn) are available via SHIFT.
                      </div>
                    </details>

                    <details className="bg-slate-800/30 rounded-xl border border-white/5 group">
                      <summary className="font-bold text-teal-400 p-4 cursor-pointer hover:bg-slate-800/50 rounded-xl">VECTOR</summary>
                      <div className="p-4 pt-0 text-slate-300 text-sm">
                        Calculate dot products, cross products, and vector arithmetic. Similar to matrix mode, you can input vectors as arrays e.g., <code className="bg-slate-800 px-1 rounded text-cyan-300">[1, 2, 3]</code>. Use Dot and Cross from the SHIFT menu.
                      </div>
                    </details>
                    
                    <details className="bg-slate-800/30 rounded-xl border border-white/5 group">
                      <summary className="font-bold text-pink-400 p-4 cursor-pointer hover:bg-slate-800/50 rounded-xl">STAT</summary>
                      <div className="p-4 pt-0 text-slate-300 text-sm">
                        Perform statistical calculations. Use the 1-VAR or A+BX keys to initialize statistical data entry (currently evaluates as standard function strings).
                      </div>
                    </details>

                    <details className="bg-slate-800/30 rounded-xl border border-white/5 group">
                      <summary className="font-bold text-amber-400 p-4 cursor-pointer hover:bg-slate-800/50 rounded-xl">EQN (Equation)</summary>
                      <div className="p-4 pt-0 text-slate-300 text-sm">
                        Solve algebraic equations. Type an equation using the <span className="text-red-400">ALPHA</span> = sign, like <code className="bg-slate-800 px-1 rounded text-cyan-300">X^2=4</code>, then press <span className="text-blue-400">=</span> or SHIFT + SOLVE. The calculator uses numerical methods to find roots.
                      </div>
                    </details>
                    
                    <details className="bg-slate-800/30 rounded-xl border border-white/5 group">
                      <summary className="font-bold text-lime-400 p-4 cursor-pointer hover:bg-slate-800/50 rounded-xl">TABLE / GRAPH</summary>
                      <div className="p-4 pt-0 text-slate-300 text-sm">
                        Define functions f(x) and g(x). To plot, enter an expression with 'X' (e.g., <code className="bg-slate-800 px-1 rounded text-cyan-300">sin(X)</code>) and press ALPHA + Plot. The interactive graph viewer will display the result over the defined window.
                      </div>
                    </details>
                    
                    <details className="bg-slate-800/30 rounded-xl border border-white/5 group">
                      <summary className="font-bold text-cyan-400 p-4 cursor-pointer hover:bg-slate-800/50 rounded-xl">DIST</summary>
                      <div className="p-4 pt-0 text-slate-300 text-sm">
                        Calculate statistical distributions such as Normal (normPD) and Binomial (binomPD). Provide arguments as specified by math.js library.
                      </div>
                    </details>
                    
                    <details className="bg-slate-800/30 rounded-xl border border-white/5 group">
                      <summary className="font-bold text-indigo-400 p-4 cursor-pointer hover:bg-slate-800/50 rounded-xl">LIMIT</summary>
                      <div className="p-4 pt-0 text-slate-300 text-sm">
                        Evaluate mathematical limits. Enter an expression, then press EVAL (Limit). The system will prompt you for the approach value (e.g., 0) and compute the limit numerically from both sides.
                      </div>
                    </details>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>

    {/* MODE SELECTION MODAL */}
    {showModeSelection && (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[110] backdrop-blur-md">
        <div className="bg-[#1e1e2f] border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-2xl w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-white tracking-widest uppercase flex items-center gap-3">
              <Layers className="w-6 h-6 text-blue-400" />
              Select Mode
            </h2>
            <button 
              onClick={() => setShowModeSelection(false)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mb-8">
            {[
              { id: 'COMP', label: '1', name: 'COMP' },
              { id: 'CMPLX', label: '2', name: 'CMPLX' },
              { id: 'STAT', label: '3', name: 'STAT' },
              { id: 'BASE-N', label: '4', name: 'BASE-N' },
              { id: 'EQN', label: '5', name: 'EQN' },
              { id: 'MATRIX', label: '6', name: 'MATRIX' },
              { id: 'TABLE', label: '7', name: 'TABLE' },
              { id: 'VECTOR', label: '8', name: 'VECTOR' },
              { id: 'DIST', label: '9', name: 'DIST' },
              { id: 'LIMIT', label: '0', name: 'LIMIT' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setCalcMode(m.id as CalcMode);
                  setShowModeSelection(false);
                  generateExplanation(`Switched to ${m.name} Mode`, 'text');
                }}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all group relative",
                  calcMode === m.id 
                    ? "bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/10" 
                    : "bg-[#161625] border-white/5 hover:border-white/20"
                )}
              >
                <span className={cn(
                  "text-[10px] font-black absolute top-2 right-3",
                  calcMode === m.id ? "text-blue-400" : "text-slate-600"
                )}>{m.label}</span>
                <span className={cn(
                  "text-[11px] font-black tracking-tighter transition-colors",
                  calcMode === m.id ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                )}>{m.name}</span>
                <div className={cn(
                  "w-1 h-1 rounded-full transition-all",
                  calcMode === m.id ? "bg-blue-500 scale-150" : "bg-slate-800 scale-100"
                )} />
              </button>
            ))}
          </div>

          <div className="bg-blue-600/5 rounded-2xl p-4 border border-blue-500/10">
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest text-center">
              Current active mode: <span className="text-white ml-2">{calcMode}</span>
            </p>
          </div>
        </div>
      </div>
    )}

    {/* VARIABLE PROMPT MODAL */}
    {showVarPrompt && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-[#131A2A] border-2 border-red-500/50 rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in-95">
            <h2 className="text-2xl font-bold text-red-400 mb-6 flex items-center gap-3">
              <AlertCircle className="w-6 h-6" />
              Variable Substitution Mode
            </h2>
            
            <div className="mb-6">
              <p className="text-slate-300 mb-4">
                Detected variables in expression: <span className="font-mono text-blue-400">{detectedVars.join(', ')}</span>
              </p>
              
              <div className="bg-[#1A2235] border border-slate-800 rounded-xl p-4 mb-4">
                <label className="block text-sm text-slate-400 mb-2">
                  Enter value for <span className="font-bold text-red-400 text-lg">{detectedVars[currentVarIndex] || 'N/A'}</span>:
                </label>
                <input
                  type="number"
                  step="any"
                  autoFocus
                  value={varValues[detectedVars[currentVarIndex]] || ''}
                  onChange={(e) => setVarValues({
                    ...varValues,
                    [detectedVars[currentVarIndex]]: e.target.value
                  })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitVariableValue();
                  }}
                  className="w-full bg-[#0f1523] border border-slate-700 rounded-lg px-4 py-3 text-white font-mono text-lg placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              
              <div className="flex gap-2 mb-4">
                {detectedVars.map((v, i) => (
                  <div 
                    key={v}
                    className={cn(
                      "px-3 py-1 rounded-lg text-sm font-bold transition-colors",
                      i === currentVarIndex 
                        ? "bg-red-500/30 text-red-400 border border-red-500" 
                        : "bg-slate-800 text-slate-400"
                    )}
                  >
                    {v} {varValues[v] !== undefined ? `= ${varValues[v]}` : '?'}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowVarPrompt(false);
                  setDetectedVars([]);
                  setVarValues({});
                }}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitVariableValue}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                {currentVarIndex < detectedVars.length - 1 ? 'Next' : 'Calculate'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* WINDOW SETTINGS MODAL */}
      {showWindowSettings && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-[#131A2A] border-2 border-amber-500/50 rounded-3xl shadow-2xl p-8 max-w-lg w-full mx-4 animate-in fade-in zoom-in-95">
            <h2 className="text-2xl font-bold text-amber-400 mb-6 flex items-center gap-3">
              <Settings className="w-6 h-6" />
              Graph Window Settings
            </h2>
            
            <div className="space-y-5 mb-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1A2235] border border-slate-800 rounded-xl p-4">
                  <label className="block text-sm text-slate-400 mb-2">X Minimum</label>
                  <input
                    type="number"
                    step="0.1"
                    value={tempWindowSettings.xMin}
                    onChange={(e) => setTempWindowSettings({ ...tempWindowSettings, xMin: parseFloat(e.target.value) })}
                    className="w-full bg-[#0f1523] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div className="bg-[#1A2235] border border-slate-800 rounded-xl p-4">
                  <label className="block text-sm text-slate-400 mb-2">X Maximum</label>
                  <input
                    type="number"
                    step="0.1"
                    value={tempWindowSettings.xMax}
                    onChange={(e) => setTempWindowSettings({ ...tempWindowSettings, xMax: parseFloat(e.target.value) })}
                    className="w-full bg-[#0f1523] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div className="bg-[#1A2235] border border-slate-800 rounded-xl p-4">
                  <label className="block text-sm text-slate-400 mb-2">Y Minimum</label>
                  <input
                    type="number"
                    step="0.1"
                    value={tempWindowSettings.yMin}
                    onChange={(e) => setTempWindowSettings({ ...tempWindowSettings, yMin: parseFloat(e.target.value) })}
                    className="w-full bg-[#0f1523] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div className="bg-[#1A2235] border border-slate-800 rounded-xl p-4">
                  <label className="block text-sm text-slate-400 mb-2">Y Maximum</label>
                  <input
                    type="number"
                    step="0.1"
                    value={tempWindowSettings.yMax}
                    onChange={(e) => setTempWindowSettings({ ...tempWindowSettings, yMax: parseFloat(e.target.value) })}
                    className="w-full bg-[#0f1523] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
              
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <p className="text-xs text-slate-400 text-center">
                  Current: X [{tempWindowSettings.xMin.toFixed(1)}, {tempWindowSettings.xMax.toFixed(1)}] Y [{tempWindowSettings.yMin.toFixed(1)}, {tempWindowSettings.yMax.toFixed(1)}]
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowWindowSettings(false);
                  setTempWindowSettings(windowSettings);
                }}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveWindowSettings}
                className="flex-1 px-4 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
