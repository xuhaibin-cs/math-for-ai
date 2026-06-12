from __future__ import annotations

import numpy as np


def naive_softmax(logits: np.ndarray) -> np.ndarray:
    exponents = np.exp(np.asarray(logits, dtype=np.float64))
    return exponents / np.sum(exponents)


def stable_softmax(logits: np.ndarray) -> np.ndarray:
    values = np.asarray(logits, dtype=np.float64)
    shifted = values - np.max(values)
    exponents = np.exp(shifted)
    return exponents / np.sum(exponents)


def conditioning_experiment(condition: float = 1000.0) -> dict:
    if condition < 1:
        raise ValueError("condition must be at least 1")
    matrix = np.array([[1.0, 0.0], [0.0, 1.0 / condition]])
    target = np.array([1.0, 1.0 / condition])
    perturbation = np.array([0.0, 1e-6])
    solution = np.linalg.solve(matrix, target)
    perturbed = np.linalg.solve(matrix, target + perturbation)
    logits = np.array([1000.0, 1001.0, 999.0])
    with np.errstate(over="ignore", invalid="ignore"):
        naive = naive_softmax(logits)
    stable = stable_softmax(logits)
    conditions = np.logspace(0, 6, 80)
    amplification = []
    for value in conditions:
        candidate = np.array([[1.0, 0.0], [0.0, 1.0 / value]])
        changed = np.linalg.solve(candidate, np.array([1.0, 1.0 / value]) + perturbation)
        amplification.append(float(np.linalg.norm(changed - solution)))
    return {
        "conditionNumber": float(np.linalg.cond(matrix)),
        "solution": solution.tolist(),
        "perturbedSolution": perturbed.tolist(),
        "solutionChange": float(np.linalg.norm(perturbed - solution)),
        "logits": logits.tolist(),
        "naiveSoftmax": [float(value) if np.isfinite(value) else None for value in naive],
        "stableSoftmax": stable.tolist(),
        "curve": {
            "condition": conditions.tolist(),
            "errorAmplification": amplification,
        },
    }

