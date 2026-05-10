const math = require('mathjs');

const results = [];
function finishLimit(resStr, steps, expr, variable, pointStr) {
    results.push({
        expression: `lim(${variable}→${pointStr}) ${expr}`,
        result: resStr
    });
}

function formatLimitResult(val) {
    if (!isFinite(val)) return val > 0 ? '+∞' : '-∞';
    const absVal = Math.abs(val);
    if (absVal < 1e-11) return '0';
    const rounded = Math.round(val);
    if (Math.abs(val - rounded) < 1e-7) return String(rounded);
    const halves = Math.round(val * 2) / 2;
    if (Math.abs(val - halves) < 1e-3) return String(halves);
    const quarters = Math.round(val * 4) / 4;
    if (Math.abs(val - quarters) < 1e-3) return String(quarters);
    return Number(val.toPrecision(10)).toString();
}

function pickStableValue(vals) {
    const valid = vals.filter(v => isFinite(v) && Math.abs(v) > 1e-15);
    if (valid.length === 0) return vals[vals.length - 1];
    for (let i = valid.length - 1; i > 0; i--) {
        const ratio = Math.abs(valid[i] / valid[i - 1]);
        if (ratio > 0.001 && ratio < 1000) return valid[i];
    }
    return valid[0];
}

function solveLimit(mathExpr, targetStr) {
    const normTarget = targetStr.trim().toLowerCase()
        .replace(/^inf(inity)?$/, 'Infinity')
        .replace(/^-inf(inity)?$/, '-Infinity')
        .replace(/^\+inf(inity)?$/, 'Infinity');

    let target;
    try {
        target = Number(math.evaluate(normTarget));
    } catch {
        target = parseFloat(normTarget);
    }

    const compiled = math.compile(mathExpr);
    const varMatch = mathExpr.match(/\b([a-zA-Z])\b/g) || [];
    const targetVar = varMatch[0] || 'x';

    const evalAt = (val) => {
        try {
            const res = compiled.evaluate({ [targetVar]: val, x: val, X: val, Ans: 0 });
            if (math.typeOf(res) === 'Complex') return Math.abs(res.im) > 1e-9 ? NaN : res.re;
            return typeof res === 'number' ? res : Number(res);
        } catch { return NaN; }
    };

    if (isFinite(target)) {
        const direct = evalAt(target);
        if (isFinite(direct)) return finishLimit(formatLimitResult(direct), [], mathExpr, targetVar, normTarget);

        const epsilons = [1e-3, 1e-4, 1e-5, 1e-6, 1e-7, 1e-8, 1e-9, 1e-10];
        const leftVals = epsilons.map(h => evalAt(target - h));
        const rightVals = epsilons.map(h => evalAt(target + h));
        const validLeft = leftVals.filter(v => !isNaN(v));
        const validRight = rightVals.filter(v => !isNaN(v));

        const oscillates = (arr) => {
            if (arr.length < 4) return false;
            let alternations = 0;
            for (let i = 1; i < arr.length; i++) {
                if (isFinite(arr[i]) && isFinite(arr[i - 1]) && Math.sign(arr[i]) !== Math.sign(arr[i - 1])) alternations++;
            }
            return alternations > arr.length / 2;
        };

        const diverges = (arr) => {
            const last = arr.filter(isFinite);
            if (last.length < 3) return arr.some(v => !isFinite(v));
            return Math.abs(last[last.length - 1]) > 1e10 || (Math.abs(last[last.length - 1]) > Math.abs(last[0]) * 1.5 && Math.abs(last[last.length - 1]) > 1e5);
        };

        if (diverges(validLeft) && diverges(validRight)) {
            const lS = Math.sign(validLeft[validLeft.length - 1]);
            const rS = Math.sign(validRight[validRight.length - 1]);
            return finishLimit(lS === rS ? (lS > 0 ? '+∞' : '-∞') : 'Undefined (diverges to opposite signs)', [], mathExpr, targetVar, normTarget);
        }

        if (oscillates(validLeft) || oscillates(validRight)) return finishLimit('Undefined', [], mathExpr, targetVar, normTarget);

        const lL = pickStableValue(validLeft);
        const lR = pickStableValue(validRight);

        if (isFinite(lL) && isFinite(lR)) {
            if (Math.abs(lL - lR) < 1e-4) return finishLimit(formatLimitResult((lL + lR) / 2), [], mathExpr, targetVar, normTarget);
            return finishLimit('Undefined', [], mathExpr, targetVar, normTarget);
        } else if (isFinite(lL) || isFinite(lR)) {
            return finishLimit(`lim${isFinite(lL) ? '⁻' : '⁺'} = ${formatLimitResult(isFinite(lL) ? lL : lR)}`, [], mathExpr, targetVar, normTarget);
        }
        return finishLimit('Undefined', [], mathExpr, targetVar, normTarget);
    } else {
        const sign = target > 0 ? 1 : -1;
        const probes = [1e2, 1e4, 1e6, 1e8, 1e10, 1e12].map(v => sign * v);
        const vals = probes.map(evalAt).filter(v => !isNaN(v));
        const lastVal = vals[vals.length - 1];
        const firstVal = vals[0];
        let monotonic = true;
        for (let i = 1; i < vals.length; i++) if (Math.abs(vals[i]) < Math.abs(vals[i - 1]) - 1e-12) monotonic = false;

        if (!isFinite(lastVal) || Math.abs(lastVal) > 1e15 || (Math.abs(lastVal) > Math.abs(firstVal) && Math.abs(lastVal) > 10 && monotonic)) {
            return finishLimit(lastVal >= 0 ? '+∞' : '-∞', [], mathExpr, targetVar, normTarget);
        }
        const lastThree = vals.slice(-3);
        if (Math.max(...lastThree) - Math.min(...lastThree) < 1e-5) return finishLimit(formatLimitResult(lastThree.reduce((a, b) => a + b, 0) / 3), [], mathExpr, targetVar, normTarget);
        return finishLimit('Undefined', [], mathExpr, targetVar, normTarget);
    }
}

const testCases = [
    { expr: 'sin(x)/x', target: '0', expected: '1' },
    { expr: '(1-cos(x))/x^2', target: '0', expected: '0.5' },
    { expr: '(2x+1)/(x-1)', target: 'inf', expected: '2' },
    { expr: 'log(x)', target: 'inf', expected: '+∞' },
    { expr: '1/x^2', target: '0', expected: '+∞' },
    { expr: '1/x', target: '0', expected: 'Undefined (diverges to opposite signs)' },
    { expr: 'exp(-x)', target: 'inf', expected: '0' },
    { expr: '(x^2-1)/(x-1)', target: '1', expected: '2' },
    { expr: 'sin(1/x)', target: '0', expected: 'Undefined' }
];

console.log("Running Final Automated Limit Engine Tests...\n");
let passed = 0;
testCases.forEach(tc => {
    solveLimit(tc.expr, tc.target);
    const last = results[results.length - 1];
    const isPass = last.result === tc.expected;
    if (isPass) passed++;
    console.log(`${isPass ? "✅" : "❌"} | ${last.expression} | Got: ${last.result} | Exp: ${tc.expected}`);
});
console.log(`\nFinal Score: ${passed}/${testCases.length} Passed`);
