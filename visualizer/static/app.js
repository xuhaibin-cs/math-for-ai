const $ = (id) => document.getElementById(id);
const COLORS = {
  cyan: "#55d8ff",
  violet: "#9d7cff",
  green: "#54d6a1",
  amber: "#ffbd62",
  muted: "#607089",
  line: "#263449",
};

let state = null;
let active = "linear";
let current = null;

async function api(path, payload = null) {
  const options = payload
    ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
    : {};
  const response = await fetch(path, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}

function fmt(value, digits = 3) {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  const numeric = Number(value);
  if (numeric !== 0 && (Math.abs(numeric) < 1e-3 || Math.abs(numeric) >= 1e4)) {
    return numeric.toExponential(2);
  }
  return numeric.toFixed(digits);
}

function pathFrom(points, xScale, yScale) {
  return points.map((point, index) => `${index ? "L" : "M"}${xScale(point[0])},${yScale(point[1])}`).join(" ");
}

function lineChart(svg, series, options = {}) {
  const width = options.width || 760;
  const height = 330;
  const margin = { left: 50, right: 18, top: 25, bottom: 34 };
  const all = series.flatMap((item) => item.points);
  const xs = all.map((point) => Number(point[0]));
  const ys = all.map((point) => Number(point[1]));
  let xMin = options.xMin ?? Math.min(...xs);
  let xMax = options.xMax ?? Math.max(...xs);
  let yMin = options.yMin ?? Math.min(...ys);
  let yMax = options.yMax ?? Math.max(...ys);
  if (xMin === xMax) xMax += 1;
  if (yMin === yMax) yMax += 1;
  const x = (value) => margin.left + (value - xMin) / (xMax - xMin) * (width - margin.left - margin.right);
  const y = (value) => height - margin.bottom - (value - yMin) / (yMax - yMin) * (height - margin.top - margin.bottom);
  const grid = Array.from({ length: 5 }, (_, index) => {
    const yy = margin.top + index / 4 * (height - margin.top - margin.bottom);
    return `<line x1="${margin.left}" y1="${yy}" x2="${width - margin.right}" y2="${yy}" stroke="${COLORS.line}" stroke-width="1"/>`;
  }).join("");
  const paths = series.map((item) =>
    `<path d="${pathFrom(item.points, x, y)}" fill="none" stroke="${item.color}" stroke-width="${item.width || 2}" opacity="${item.opacity || 1}"/>`
  ).join("");
  svg.innerHTML = `
    ${grid}
    <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="${COLORS.muted}"/>
    <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="${COLORS.muted}"/>
    ${paths}
    <text x="${margin.left}" y="${height - 10}" fill="#8d9bb0" font-size="9">${fmt(xMin, 2)}</text>
    <text x="${width - margin.right}" y="${height - 10}" text-anchor="end" fill="#8d9bb0" font-size="9">${fmt(xMax, 2)}</text>
    <text x="8" y="${margin.top + 4}" fill="#8d9bb0" font-size="9">${fmt(yMax, 2)}</text>
    <text x="8" y="${height - margin.bottom}" fill="#8d9bb0" font-size="9">${fmt(yMin, 2)}</text>`;
}

function barChart(svg, values, colors = [], width = 470) {
  const height = 330, left = 38, right = 16, top = 28, bottom = 42;
  const max = Math.max(...values.map((item) => item.value), 1e-12);
  const slot = (width - left - right) / values.length;
  svg.innerHTML = values.map((item, index) => {
    const barHeight = item.value / max * (height - top - bottom);
    const x = left + index * slot + slot * 0.18;
    const y = height - bottom - barHeight;
    return `<rect x="${x}" y="${y}" width="${slot * .64}" height="${barHeight}" rx="3" fill="${colors[index] || COLORS.violet}" opacity=".9"/>
      <text x="${x + slot * .32}" y="${height - 20}" text-anchor="middle" fill="#8d9bb0" font-size="9">${item.label}</text>
      <text x="${x + slot * .32}" y="${Math.max(15, y - 6)}" text-anchor="middle" fill="#eef4fa" font-size="9">${fmt(item.value, 2)}</text>`;
  }).join("") + `<line x1="${left}" y1="${height - bottom}" x2="${width - right}" y2="${height - bottom}" stroke="${COLORS.muted}"/>`;
}

function heatmap(svg, matrix, labels = []) {
  const width = 470, height = 330, left = 78, top = 35;
  const size = Math.min(235 / matrix.length, 70);
  const values = matrix.flat();
  const min = Math.min(...values), max = Math.max(...values);
  let content = "";
  matrix.forEach((row, r) => row.forEach((value, c) => {
    const ratio = (value - min) / Math.max(1e-12, max - min);
    const opacity = .12 + ratio * .88;
    content += `<rect x="${left + c * size}" y="${top + r * size}" width="${size - 2}" height="${size - 2}" rx="3" fill="${COLORS.cyan}" opacity="${opacity}"/>
      <text x="${left + c * size + size / 2}" y="${top + r * size + size / 2 + 3}" text-anchor="middle" fill="#eef4fa" font-size="9">${fmt(value, 2)}</text>`;
  }));
  labels.forEach((label, index) => {
    content += `<text x="${left + index * size + size / 2}" y="${top - 10}" text-anchor="middle" fill="#8d9bb0" font-size="9">${label}</text>
      <text x="${left - 9}" y="${top + index * size + size / 2 + 3}" text-anchor="end" fill="#8d9bb0" font-size="9">${label}</text>`;
  });
  svg.innerHTML = content;
}

function scatterWithLine(svg, xValues, yValues, prediction) {
  const points = xValues.map((x, index) => [x, yValues[index]]);
  const line = xValues.map((x, index) => [x, prediction[index]]);
  lineChart(svg, [{ points: line, color: COLORS.violet, width: 2.5 }], { yMin: Math.min(...yValues) - .5, yMax: Math.max(...yValues) + .5 });
  const width = 760, height = 330, left = 50, right = 18, top = 25, bottom = 34;
  const xMin = Math.min(...xValues), xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues) - .5, yMax = Math.max(...yValues) + .5;
  const sx = (value) => left + (value - xMin) / (xMax - xMin) * (width - left - right);
  const sy = (value) => height - bottom - (value - yMin) / (yMax - yMin) * (height - top - bottom);
  svg.innerHTML += points.map((point) => `<circle cx="${sx(point[0])}" cy="${sy(point[1])}" r="3" fill="${COLORS.cyan}" opacity=".8"/>`).join("");
}

function renderCurriculum() {
  $("curriculum").innerHTML = state.curriculum.map((stage) => `
    <button class="stage-button ${active === stage.id ? "active" : ""}" data-view="${stage.id}">
      <span>${String(stage.index).padStart(2, "0")}</span>
      <div><strong>${stage.title}</strong><small>${stage.subtitle}</small></div>
    </button>`).join("");
  document.querySelector(".connection-button").classList.toggle("active", active === "connections");
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => selectExperiment(button.dataset.view));
  });
}

function controlsFor(name) {
  const controls = {
    linear: `<div class="control"><label>Approximation rank</label><select id="rankControl"><option>1</option><option>2</option><option selected>3</option><option>4</option><option>6</option></select></div>`,
    calculus: `<div class="control"><label>Tangent point</label><input id="pointControl" type="number" min="-2" max="2" step=".1" value="1.15"></div>`,
    optimization: `<div class="control"><label>Condition</label><input id="conditionControl" type="number" min="2" max="80" value="18"></div><div class="control"><label>Steps</label><input id="stepsControl" type="number" min="10" max="160" value="60"></div>`,
    probability: `<div class="control"><label>Prior</label><input id="priorControl" type="number" min=".01" max=".99" step=".01" value=".12"></div>`,
    information: `<div class="control"><label>Temperature</label><input id="temperatureControl" type="number" min=".1" max="4" step=".1" value="1"></div>`,
    numerics: `<div class="control"><label>Condition</label><select id="numericCondition"><option>10</option><option>100</option><option selected>1000</option><option>10000</option></select></div>`,
    connections: "",
  };
  $("controls").innerHTML = `${controls[name]}<button id="runButton" class="run-button">Recompute</button>`;
  $("runButton").addEventListener("click", runActive);
}

function parametersFor(name) {
  if (name === "linear") return { rank: Number($("rankControl").value) };
  if (name === "calculus") return { point: Number($("pointControl").value) };
  if (name === "optimization") return { condition: Number($("conditionControl").value), steps: Number($("stepsControl").value) };
  if (name === "probability") return { prior: Number($("priorControl").value) };
  if (name === "information") return { temperature: Number($("temperatureControl").value) };
  if (name === "numerics") return { condition: Number($("numericCondition").value) };
  return {};
}

async function selectExperiment(name) {
  active = name;
  renderCurriculum();
  controlsFor(name);
  if (state.initial[name]) {
    current = state.initial[name];
    renderExperiment();
  } else {
    await runActive();
  }
}

async function runActive() {
  const button = $("runButton");
  button.disabled = true;
  $("status").textContent = `Computing ${active} experiment...`;
  try {
    current = await api("/api/experiment", { name: active, parameters: parametersFor(active) });
    renderExperiment();
    $("status").textContent = `${current.title} recomputed from NumPy results.`;
    $("status").classList.remove("error");
  } catch (error) {
    $("status").textContent = error.message;
    $("status").classList.add("error");
  } finally {
    button.disabled = false;
  }
}

function setMetrics(items) {
  $("metrics").innerHTML = items.map(([label, value]) => `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`).join("");
}

function setDetails(items) {
  $("detailStrip").innerHTML = items.map(([label, value]) => `<div class="detail"><span>${label}</span><strong>${value}</strong></div>`).join("");
}

function setHeaders(primaryEyebrow, primaryTitle, secondaryEyebrow, secondaryTitle, legend = "") {
  $("primaryEyebrow").textContent = primaryEyebrow;
  $("primaryTitle").textContent = primaryTitle;
  $("secondaryEyebrow").textContent = secondaryEyebrow;
  $("secondaryTitle").textContent = secondaryTitle;
  $("legend").innerHTML = legend;
}

function renderLinear(result) {
  const transformation = result.transformation;
  const svd = result.svd;
  setMetrics([
    ["Determinant", fmt(transformation.determinant)],
    ["Condition number", fmt(transformation.conditionNumber)],
    ["SVD rank", svd.rank],
    ["Energy retained", `${fmt(svd.energyRetained * 100, 1)}%`],
    ["Relative error", fmt(svd.relativeError)],
  ]);
  setHeaders("GEOMETRY", "Linear Transformation", "DECOMPOSITION", "Singular Values",
    `<span><i style="background:${COLORS.muted}"></i>basis</span><span><i style="background:${COLORS.cyan}"></i>transformed</span>`);
  const svg = $("primaryChart");
  const width = 760, height = 330, scale = 58, cx = width / 2, cy = height / 2;
  const map = (point) => [cx + point[0] * scale, cy - point[1] * scale];
  const segments = transformation.segments.map((segment) => {
    const original = segment.original.map(map);
    const changed = segment.transformed.map(map);
    return `<path d="M${original[0]} L${original[1]}" stroke="${COLORS.muted}" opacity=".28"/>
      <path d="M${changed[0]} L${changed[1]}" stroke="${COLORS.cyan}" opacity=".68"/>`;
  }).join("");
  const eigen = transformation.eigenvectors.map((vector) => {
    const start = map([-vector[0] * 2.5, -vector[1] * 2.5]);
    const end = map([vector[0] * 2.5, vector[1] * 2.5]);
    return `<path d="M${start} L${end}" stroke="${COLORS.amber}" stroke-width="2.5"/>`;
  }).join("");
  svg.innerHTML = segments + eigen;
  barChart($("secondaryChart"), svd.singularValues.slice(0, 7).map((value, index) => ({ label: `σ${index + 1}`, value })));
  $("insightText").textContent = "A matrix reshapes space. Its determinant measures area scaling, eigenvectors reveal invariant directions, and SVD orders the transformation into reusable rank-one components.";
  setDetails([["Original params", svd.parametersOriginal], ["Factorized params", svd.parametersFactorized], ["Projection dot residual", fmt(result.projection.orthogonality)]]);
}

function renderCalculus(result) {
  const derivative = result.derivative;
  const chain = result.chainRule;
  setMetrics([
    ["Point", fmt(derivative.point, 2)],
    ["Analytic slope", fmt(derivative.analyticSlope)],
    ["Finite difference", fmt(derivative.finiteDifferenceSlope)],
    ["Gradient error", fmt(derivative.absoluteError)],
    ["Chain-rule error", fmt(chain.absoluteError)],
  ]);
  setHeaders("LOCAL CHANGE", "Function and Tangent", "BACKPROPAGATION", "Local Gradient Product",
    `<span><i style="background:${COLORS.cyan}"></i>f(x)</span><span><i style="background:${COLORS.violet}"></i>tangent</span>`);
  lineChart($("primaryChart"), [
    { points: derivative.x.map((x, index) => [x, derivative.function[index]]), color: COLORS.cyan },
    { points: derivative.x.map((x, index) => [x, derivative.tangent[index]]), color: COLORS.violet },
  ]);
  barChart($("secondaryChart"), Object.entries(chain.localGradients).map(([label, value]) => ({ label, value: Math.abs(value) })), [COLORS.green, COLORS.amber, COLORS.cyan]);
  $("insightText").textContent = "A derivative is a local sensitivity. Backpropagation multiplies local sensitivities along the computation graph, allowing one loss value to assign responsibility to every parameter.";
  setDetails([["Analytic dL/dw", fmt(chain.analyticGradient)], ["Numeric dL/dw", fmt(chain.numericalGradient)], ["Loss", fmt(chain.nodes.at(-1).value)]]);
}

function renderOptimization(result) {
  const runs = result.runs;
  setMetrics([
    ["Condition number", fmt(result.conditionNumber, 1)],
    ["Steps", result.steps],
    ["GD final loss", fmt(runs.gd.finalLoss)],
    ["Momentum loss", fmt(runs.momentum.finalLoss)],
    ["Adam final loss", fmt(runs.adam.finalLoss)],
  ]);
  setHeaders("PARAMETER SPACE", "Optimizer Trajectories", "CONVERGENCE", "Loss by Step",
    `<span><i style="background:${COLORS.cyan}"></i>GD</span><span><i style="background:${COLORS.amber}"></i>Momentum</span><span><i style="background:${COLORS.violet}"></i>Adam</span>`);
  lineChart($("primaryChart"), [
    { points: runs.gd.history.map((row) => [row.x, row.y]), color: COLORS.cyan },
    { points: runs.momentum.history.map((row) => [row.x, row.y]), color: COLORS.amber },
    { points: runs.adam.history.map((row) => [row.x, row.y]), color: COLORS.violet },
  ], { xMin: -2.3, xMax: 2.3, yMin: -2.8, yMax: 2.8 });
  lineChart($("secondaryChart"), [
    { points: runs.gd.history.map((row) => [row.step, Math.log10(row.loss + 1e-10)]), color: COLORS.cyan },
    { points: runs.momentum.history.map((row) => [row.step, Math.log10(row.loss + 1e-10)]), color: COLORS.amber },
    { points: runs.adam.history.map((row) => [row.step, Math.log10(row.loss + 1e-10)]), color: COLORS.violet },
  ], { width: 470 });
  $("insightText").textContent = "Ill-conditioned surfaces have steep and flat directions. A single global learning rate struggles to serve both; momentum accumulates direction, while Adam rescales coordinates using gradient statistics.";
  setDetails([["GD rate", runs.gd.learningRate], ["Momentum rate", runs.momentum.learningRate], ["Adam rate", runs.adam.learningRate]]);
}

function renderProbability(result) {
  setMetrics([
    ["Expected value", "0.700"],
    ["Sample mean", fmt(result.sampleMean)],
    ["Theoretical variance", fmt(1.15 ** 2)],
    ["Sample variance", fmt(result.sampleVariance)],
    ["Posterior", `${fmt(result.posterior * 100, 1)}%`],
  ]);
  setHeaders("DISTRIBUTION", "Density and Samples", "BAYES RULE", "Prior to Posterior",
    `<span><i style="background:${COLORS.cyan}"></i>density</span><span><i style="background:${COLORS.violet}"></i>samples</span>`);
  lineChart($("primaryChart"), [
    { points: result.x.map((x, index) => [x, result.gaussian[index]]), color: COLORS.cyan, width: 2.5 },
    { points: result.histogram.centers.map((x, index) => [x, result.histogram.density[index]]), color: COLORS.violet, opacity: .8 },
  ], { yMin: 0 });
  barChart($("secondaryChart"), [
    { label: "prior", value: result.prior },
    { label: "posterior", value: result.posterior },
  ], [COLORS.muted, COLORS.green]);
  $("insightText").textContent = "A distribution describes both typical values and uncertainty. Bayes rule combines prior belief with evidence, which is the core pattern behind probabilistic inference.";
  setDetails([["Sensitivity", fmt(result.sensitivity)], ["False positive", fmt(result.falsePositiveRate)], ["Evidence gain", `${fmt(result.posterior / result.prior, 2)}×`]]);
}

function renderInformation(result) {
  setMetrics([
    ["Temperature", fmt(result.temperature, 2)],
    ["Entropy", fmt(result.entropy)],
    ["Cross-entropy", fmt(result.crossEntropy)],
    ["KL divergence", fmt(result.klDivergence)],
    ["Top probability", `${fmt(Math.max(...result.prediction) * 100, 1)}%`],
  ]);
  setHeaders("PREDICTION", "Target and Model Distribution", "UNCERTAINTY", "Entropy vs Temperature",
    `<span><i style="background:${COLORS.cyan}"></i>target</span><span><i style="background:${COLORS.violet}"></i>prediction</span>`);
  const combined = result.labels.flatMap((label, index) => [
    { label: `${label} t`, value: result.target[index] },
    { label: `${label} p`, value: result.prediction[index] },
  ]);
  barChart($("primaryChart"), combined, combined.map((_, index) => index % 2 ? COLORS.violet : COLORS.cyan), 760);
  lineChart($("secondaryChart"), [{
    points: result.temperatureCurve.temperature.map((value, index) => [value, result.temperatureCurve.entropy[index]]),
    color: COLORS.amber,
  }], { width: 470, yMin: 0 });
  $("insightText").textContent = "Entropy measures uncertainty. Cross-entropy adds the cost of using the wrong distribution, and KL divergence isolates that mismatch. Temperature controls how concentrated model choices become.";
  setDetails([["H(target)", fmt(result.crossEntropy - result.klDivergence)], ["H(target,pred)", fmt(result.crossEntropy)], ["KL", fmt(result.klDivergence)]]);
}

function renderNumerics(result) {
  setMetrics([
    ["Condition number", fmt(result.conditionNumber, 0)],
    ["Input perturbation", "1.00e−6"],
    ["Solution change", fmt(result.solutionChange)],
    ["Naive softmax", result.naiveSoftmax.some((value) => value == null) ? "overflow" : "finite"],
    ["Stable sum", fmt(result.stableSoftmax.reduce((a, b) => a + b, 0))],
  ]);
  setHeaders("SENSITIVITY", "Error Amplification", "STABILITY", "Large-Logit Softmax");
  lineChart($("primaryChart"), [{
    points: result.curve.condition.map((value, index) => [Math.log10(value), Math.log10(result.curve.errorAmplification[index] + 1e-15)]),
    color: COLORS.red,
  }]);
  barChart($("secondaryChart"), result.stableSoftmax.map((value, index) => ({ label: `z${index + 1}`, value })), [COLORS.cyan, COLORS.violet, COLORS.green]);
  $("insightText").textContent = "Correct equations can still fail numerically. Conditioning describes sensitivity in the problem itself; stable algorithms, such as max-shifted softmax, prevent avoidable floating-point overflow.";
  setDetails([["x₂ before", fmt(result.solution[1])], ["x₂ after", fmt(result.perturbedSolution[1])], ["Amplification", `${fmt(result.solutionChange / 1e-6, 1)}×`]]);
}

function renderConnections(result) {
  const regression = result.regression;
  const attention = result.attention;
  setMetrics([
    ["Regression weight", fmt(regression.weight)],
    ["Regression bias", fmt(regression.bias)],
    ["Final MSE", fmt(regression.finalLoss)],
    ["Attention tokens", attention.tokens.length],
    ["Row-sum error", fmt(Math.max(...attention.rowSums.map((value) => Math.abs(value - 1))))],
  ]);
  setHeaders("LEARNING", "Linear Regression", "ATTENTION", "Token-to-Token Weights",
    `<span><i style="background:${COLORS.cyan}"></i>data</span><span><i style="background:${COLORS.violet}"></i>fit</span>`);
  scatterWithLine($("primaryChart"), regression.x, regression.target, regression.prediction);
  heatmap($("secondaryChart"), attention.weights, attention.tokens);
  $("insightText").textContent = "Regression combines linear algebra, calculus, probability, and optimization. Attention adds learned projections and normalized similarity, showing how elementary mathematics composes into modern AI.";
  setDetails([["Initial loss", fmt(regression.history[0].loss)], ["Loss reduction", `${fmt(regression.history[0].loss / regression.finalLoss, 1)}×`], ["Attention rows", "Σ = 1"]]);
}

function renderExperiment() {
  const definition = state.experiments[active];
  $("stageLabel").textContent = active === "connections" ? "STAGE 07" : `STAGE ${String(state.curriculum.find((item) => item.id === active)?.index || 7).padStart(2, "0")}`;
  $("experimentTitle").textContent = current.title;
  $("connectionText").textContent = current.connection;
  $("formulaCard").querySelector("strong").textContent = current.formula;
  const renderers = {
    linear: renderLinear,
    calculus: renderCalculus,
    optimization: renderOptimization,
    probability: renderProbability,
    information: renderInformation,
    numerics: renderNumerics,
    connections: renderConnections,
  };
  renderers[active](current.result);
}

async function boot() {
  state = await api("/api/state");
  const requested = new URLSearchParams(window.location.search).get("view");
  if (requested && state.experiments[requested]) active = requested;
  renderCurriculum();
  controlsFor(active);
  if (state.initial[active]) {
    current = state.initial[active];
    renderExperiment();
  } else {
    await runActive();
  }
  $("status").textContent = "Ready. Every chart is generated from live NumPy experiment data.";
}

boot().catch((error) => {
  $("status").textContent = error.message;
  $("status").classList.add("error");
});
