from __future__ import annotations

import math

import numpy as np


def scalar_function(x: np.ndarray | float) -> np.ndarray | float:
    return 0.12 * np.asarray(x) ** 4 - 0.8 * np.asarray(x) ** 2 + 0.35 * np.asarray(x)


def scalar_derivative(x: np.ndarray | float) -> np.ndarray | float:
    return 0.48 * np.asarray(x) ** 3 - 1.6 * np.asarray(x) + 0.35


def finite_difference(x: float, epsilon: float = 1e-5) -> float:
    if epsilon <= 0:
        raise ValueError("epsilon must be positive")
    return float((scalar_function(x + epsilon) - scalar_function(x - epsilon)) / (2 * epsilon))


def derivative_experiment(point: float = 1.15) -> dict:
    x = np.linspace(-2.2, 2.2, 180)
    y = scalar_function(x)
    slope = float(scalar_derivative(point))
    tangent = float(scalar_function(point)) + slope * (x - point)
    return {
        "point": point,
        "x": x.tolist(),
        "function": y.tolist(),
        "derivative": np.asarray(scalar_derivative(x)).tolist(),
        "tangent": tangent.tolist(),
        "analyticSlope": slope,
        "finiteDifferenceSlope": finite_difference(point),
        "absoluteError": abs(slope - finite_difference(point)),
    }


def chain_rule_experiment(x: float = 0.8, weight: float = 1.7, bias: float = -0.25) -> dict:
    z = weight * x + bias
    activation = math.tanh(z)
    loss = 0.5 * (activation - 0.4) ** 2
    dloss_dactivation = activation - 0.4
    dactivation_dz = 1 - activation**2
    dz_dweight = x
    gradient = dloss_dactivation * dactivation_dz * dz_dweight
    epsilon = 1e-5

    def evaluate(candidate_weight: float) -> float:
        candidate = math.tanh(candidate_weight * x + bias)
        return 0.5 * (candidate - 0.4) ** 2

    numerical = (evaluate(weight + epsilon) - evaluate(weight - epsilon)) / (2 * epsilon)
    return {
        "nodes": [
            {"id": "x", "label": "x", "value": x},
            {"id": "w", "label": "w", "value": weight},
            {"id": "z", "label": "z = wx + b", "value": z},
            {"id": "a", "label": "tanh(z)", "value": activation},
            {"id": "loss", "label": "loss", "value": loss},
        ],
        "localGradients": {
            "dL/da": dloss_dactivation,
            "da/dz": dactivation_dz,
            "dz/dw": dz_dweight,
        },
        "analyticGradient": gradient,
        "numericalGradient": numerical,
        "absoluteError": abs(gradient - numerical),
    }

