from __future__ import annotations

import numpy as np


def quadratic(point: np.ndarray, condition: float = 18.0) -> float:
    x, y = np.asarray(point, dtype=np.float64)
    return float(0.5 * (condition * x**2 + y**2))


def quadratic_gradient(point: np.ndarray, condition: float = 18.0) -> np.ndarray:
    x, y = np.asarray(point, dtype=np.float64)
    return np.array([condition * x, y], dtype=np.float64)


def optimization_trajectory(
    method: str,
    steps: int = 60,
    learning_rate: float = 0.08,
    condition: float = 18.0,
    start: tuple[float, float] = (1.8, 2.2),
) -> dict:
    if method not in {"gd", "momentum", "adam"}:
        raise ValueError("method must be gd, momentum, or adam")
    point = np.asarray(start, dtype=np.float64)
    velocity = np.zeros(2)
    first = np.zeros(2)
    second = np.zeros(2)
    beta1, beta2 = 0.9, 0.999
    history = []
    for step in range(steps + 1):
        gradient = quadratic_gradient(point, condition)
        history.append(
            {
                "step": step,
                "x": float(point[0]),
                "y": float(point[1]),
                "loss": quadratic(point, condition),
                "gradientNorm": float(np.linalg.norm(gradient)),
            }
        )
        if step == steps:
            break
        if method == "gd":
            update = learning_rate * gradient
        elif method == "momentum":
            velocity = 0.9 * velocity + gradient
            update = learning_rate * velocity
        else:
            first = beta1 * first + (1 - beta1) * gradient
            second = beta2 * second + (1 - beta2) * gradient**2
            corrected_first = first / (1 - beta1 ** (step + 1))
            corrected_second = second / (1 - beta2 ** (step + 1))
            update = learning_rate * corrected_first / (np.sqrt(corrected_second) + 1e-8)
        point = point - update
    return {
        "method": method,
        "learningRate": learning_rate,
        "conditionNumber": condition,
        "history": history,
        "finalLoss": history[-1]["loss"],
    }


def compare_optimizers(steps: int = 60, condition: float = 18.0) -> dict:
    rates = {"gd": 0.05, "momentum": 0.02, "adam": 0.08}
    runs = {
        method: optimization_trajectory(method, steps, rate, condition)
        for method, rate in rates.items()
    }
    return {"runs": runs, "conditionNumber": condition, "steps": steps}

