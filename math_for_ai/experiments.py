from __future__ import annotations

from typing import Any, Callable

import numpy as np

from .calculus import chain_rule_experiment, derivative_experiment
from .connections import attention_experiment, linear_regression_experiment
from .information import information_experiment
from .linear_algebra import demo_matrix, projection, svd_low_rank, transform_grid
from .numerics import conditioning_experiment
from .optimization import compare_optimizers
from .probability import probability_experiment


def linear_experiment(rank: int = 3, **_: Any) -> dict:
    matrix = np.array([[1.25, 0.45], [0.45, 0.9]])
    return {
        "transformation": transform_grid(matrix),
        "projection": projection(np.array([1.7, 1.2]), np.array([1.0, 0.45])),
        "svd": svd_low_rank(demo_matrix(), rank),
    }


def calculus_experiment(point: float = 1.15, **_: Any) -> dict:
    return {
        "derivative": derivative_experiment(point),
        "chainRule": chain_rule_experiment(),
    }


def optimization_experiment(steps: int = 60, condition: float = 18.0, **_: Any) -> dict:
    return compare_optimizers(steps, condition)


def ai_connections_experiment(**_: Any) -> dict:
    return {
        "regression": linear_regression_experiment(),
        "attention": attention_experiment(),
    }


EXPERIMENTS: dict[str, dict[str, Any]] = {
    "linear": {
        "title": "Linear Algebra",
        "formula": "y = Ax, A ≈ UᵣΣᵣVᵣᵀ",
        "connection": "Embeddings, PCA, attention projections, and LoRA are linear algebra in action.",
        "runner": linear_experiment,
    },
    "calculus": {
        "title": "Calculus",
        "formula": "dL/dw = dL/da · da/dz · dz/dw",
        "connection": "Backpropagation is the chain rule applied across a computation graph.",
        "runner": calculus_experiment,
    },
    "optimization": {
        "title": "Optimization",
        "formula": "θₜ₊₁ = θₜ - η∇L(θₜ)",
        "connection": "Training chooses parameters by navigating a high-dimensional loss surface.",
        "runner": optimization_experiment,
    },
    "probability": {
        "title": "Probability",
        "formula": "P(H|E) = P(E|H)P(H) / P(E)",
        "connection": "AI systems use distributions to represent data, uncertainty, and predictions.",
        "runner": probability_experiment,
    },
    "information": {
        "title": "Information Theory",
        "formula": "H(p,q) = -Σ p(x) log q(x)",
        "connection": "Cross-entropy trains classifiers and language models to match target distributions.",
        "runner": information_experiment,
    },
    "numerics": {
        "title": "Numerical Methods",
        "formula": "softmax(z) = exp(z - max(z)) / Σ exp(z - max(z))",
        "connection": "Stable numerical forms determine whether mathematically correct models run reliably.",
        "runner": conditioning_experiment,
    },
    "connections": {
        "title": "AI Connections",
        "formula": "Attention(Q,K,V) = softmax(QKᵀ/√d)V",
        "connection": "Simple mathematical primitives compose into learning algorithms and neural networks.",
        "runner": ai_connections_experiment,
    },
}


def run_experiment(name: str, parameters: dict[str, Any] | None = None) -> dict:
    if name not in EXPERIMENTS:
        raise ValueError(f"Unknown experiment: {name}")
    definition = EXPERIMENTS[name]
    runner: Callable[..., dict] = definition["runner"]
    result = runner(**(parameters or {}))
    return {
        "id": name,
        "title": definition["title"],
        "formula": definition["formula"],
        "connection": definition["connection"],
        "result": result,
    }
