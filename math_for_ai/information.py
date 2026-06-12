from __future__ import annotations

import numpy as np


def normalize(probabilities: np.ndarray) -> np.ndarray:
    values = np.asarray(probabilities, dtype=np.float64)
    if np.any(values < 0):
        raise ValueError("probabilities must be non-negative")
    total = float(np.sum(values))
    if total <= 0:
        raise ValueError("probabilities must have positive mass")
    return values / total


def entropy(probabilities: np.ndarray) -> float:
    values = normalize(probabilities)
    nonzero = values > 0
    return float(-np.sum(values[nonzero] * np.log(values[nonzero])))


def cross_entropy(target: np.ndarray, prediction: np.ndarray) -> float:
    target_values = normalize(target)
    prediction_values = np.clip(normalize(prediction), 1e-15, 1.0)
    return float(-np.sum(target_values * np.log(prediction_values)))


def kl_divergence(target: np.ndarray, prediction: np.ndarray) -> float:
    return cross_entropy(target, prediction) - entropy(target)


def softmax(logits: np.ndarray, temperature: float = 1.0) -> np.ndarray:
    if temperature <= 0:
        raise ValueError("temperature must be positive")
    scaled = np.asarray(logits, dtype=np.float64) / temperature
    shifted = scaled - np.max(scaled)
    exponents = np.exp(shifted)
    return exponents / np.sum(exponents)


def information_experiment(temperature: float = 1.0) -> dict:
    logits = np.array([2.4, 1.3, 0.4, -0.2])
    target = np.array([0.7, 0.2, 0.08, 0.02])
    prediction = softmax(logits, temperature)
    temperatures = np.linspace(0.25, 3.0, 80)
    entropies = [entropy(softmax(logits, value)) for value in temperatures]
    return {
        "labels": ["A", "B", "C", "D"],
        "logits": logits.tolist(),
        "target": target.tolist(),
        "prediction": prediction.tolist(),
        "temperature": temperature,
        "entropy": entropy(prediction),
        "crossEntropy": cross_entropy(target, prediction),
        "klDivergence": kl_divergence(target, prediction),
        "temperatureCurve": {
            "temperature": temperatures.tolist(),
            "entropy": entropies,
        },
    }

