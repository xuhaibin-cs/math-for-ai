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
let chain = "foundations";

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
    content += `<rect x="${left + c * size}" y="${top + r * size}" width="${size - 2}" height="${size - 2}" rx="2" fill="${COLORS.cyan}" opacity="${opacity}"/>`;
    if (matrix.length <= 8) {
      content += `<text x="${left + c * size + size / 2}" y="${top + r * size + size / 2 + 3}" text-anchor="middle" fill="#eef4fa" font-size="9">${fmt(value, 2)}</text>`;
    }
  }));
  labels.forEach((label, index) => {
    content += `<text x="${left + index * size + size / 2}" y="${top - 10}" text-anchor="middle" fill="#8d9bb0" font-size="9">${label}</text>
      <text x="${left - 9}" y="${top + index * size + size / 2 + 3}" text-anchor="end" fill="#8d9bb0" font-size="9">${label}</text>`;
  });
  svg.innerHTML = content;
}

function scatterPlot(svg, points, labels, options = {}) {
  const width = options.width || 760, height = 330;
  const left = 50, right = 18, top = 24, bottom = 34;
  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);
  const xMin = options.xMin ?? Math.min(...xs) - .25;
  const xMax = options.xMax ?? Math.max(...xs) + .25;
  const yMin = options.yMin ?? Math.min(...ys) - .25;
  const yMax = options.yMax ?? Math.max(...ys) + .25;
  const x = (value) => left + (value - xMin) / (xMax - xMin) * (width - left - right);
  const y = (value) => height - bottom - (value - yMin) / (yMax - yMin) * (height - top - bottom);
  const grid = Array.from({ length: 5 }, (_, index) => {
    const yy = top + index / 4 * (height - top - bottom);
    return `<line x1="${left}" y1="${yy}" x2="${width - right}" y2="${yy}" stroke="${COLORS.line}"/>`;
  }).join("");
  const highlighted = new Set(options.highlights || []);
  const palette = [COLORS.cyan, COLORS.violet, COLORS.green, COLORS.red];
  const circles = points.map((point, index) => {
    const color = palette[(labels?.[index] ?? 0) % palette.length];
    const radius = highlighted.has(index) ? 6 : 3.2;
    const stroke = highlighted.has(index) ? COLORS.amber : "none";
    return `<circle cx="${x(point[0])}" cy="${y(point[1])}" r="${radius}" fill="${color}" stroke="${stroke}" stroke-width="2" opacity=".82"/>`;
  }).join("");
  const lines = (options.lines || []).map((line) => {
    const start = line.points[0], end = line.points[1];
    return `<path d="M${x(start[0])},${y(start[1])} L${x(end[0])},${y(end[1])}" stroke="${line.color}" stroke-width="${line.width || 2}" stroke-dasharray="${line.dash || ""}"/>`;
  }).join("");
  const query = options.query
    ? `<circle cx="${x(options.query[0])}" cy="${y(options.query[1])}" r="7" fill="${COLORS.amber}" stroke="#eef4fa" stroke-width="1.5"/>`
    : "";
  const centroids = (options.centroids || []).map((point) =>
    `<path d="M${x(point[0]) - 7},${y(point[1])} L${x(point[0]) + 7},${y(point[1])} M${x(point[0])},${y(point[1]) - 7} L${x(point[0])},${y(point[1]) + 7}" stroke="${COLORS.amber}" stroke-width="3"/>`
  ).join("");
  svg.innerHTML = `${grid}<line x1="${left}" y1="${height - bottom}" x2="${width - right}" y2="${height - bottom}" stroke="${COLORS.muted}"/>${circles}${lines}${query}${centroids}`;
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

function scatterWithCurves(svg, curveX, pointX, pointY, series) {
  const allY = [...pointY, ...series.flatMap((item) => item.values)];
  const yMin = Math.min(...allY) - .12;
  const yMax = Math.max(...allY) + .12;
  lineChart(svg, series.map((item) => ({
    points: curveX.map((x, index) => [x, item.values[index]]),
    color: item.color,
    width: item.width || 2,
    opacity: item.opacity || 1,
  })), { yMin, yMax });
  const width = 760, height = 330, left = 50, right = 18, top = 25, bottom = 34;
  const xMin = Math.min(...curveX), xMax = Math.max(...curveX);
  const sx = (value) => left + (value - xMin) / (xMax - xMin) * (width - left - right);
  const sy = (value) => height - bottom - (value - yMin) / (yMax - yMin) * (height - top - bottom);
  svg.innerHTML += pointX.map((value, index) =>
    `<circle cx="${sx(value)}" cy="${sy(pointY[index])}" r="3.2" fill="${COLORS.cyan}" opacity=".85"/>`
  ).join("");
}

function renderCurriculum() {
  const stages = chain === "classical" ? state.classicalCurriculum : [
    ...state.curriculum,
    { id: "connections", index: 7, title: "AI Connections", subtitle: "Compose the pieces" },
  ];
  $("curriculum").innerHTML = stages.map((stage) => `
    <button class="stage-button ${active === stage.id ? "active" : ""}" data-view="${stage.id}">
      <span>${String(stage.index).padStart(2, "0")}</span>
      <div><strong>${stage.title}</strong><small>${stage.subtitle}</small></div>
    </button>`).join("");
  $("foundationChain").classList.toggle("active", chain === "foundations");
  $("classicalChain").classList.toggle("active", chain === "classical");
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
    ml_regression: `<div class="control"><label>Degree</label><input id="degreeControl" type="number" min="1" max="16" value="10"></div><div class="control"><label>Ridge λ</label><input id="ridgeControl" type="number" min="0" max="2" step=".01" value=".08"></div>`,
    ml_logistic: `<div class="control"><label>L2 strength</label><input id="logisticL2" type="number" min="0" max="1" step=".01" value=".05"></div><div class="control"><label>Threshold</label><input id="classThreshold" type="number" min=".05" max=".95" step=".05" value=".5"></div>`,
    ml_pca: `<div class="control"><label>Components</label><select id="pcaComponents"><option selected>1</option><option>2</option></select></div>`,
    ml_distance: `<div class="control"><label>K neighbors</label><input id="neighborsControl" type="number" min="1" max="25" value="7"></div><div class="control"><label>K clusters</label><select id="clustersControl"><option>2</option><option selected>3</option><option>4</option></select></div>`,
    ml_tree: "",
    ml_margin: `<div class="control"><label>RBF gamma</label><input id="gammaControl" type="number" min=".1" max="3" step=".1" value=".8"></div>`,
    ml_evaluation: `<div class="control"><label>CV folds</label><input id="foldsControl" type="number" min="2" max="10" value="5"></div><div class="control"><label>Threshold</label><input id="evalThreshold" type="number" min=".05" max=".95" step=".05" value=".5"></div>`,
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
  if (name === "ml_regression") return { degree: Number($("degreeControl").value), regularization: Number($("ridgeControl").value) };
  if (name === "ml_logistic") return { regularization: Number($("logisticL2").value), threshold: Number($("classThreshold").value) };
  if (name === "ml_pca") return { components: Number($("pcaComponents").value) };
  if (name === "ml_distance") return { neighbors: Number($("neighborsControl").value), clusters: Number($("clustersControl").value) };
  if (name === "ml_margin") return { gamma: Number($("gammaControl").value) };
  if (name === "ml_evaluation") return { folds: Number($("foldsControl").value), threshold: Number($("evalThreshold").value) };
  return {};
}

async function selectChain(nextChain) {
  chain = nextChain;
  active = chain === "classical" ? "ml_regression" : "linear";
  renderCurriculum();
  controlsFor(active);
  if (state.initial[active]) {
    current = state.initial[active];
    renderExperiment();
  } else {
    await runActive();
  }
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

function renderMlRegression(result) {
  setMetrics([
    ["Polynomial degree", result.degree],
    ["Ridge λ", fmt(result.regularization, 2)],
    ["Plain test MSE", fmt(result.plainTestMse)],
    ["Ridge test MSE", fmt(result.ridgeTestMse)],
    ["Norm reduction", `${fmt(result.plainCoefficientNorm / result.ridgeCoefficientNorm, 1)}×`],
  ]);
  setHeaders("FUNCTION FITTING", "Polynomial Regression", "BIAS–VARIANCE", "Error vs Model Degree",
    `<span><i style="background:${COLORS.cyan}"></i>samples</span><span><i style="background:${COLORS.red}"></i>plain</span><span><i style="background:${COLORS.violet}"></i>ridge</span>`);
  scatterWithCurves($("primaryChart"), result.xTest, result.xTrain, result.yTrain, [
    { values: result.trueSignal, color: COLORS.green, width: 1.5, opacity: .7 },
    { values: result.plainPrediction, color: COLORS.red },
    { values: result.ridgePrediction, color: COLORS.violet, width: 2.5 },
  ]);
  lineChart($("secondaryChart"), [
    { points: result.complexityCurve.degree.map((degree, index) => [degree, Math.log10(result.complexityCurve.trainMse[index] + 1e-10)]), color: COLORS.cyan },
    { points: result.complexityCurve.degree.map((degree, index) => [degree, Math.log10(result.complexityCurve.testMse[index] + 1e-10)]), color: COLORS.amber },
  ], { width: 470 });
  $("insightText").textContent = "Higher-degree features reduce training error but can amplify noise. Ridge regularization trades a little flexibility for smaller coefficients and more stable test behavior.";
  setDetails([["Plain coefficient norm", fmt(result.plainCoefficientNorm)], ["Ridge coefficient norm", fmt(result.ridgeCoefficientNorm)], ["Ridge train MSE", fmt(result.ridgeTrainMse)]]);
}

function renderMlLogistic(result) {
  setMetrics([
    ["Accuracy", `${fmt(result.accuracy * 100, 1)}%`],
    ["Precision", fmt(result.precision)],
    ["Recall", fmt(result.recall)],
    ["F1", fmt(result.f1)],
    ["Threshold", fmt(result.threshold, 2)],
  ]);
  setHeaders("DECISION SPACE", "Probability Boundary", "OPTIMIZATION", "Logistic Loss",
    `<span><i style="background:${COLORS.cyan}"></i>class 0</span><span><i style="background:${COLORS.violet}"></i>class 1</span>`);
  scatterPlot($("primaryChart"), result.points, result.target, {
    lines: [{ points: result.boundary, color: COLORS.amber, width: 2.5 }],
  });
  lineChart($("secondaryChart"), [{
    points: result.history.map((row) => [row.step, row.loss]),
    color: COLORS.green,
  }], { width: 470, yMin: 0 });
  $("insightText").textContent = "Logistic regression models log odds with a linear score. The threshold is a policy choice layered on top of probability estimation, so changing it alters precision and recall.";
  setDetails([["Weight norm", fmt(Math.hypot(...result.weights))], ["Bias", fmt(result.bias)], ["L2 strength", fmt(result.regularization, 2)]]);
}

function renderMlPca(result) {
  setMetrics([
    ["Components", result.components],
    ["PC1 variance", `${fmt(result.explainedVarianceRatio[0] * 100, 1)}%`],
    ["Retained variance", `${fmt(result.retainedVariance * 100, 1)}%`],
    ["Reconstruction MSE", fmt(result.reconstructionMse)],
    ["Covariance det", fmt(result.covariance[0][0] * result.covariance[1][1] - result.covariance[0][1] ** 2)],
  ]);
  setHeaders("FEATURE SPACE", "Principal Axes and Reconstruction", "VARIANCE", "Explained Variance",
    `<span><i style="background:${COLORS.cyan}"></i>data</span><span><i style="background:${COLORS.amber}"></i>principal axes</span>`);
  const scale = Math.sqrt(result.eigenvalues[0]) * 2.4;
  const lines = result.eigenvectors.map((vector, index) => ({
    points: [[-vector[0] * scale, -vector[1] * scale], [vector[0] * scale, vector[1] * scale]],
    color: index === 0 ? COLORS.amber : COLORS.green,
    width: index === 0 ? 3 : 2,
    dash: index === 0 ? "" : "5 4",
  }));
  scatterPlot($("primaryChart"), result.points, result.points.map(() => 0), { lines });
  barChart($("secondaryChart"), result.explainedVarianceRatio.map((value, index) => ({ label: `PC${index + 1}`, value })), [COLORS.violet, COLORS.cyan]);
  $("insightText").textContent = "PCA diagonalizes the covariance matrix. The first principal axis captures the greatest variance; discarding smaller axes compresses data while introducing reconstruction error.";
  setDetails([["Eigenvalue 1", fmt(result.eigenvalues[0])], ["Eigenvalue 2", fmt(result.eigenvalues[1])], ["Discarded variance", `${fmt((1 - result.retainedVariance) * 100, 1)}%`]]);
}

function renderMlDistance(result) {
  const knn = result.knn;
  const clusters = result.kmeans;
  setMetrics([
    ["K neighbors", knn.neighbors],
    ["KNN prediction", `class ${knn.prediction}`],
    ["K clusters", clusters.clusters],
    ["Final inertia", fmt(clusters.finalInertia)],
    ["K-means iterations", clusters.inertiaHistory.length],
  ]);
  setHeaders("LOCAL LEARNING", "K-Nearest Neighbors", "PROTOTYPES", "K-means Clusters",
    `<span><i style="background:${COLORS.amber}"></i>query / centroids</span>`);
  scatterPlot($("primaryChart"), knn.points, knn.target, {
    highlights: knn.neighborIndices,
    query: knn.query,
  });
  scatterPlot($("secondaryChart"), clusters.points, clusters.labels, {
    width: 470,
    centroids: clusters.centroids,
  });
  $("insightText").textContent = "KNN predicts from nearby labeled examples; K-means repeatedly assigns points to the nearest centroid and moves each centroid to the mean of its assigned cluster.";
  setDetails([["Nearest distance", fmt(Math.min(...knn.neighborDistances))], ["Farthest selected", fmt(Math.max(...knn.neighborDistances))], ["Initial inertia", fmt(clusters.inertiaHistory[0])]]);
}

function renderMlTree(result) {
  setMetrics([
    ["Parent entropy", fmt(result.parentEntropy)],
    ["Information gain", fmt(result.informationGain)],
    ["Split feature", `x${result.feature + 1}`],
    ["Threshold", fmt(result.threshold)],
    ["Accuracy", `${fmt(result.accuracy * 100, 1)}%`],
  ]);
  setHeaders("PARTITION", "Best Decision Stump", "SPLIT SEARCH", "Information Gain",
    `<span><i style="background:${COLORS.amber}"></i>selected split</span>`);
  const allX = result.points.map((point) => point[0]);
  const allY = result.points.map((point) => point[1]);
  const splitLine = result.feature === 0
    ? [[result.threshold, Math.min(...allY) - .3], [result.threshold, Math.max(...allY) + .3]]
    : [[Math.min(...allX) - .3, result.threshold], [Math.max(...allX) + .3, result.threshold]];
  scatterPlot($("primaryChart"), result.points, result.target, {
    lines: [{ points: splitLine, color: COLORS.amber, width: 3 }],
  });
  lineChart($("secondaryChart"), [{
    points: result.gainCurve.map((item) => [item.threshold, item.gain]),
    color: COLORS.violet,
  }], { width: 470, yMin: 0 });
  $("insightText").textContent = "A decision tree searches for the split that most reduces uncertainty. Repeating this local operation creates a hierarchy of human-readable, piecewise decision regions.";
  setDetails([["Left prediction", `class ${result.leftClass}`], ["Right prediction", `class ${result.rightClass}`], ["F1", fmt(result.f1)]]);
}

function renderMlMargin(result) {
  setMetrics([
    ["Accuracy", `${fmt(result.accuracy * 100, 1)}%`],
    ["Margin width", fmt(result.marginWidth)],
    ["Support vectors", result.supportIndices.length],
    ["RBF gamma", fmt(result.gamma, 2)],
    ["F1", fmt(result.f1)],
  ]);
  setHeaders("MAXIMUM MARGIN", "Linear SVM Geometry", "KERNEL TRICK", "RBF Similarity Matrix",
    `<span><i style="background:${COLORS.amber}"></i>boundary</span><span><i style="background:${COLORS.green}"></i>margins</span>`);
  scatterPlot($("primaryChart"), result.points, result.target, {
    highlights: result.supportIndices,
    lines: [
      { points: result.boundary, color: COLORS.amber, width: 2.8 },
      { points: result.negativeMargin, color: COLORS.green, dash: "5 4" },
      { points: result.positiveMargin, color: COLORS.green, dash: "5 4" },
    ],
  });
  heatmap($("secondaryChart"), result.kernelMatrix);
  $("insightText").textContent = "SVM training focuses on points near the boundary. A wider margin improves robustness, while an RBF kernel represents nonlinear similarity without explicitly constructing every transformed feature.";
  setDetails([["Weight norm", fmt(Math.hypot(...result.weights))], ["Initial hinge loss", fmt(result.history[0].loss)], ["Final hinge loss", fmt(result.history.at(-1).loss)]]);
}

function renderMlEvaluation(result) {
  setMetrics([
    ["Test accuracy", `${fmt(result.accuracy * 100, 1)}%`],
    ["ROC AUC", fmt(result.roc.auc)],
    ["CV mean", `${fmt(result.crossValidationMean * 100, 1)}%`],
    ["CV std", `${fmt(result.crossValidationStd * 100, 1)}%`],
    ["Threshold", fmt(result.threshold, 2)],
  ]);
  setHeaders("DISCRIMINATION", "ROC Curve", "THRESHOLD POLICY", "Precision, Recall, and F1",
    `<span><i style="background:${COLORS.cyan}"></i>model</span><span><i style="background:${COLORS.muted}"></i>random</span>`);
  lineChart($("primaryChart"), [
    { points: result.roc.falsePositiveRate.map((value, index) => [value, result.roc.truePositiveRate[index]]), color: COLORS.cyan, width: 2.5 },
    { points: [[0, 0], [1, 1]], color: COLORS.muted, width: 1, opacity: .7 },
  ], { xMin: 0, xMax: 1, yMin: 0, yMax: 1 });
  lineChart($("secondaryChart"), [
    { points: result.thresholdCurve.threshold.map((value, index) => [value, result.thresholdCurve.precision[index]]), color: COLORS.violet },
    { points: result.thresholdCurve.threshold.map((value, index) => [value, result.thresholdCurve.recall[index]]), color: COLORS.amber },
    { points: result.thresholdCurve.threshold.map((value, index) => [value, result.thresholdCurve.f1[index]]), color: COLORS.green },
  ], { width: 470, xMin: 0, xMax: 1, yMin: 0, yMax: 1 });
  $("insightText").textContent = "Accuracy alone hides error type and threshold tradeoffs. ROC measures ranking across thresholds, while cross-validation estimates how sensitive performance is to the sampled training split.";
  const [[tn, fp], [fn, tp]] = result.confusion;
  setDetails([["TN / FP", `${tn} / ${fp}`], ["FN / TP", `${fn} / ${tp}`], ["CV folds", result.foldScores.length]]);
}

function renderExperiment() {
  const stages = chain === "classical" ? state.classicalCurriculum : [
    ...state.curriculum,
    { id: "connections", index: 7 },
  ];
  const stage = stages.find((item) => item.id === active);
  $("stageLabel").textContent = `${chain === "classical" ? "CLASSICAL" : "STAGE"} ${String(stage?.index || 1).padStart(2, "0")}`;
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
    ml_regression: renderMlRegression,
    ml_logistic: renderMlLogistic,
    ml_pca: renderMlPca,
    ml_distance: renderMlDistance,
    ml_tree: renderMlTree,
    ml_margin: renderMlMargin,
    ml_evaluation: renderMlEvaluation,
  };
  renderers[active](current.result);
}

async function boot() {
  state = await api("/api/state");
  const requested = new URLSearchParams(window.location.search).get("view");
  if (requested && state.experiments[requested]) {
    active = requested;
    chain = requested.startsWith("ml_") ? "classical" : "foundations";
  }
  $("foundationChain").addEventListener("click", () => selectChain("foundations"));
  $("classicalChain").addEventListener("click", () => selectChain("classical"));
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
