from __future__ import annotations

import math

import numpy as np


def gaussian_pdf(x: np.ndarray, mean: float, std: float) -> np.ndarray:
    if std <= 0:
        raise ValueError("std must be positive")
    return np.exp(-0.5 * ((x - mean) / std) ** 2) / (std * math.sqrt(2 * math.pi))


def bayes_update(prior: float, sensitivity: float, false_positive: float) -> float:
    values = (prior, sensitivity, false_positive)
    if any(value < 0 or value > 1 for value in values):
        raise ValueError("probabilities must be in [0, 1]")
    evidence = sensitivity * prior + false_positive * (1 - prior)
    return sensitivity * prior / evidence if evidence else 0.0


def probability_experiment(
    prior: float = 0.12,
    sensitivity: float = 0.9,
    false_positive: float = 0.18,
    seed: int = 7,
) -> dict:
    x = np.linspace(-4.0, 5.0, 240)
    rng = np.random.default_rng(seed)
    samples = rng.normal(0.7, 1.15, 4000)
    counts, edges = np.histogram(samples, bins=24, density=True)
    posterior = bayes_update(prior, sensitivity, false_positive)
    return {
        "x": x.tolist(),
        "gaussian": gaussian_pdf(x, 0.7, 1.15).tolist(),
        "histogram": {
            "centers": ((edges[:-1] + edges[1:]) / 2).tolist(),
            "density": counts.tolist(),
        },
        "sampleMean": float(np.mean(samples)),
        "sampleVariance": float(np.var(samples)),
        "prior": prior,
        "posterior": posterior,
        "sensitivity": sensitivity,
        "falsePositiveRate": false_positive,
    }

