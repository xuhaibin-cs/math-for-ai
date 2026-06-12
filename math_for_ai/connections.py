from __future__ import annotations

import math

import numpy as np

from .information import softmax


def linear_regression_experiment(seed: int = 7, steps: int = 80) -> dict:
    rng = np.random.default_rng(seed)
    x = np.linspace(-2.5, 2.5, 48)
    target = 1.65 * x - 0.35 + rng.normal(0, 0.35, size=x.shape)
    weight, bias = -0.7, 0.9
    learning_rate = 0.045
    history = []
    for step in range(steps + 1):
        prediction = weight * x + bias
        error = prediction - target
        loss = float(np.mean(error**2))
        history.append({"step": step, "loss": loss, "weight": weight, "bias": bias})
        if step == steps:
            break
        weight -= learning_rate * float(2 * np.mean(error * x))
        bias -= learning_rate * float(2 * np.mean(error))
    return {
        "x": x.tolist(),
        "target": target.tolist(),
        "prediction": (weight * x + bias).tolist(),
        "history": history,
        "weight": weight,
        "bias": bias,
        "finalLoss": history[-1]["loss"],
    }


def attention_experiment() -> dict:
    tokens = ["math", "shapes", "ai", "models"]
    embeddings = np.array(
        [
            [1.0, 0.1, 0.2],
            [0.8, 0.4, 0.1],
            [0.2, 1.0, 0.4],
            [0.1, 0.8, 0.9],
        ]
    )
    q = embeddings @ np.array([[0.8, 0.1], [0.2, 0.9], [0.3, 0.4]])
    k = embeddings @ np.array([[0.9, 0.2], [0.1, 0.8], [0.4, 0.3]])
    scores = q @ k.T / math.sqrt(q.shape[1])
    weights = np.vstack([softmax(row) for row in scores])
    return {
        "tokens": tokens,
        "scores": scores.tolist(),
        "weights": weights.tolist(),
        "rowSums": np.sum(weights, axis=1).tolist(),
    }

