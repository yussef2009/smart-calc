import React, { useState, useEffect, useRef } from 'react';
import * as math from 'mathjs';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { 
  Activity, Calculator, History, Check, X, Code, 
  Terminal, BookOpen, Settings, AlertCircle, 
  ChevronRight, Trash2, ChevronDown, ChevronUp, Layers
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = 'graph' | 'steps' | 'history';
type CalcMode = 'normal' | 'complex' | 'matrix';

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
  const [calcMode, setCalcMode] = useState<CalcMode>('normal');
  
  // New state for window settings
  const [windowSettings, setWindowSettings] = useState<WindowSettings>({
    xMin: -10,
    xMax: 10,
    yMin: -10,
    yMax: 10
  });
  const [showWindowSettings, setShowWindowSettings] = useState(false);
  const [tempWindowSettings, setTempWindowSettings] = useState<WindowSettings>(windowSettings);
  
  const displayRef = useRef<HTMLDivElement>(null);

  // Auto-scroll display to right when typing long equations
  useEffect(() => {
    if (displayRef.current) {
      displayRef.current.scrollLeft = displayRef.current.scrollWidth;
    }
  }, [expression]);

  const analyzeError = (err: any, expr: string) => {
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
      const res = math.evaluate(expr, scope);
      const formatRes = typeof res === 'number' ? Number(res.toFixed(10)).toString() : math.format(res, { precision: 14 });
      
      setResult(formatRes);
      setAns(formatRes);
      generateExplanation(expr, false);
      
      setHistory(prev => [{
        id: Math.random().toString(36).substring(2, 9),
        expression: expr,
        result: formatRes,
        timestamp: Date.now()
      }, ...prev]);
      
      setActiveTab('steps');
    } catch(err: any) {
      setResult('Error');
      setError(analyzeError(err, expr));
      generateExplanation(expr, false);
      setActiveTab('steps');
    }
  };

  // Handle MODE button - cycle through calculator modes
  const handleModeButton = () => {
    const modes: CalcMode[] = ['normal', 'complex', 'matrix'];
    const currentIndex = modes.indexOf(calcMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setCalcMode(nextMode);
    
    // Show mode indicator
    let modeIndicator = '';
    switch(nextMode) {
      case 'normal': modeIndicator = 'Normal Mode'; break;
      case 'complex': modeIndicator = 'Complex Mode (use i for imaginary)'; break;
      case 'matrix': modeIndicator = 'Matrix Mode (experimental)'; break;
    }
    generateExplanation(modeIndicator, false);
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


  const generateExplanation = (expr: string, isGraph = false) => {
    const newSteps: Step[] = [];
    try {
      const node = math.parse(expr);
      newSteps.push({ title: 'Parsed Expression', desc: node.toString() });
      
      if (isGraph === true) {
         newSteps.push({ title: 'Function Identified', desc: `f(x) = ${expr}` });
         newSteps.push({ title: 'Action', desc: `Plotted over domain [${windowSettings.xMin}, ${windowSettings.xMax}]` });
         setSteps(newSteps);
         setError('');
         return;
      }

      // Handle text explanations (mode changes, etc.)
      if (typeof isGraph === 'string') {
        newSteps.push({ title: 'Mode Changed', desc: expr });
        setSteps(newSteps);
        return;
      }
      
      let current = expr;
      
      // Try simplification
      try {
        const simplified = math.simplify(expr).toString();
        // Simple check to see if it actually simplified it visually
        if (simplified.replace(/\s/g, '') !== expr.replace(/\s/g, '')) {
          newSteps.push({ title: 'Simplified Form', desc: simplified });
          current = simplified;
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
      setError(analyzeError(err, expr));
    }
  };

  const handleGraph = (exprToGraph?: string) => {
    const targetExpr = exprToGraph || expression;
    if (!targetExpr) return;
    
    setActiveTab('graph');
    
    try {
      const compiled = math.compile(targetExpr);
      const data = [];
      const seenX = new Set();
      
      // Calculate step size based on window
      const step = (windowSettings.xMax - windowSettings.xMin) / 200;
      
      for (let x = windowSettings.xMin; x <= windowSettings.xMax + 0.001; x += step) {
        try {
          let y = compiled.evaluate({ x, Ans: Number(ans) || 0 });
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
      setError(`Cannot plot function: ${analyzeError(err, targetExpr)}`);
      setActiveTab('steps');
    }
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

  const handleCalculate = () => {
    if (!expression) return;

    // Check if ALPHA is active - if so, trigger variable substitution mode
    if (isAlpha) {
      setIsAlpha(false);
      startVariablePrompt(expression);
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

  const sciRows = [
    [
      { label: 'CALC', action: handleCalculate, shiftLabel: 'SOLVE', alphaLabel: '=' },
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

  const numpadRows = [
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
            "w-full h-8 sm:h-9 bg-[#111827] hover:bg-[#1E293B] text-slate-300 rounded-[8px] sm:rounded-[10px] text-xs font-semibold shadow-sm border-b-[3px] border-[#0B0F19] active:border-b-0 active:translate-y-[3px] transition-all",
            btn.label === 'CALC' ? "bg-slate-700 hover:bg-slate-600 border-slate-900" : ""
          )}
        >
          {btn.label}
        </button>
      </div>
    );
  };

  const renderNumButton = (btn: any, i: number) => {
    let variantClass = "bg-[#2A374A] hover:bg-[#334155] text-white border-b-[3px] border-[#161D2E]";
    
    if (btn.type === 'op') {
      variantClass = "bg-blue-900/30 hover:bg-blue-800/40 text-blue-400 border-b-[3px] border-blue-950";
    } else if (btn.type === 'ctrl') {
      variantClass = btn.label === '=' 
        ? "bg-blue-600 hover:bg-blue-500 text-white border-b-[3px] border-blue-800"
        : "bg-red-950/40 hover:bg-red-900/50 text-red-400 border-b-[3px] border-red-900/60";
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

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-200 font-sans selection:bg-blue-500/30 flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl w-full h-[90vh] min-h-[600px] flex flex-col md:flex-row gap-6">
        
        {/* LEFT PANEL: Calculator */}
        <div className="w-full md:w-[420px] flex-shrink-0 flex flex-col bg-[#131A2A] rounded-3xl shadow-2xl shadow-blue-900/10 border border-slate-800/60 overflow-hidden relative z-10">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between bg-[#1A2235]">
            <div className="flex items-center gap-2 text-slate-300">
              <Calculator className="w-5 h-5" />
              <span className="font-semibold text-sm tracking-wide uppercase">MathEngine OS</span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-slate-700" />
              <div className="w-3 h-3 rounded-full bg-slate-700" />
              <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
            </div>
          </div>

          {/* Display */}
          <div className="bg-[#0f1523] p-6 min-h-[140px] flex flex-col justify-end items-end relative shadow-inner">
            <div 
              ref={displayRef}
              className="w-full overflow-x-auto overflow-y-hidden text-right whitespace-nowrap scrollbar-hide mb-2"
            >
              <div className="text-3xl sm:text-4xl font-mono text-slate-300 font-light tracking-wider min-h-[40px]">
                {expression || <span className="opacity-30">0</span>}
              </div>
            </div>
            <div className="text-2xl font-mono text-blue-400 font-semibold h-8 transition-all">
              {result && (result === 'Error' ? <span className="text-red-400">Error</span> : `= ${result}`)}
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
                  <div className="text-[7px] text-cyan-400 absolute -bottom-1 whitespace-nowrap">{calcMode === 'normal' ? 'STD' : calcMode === 'complex' ? 'CPLX' : 'MAT'}</div>
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
        <div className="flex-1 flex flex-col bg-[#131A2A]/80 backdrop-blur-xl rounded-3xl border border-slate-800/60 overflow-hidden shadow-xl">
          
          {/* Tabs */}
          <div className="flex p-3 gap-2 border-b border-slate-800/60 bg-[#1A2235]/50 overflow-x-auto hide-scrollbar">
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
                        className="w-full text-left bg-[#1A2235]/50 hover:bg-[#1E293B] border border-slate-800/80 hover:border-slate-700 p-5 rounded-2xl transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex-1 overflow-hidden">
                          <div className="font-mono text-lg text-slate-300 truncate">{item.expression}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                           <div className="font-mono text-xl text-purple-400 font-semibold truncate max-w-[200px]">= {item.result}</div>
                           <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="h-[60%] flex flex-col items-center justify-center text-slate-500 opacity-60">
                    <History className="w-16 h-16 mb-4 opacity-50 stroke-1" />
                    <p className="text-lg font-medium">No history yet</p>
                    <p className="text-sm mt-2">Your past calculations will appear here</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
      </div>

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
                    [detectedVars[currentVarIndex]]: parseFloat(e.target.value) || 0
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
