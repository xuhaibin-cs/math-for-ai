from __future__ import annotations

import numpy as np


def transform_grid(matrix: np.ndarray, extent: float = 2.0, lines: int = 9) -> dict:
    matrix = np.asarray(matrix, dtype=np.float64)
    if matrix.shape != (2, 2):
        raise ValueError("matrix must have shape (2, 2)")
    values = np.linspace(-extent, extent, lines)
    segments = []
    for value in values:
        horizontal = np.array([[-extent, value], [extent, value]])
        vertical = np.array([[value, -extent], [value, extent]])
        for kind, segment in (("horizontal", horizontal), ("vertical", vertical)):
            transformed = segment @ matrix.T
            segments.append(
                {
                    "kind": kind,
                    "original": segment.tolist(),
                    "transformed": transformed.tolist(),
                }
            )
    eigenvalues, eigenvectors = np.linalg.eig(matrix)
    return {
        "matrix": matrix.tolist(),
        "determinant": float(np.linalg.det(matrix)),
        "conditionNumber": float(np.linalg.cond(matrix)),
        "segments": segments,
        "eigenvalues": [float(np.real(value)) for value in eigenvalues],
        "eigenvectors": np.real(eigenvectors).T.tolist(),
    }


def projection(vector: np.ndarray, direction: np.ndarray) -> dict:
    vector = np.asarray(vector, dtype=np.float64)
    direction = np.asarray(direction, dtype=np.float64)
    denominator = float(direction @ direction)
    if denominator == 0:
        raise ValueError("direction must be non-zero")
    projected = (float(vector @ direction) / denominator) * direction
    residual = vector - projected
    return {
        "vector": vector.tolist(),
        "direction": direction.tolist(),
        "projection": projected.tolist(),
        "residual": residual.tolist(),
        "orthogonality": float(projected @ residual),
    }


def svd_low_rank(matrix: np.ndarray, rank: int) -> dict:
    matrix = np.asarray(matrix, dtype=np.float64)
    if matrix.ndim != 2:
        raise ValueError("matrix must be two-dimensional")
    if rank < 1 or rank > min(matrix.shape):
        raise ValueError("rank is outside the matrix dimensions")
    u, singular, vh = np.linalg.svd(matrix, full_matrices=False)
    approximation = (u[:, :rank] * singular[:rank]) @ vh[:rank]
    total_energy = float(np.sum(singular**2))
    retained = float(np.sum(singular[:rank] ** 2) / total_energy) if total_energy else 1.0
    return {
        "matrix": matrix.tolist(),
        "rank": rank,
        "singularValues": singular.tolist(),
        "approximation": approximation.tolist(),
        "relativeError": float(
            np.linalg.norm(matrix - approximation) / max(np.linalg.norm(matrix), 1e-15)
        ),
        "energyRetained": retained,
        "parametersOriginal": int(matrix.size),
        "parametersFactorized": int(rank * (matrix.shape[0] + matrix.shape[1])),
    }


def demo_matrix(size: int = 12) -> np.ndarray:
    x = np.linspace(-2.5, 2.5, size)
    first = np.exp(-0.6 * (x[:, None] ** 2 + x[None, :] ** 2))
    second = 0.7 * np.sin(x[:, None]) * np.cos(1.5 * x[None, :])
    detail = 0.12 * np.eye(size)
    return first + second + detail

