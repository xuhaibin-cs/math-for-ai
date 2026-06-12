from __future__ import annotations

import math
from typing import Any

import numpy as np


def mean_squared_error(prediction: np.ndarray, target: np.ndarray) -> float:
    return float(np.mean((np.asarray(prediction) - np.asarray(target)) ** 2))


def polynomial_features(x: np.ndarray, degree: int) -> np.ndarray:
    values = np.asarray(x, dtype=np.float64).reshape(-1)
    if degree < 1:
        raise ValueError("degree must be positive")
    return np.column_stack([values**power for power in range(degree + 1)])


def ridge_solution(features: np.ndarray, target: np.ndarray, strength: float) -> np.ndarray:
    if strength < 0:
        raise ValueError("regularization strength must be non-negative")
    penalty = np.eye(features.shape[1]) * strength
    penalty[0, 0] = 0.0
    return np.linalg.solve(features.T @ features + penalty, features.T @ target)


def regression_experiment(
    degree: int = 10,
    regularization: float = 0.08,
    seed: int = 7,
    **_: Any,
) -> dict:
    if degree < 1 or degree > 16:
        raise ValueError("degree must be between 1 and 16")
    rng = np.random.default_rng(seed)
    x_train = np.sort(rng.uniform(-1.0, 1.0, 28))
    x_test = np.linspace(-1.05, 1.05, 180)

    def signal(x: np.ndarray) -> np.ndarray:
        return 0.45 * x**3 - 0.65 * x + 0.32 * np.sin(3.2 * x)

    y_train = signal(x_train) + rng.normal(0, 0.11, x_train.shape)
    y_test = signal(x_test)
    train_features = polynomial_features(x_train, degree)
    test_features = polynomial_features(x_test, degree)
    plain_weights = ridge_solution(train_features, y_train, 0.0)
    ridge_weights = ridge_solution(train_features, y_train, regularization)
    plain_train = train_features @ plain_weights
    ridge_train = train_features @ ridge_weights
    plain_test = test_features @ plain_weights
    ridge_test = test_features @ ridge_weights

    degrees = list(range(1, 15))
    train_curve = []
    test_curve = []
    for candidate in degrees:
        candidate_train = polynomial_features(x_train, candidate)
        candidate_test = polynomial_features(x_test, candidate)
        weights = ridge_solution(candidate_train, y_train, regularization)
        train_curve.append(mean_squared_error(candidate_train @ weights, y_train))
        test_curve.append(mean_squared_error(candidate_test @ weights, y_test))

    return {
        "degree": degree,
        "regularization": regularization,
        "xTrain": x_train.tolist(),
        "yTrain": y_train.tolist(),
        "xTest": x_test.tolist(),
        "trueSignal": y_test.tolist(),
        "plainPrediction": plain_test.tolist(),
        "ridgePrediction": ridge_test.tolist(),
        "plainTrainMse": mean_squared_error(plain_train, y_train),
        "plainTestMse": mean_squared_error(plain_test, y_test),
        "ridgeTrainMse": mean_squared_error(ridge_train, y_train),
        "ridgeTestMse": mean_squared_error(ridge_test, y_test),
        "plainCoefficientNorm": float(np.linalg.norm(plain_weights[1:])),
        "ridgeCoefficientNorm": float(np.linalg.norm(ridge_weights[1:])),
        "complexityCurve": {
            "degree": degrees,
            "trainMse": train_curve,
            "testMse": test_curve,
        },
    }


def classification_dataset(seed: int = 11, examples: int = 160) -> tuple[np.ndarray, np.ndarray]:
    rng = np.random.default_rng(seed)
    half = examples // 2
    covariance = np.array([[0.62, 0.22], [0.22, 0.5]])
    negative = rng.multivariate_normal([-0.9, -0.65], covariance, half)
    positive = rng.multivariate_normal([0.95, 0.75], covariance, examples - half)
    features = np.vstack([negative, positive])
    target = np.concatenate([np.zeros(half), np.ones(examples - half)])
    order = rng.permutation(examples)
    return features[order], target[order]


def sigmoid(logits: np.ndarray) -> np.ndarray:
    values = np.clip(np.asarray(logits, dtype=np.float64), -40.0, 40.0)
    return 1.0 / (1.0 + np.exp(-values))


def binary_metrics(target: np.ndarray, prediction: np.ndarray) -> dict:
    target = np.asarray(target, dtype=np.int64)
    prediction = np.asarray(prediction, dtype=np.int64)
    tp = int(np.sum((target == 1) & (prediction == 1)))
    tn = int(np.sum((target == 0) & (prediction == 0)))
    fp = int(np.sum((target == 0) & (prediction == 1)))
    fn = int(np.sum((target == 1) & (prediction == 0)))
    precision = tp / max(tp + fp, 1)
    recall = tp / max(tp + fn, 1)
    return {
        "accuracy": (tp + tn) / max(len(target), 1),
        "precision": precision,
        "recall": recall,
        "f1": 2 * precision * recall / max(precision + recall, 1e-15),
        "confusion": [[tn, fp], [fn, tp]],
    }


def train_logistic(
    features: np.ndarray,
    target: np.ndarray,
    regularization: float = 0.05,
    steps: int = 320,
    learning_rate: float = 0.12,
) -> tuple[np.ndarray, float, list[dict]]:
    features = np.asarray(features, dtype=np.float64)
    target = np.asarray(target, dtype=np.float64)
    weights = np.zeros(features.shape[1], dtype=np.float64)
    bias = 0.0
    history = []
    for step in range(steps + 1):
        probabilities = sigmoid(features @ weights + bias)
        clipped = np.clip(probabilities, 1e-12, 1 - 1e-12)
        loss = float(
            -np.mean(target * np.log(clipped) + (1 - target) * np.log(1 - clipped))
            + 0.5 * regularization * np.sum(weights**2)
        )
        if step == 0 or step % max(1, steps // 80) == 0 or step == steps:
            history.append({"step": step, "loss": loss})
        if step == steps:
            break
        error = probabilities - target
        gradient_w = features.T @ error / len(features) + regularization * weights
        gradient_b = float(np.mean(error))
        weights -= learning_rate * gradient_w
        bias -= learning_rate * gradient_b
    return weights, bias, history


def logistic_experiment(
    regularization: float = 0.05,
    threshold: float = 0.5,
    **_: Any,
) -> dict:
    if not 0 < threshold < 1:
        raise ValueError("threshold must be between 0 and 1")
    features, target = classification_dataset()
    weights, bias, history = train_logistic(features, target, regularization)
    probabilities = sigmoid(features @ weights + bias)
    predictions = (probabilities >= threshold).astype(int)
    metrics = binary_metrics(target, predictions)
    x_bounds = np.array([float(features[:, 0].min() - 0.3), float(features[:, 0].max() + 0.3)])
    if abs(weights[1]) < 1e-12:
        boundary = np.column_stack([np.full(2, -bias / weights[0]), x_bounds])
    else:
        boundary = np.column_stack(
            [x_bounds, -(weights[0] * x_bounds + bias) / weights[1]]
        )
    return {
        "points": features.tolist(),
        "target": target.astype(int).tolist(),
        "probabilities": probabilities.tolist(),
        "weights": weights.tolist(),
        "bias": bias,
        "threshold": threshold,
        "regularization": regularization,
        "boundary": boundary.tolist(),
        "history": history,
        **metrics,
    }


def pca_experiment(components: int = 1, seed: int = 19, **_: Any) -> dict:
    if components not in {1, 2}:
        raise ValueError("components must be 1 or 2")
    rng = np.random.default_rng(seed)
    latent = rng.normal(size=(150, 2))
    transform = np.array([[1.7, 0.35], [1.05, 0.45]])
    points = latent @ transform.T + np.array([0.5, -0.25])
    centered = points - points.mean(axis=0)
    covariance = centered.T @ centered / (len(points) - 1)
    eigenvalues, eigenvectors = np.linalg.eigh(covariance)
    order = np.argsort(eigenvalues)[::-1]
    eigenvalues = eigenvalues[order]
    eigenvectors = eigenvectors[:, order]
    basis = eigenvectors[:, :components]
    scores = centered @ basis
    reconstructed = scores @ basis.T
    explained = eigenvalues / np.sum(eigenvalues)
    return {
        "components": components,
        "points": centered.tolist(),
        "reconstructed": reconstructed.tolist(),
        "covariance": covariance.tolist(),
        "eigenvalues": eigenvalues.tolist(),
        "eigenvectors": eigenvectors.T.tolist(),
        "explainedVarianceRatio": explained.tolist(),
        "retainedVariance": float(np.sum(explained[:components])),
        "reconstructionMse": mean_squared_error(reconstructed, centered),
    }


def knn_predict(
    train_features: np.ndarray,
    train_target: np.ndarray,
    query: np.ndarray,
    neighbors: int,
) -> tuple[int, np.ndarray, np.ndarray]:
    if neighbors < 1 or neighbors > len(train_features):
        raise ValueError("neighbors is outside the training-set size")
    distances = np.linalg.norm(train_features - query, axis=1)
    indices = np.argsort(distances)[:neighbors]
    votes = train_target[indices].astype(int)
    prediction = int(np.mean(votes) >= 0.5)
    return prediction, indices, distances


def kmeans(
    features: np.ndarray,
    clusters: int,
    iterations: int = 30,
) -> tuple[np.ndarray, np.ndarray, list[float]]:
    features = np.asarray(features, dtype=np.float64)
    if clusters < 1 or clusters > len(features):
        raise ValueError("clusters is outside the dataset size")
    seeds = np.linspace(0, len(features) - 1, clusters, dtype=int)
    centroids = features[seeds].copy()
    inertia_history = []
    labels = np.zeros(len(features), dtype=int)
    for _ in range(iterations):
        distances = np.linalg.norm(features[:, None, :] - centroids[None, :, :], axis=2)
        labels = np.argmin(distances, axis=1)
        inertia_history.append(float(np.sum((features - centroids[labels]) ** 2)))
        updated = centroids.copy()
        for index in range(clusters):
            members = features[labels == index]
            if len(members):
                updated[index] = members.mean(axis=0)
        if np.allclose(updated, centroids):
            centroids = updated
            break
        centroids = updated
    return centroids, labels, inertia_history


def distance_experiment(neighbors: int = 7, clusters: int = 3, seed: int = 23, **_: Any) -> dict:
    features, target = classification_dataset(seed=seed, examples=120)
    query = np.array([0.15, -0.05])
    prediction, indices, distances = knn_predict(features, target, query, neighbors)

    rng = np.random.default_rng(seed)
    cluster_points = np.vstack(
        [
            rng.normal([-1.6, 0.9], [0.38, 0.42], size=(45, 2)),
            rng.normal([0.2, -1.25], [0.45, 0.32], size=(45, 2)),
            rng.normal([1.55, 0.75], [0.36, 0.45], size=(45, 2)),
        ]
    )
    centroids, labels, inertia = kmeans(cluster_points, clusters)
    return {
        "knn": {
            "points": features.tolist(),
            "target": target.astype(int).tolist(),
            "query": query.tolist(),
            "neighbors": neighbors,
            "neighborIndices": indices.tolist(),
            "neighborDistances": distances[indices].tolist(),
            "prediction": prediction,
        },
        "kmeans": {
            "points": cluster_points.tolist(),
            "clusters": clusters,
            "labels": labels.tolist(),
            "centroids": centroids.tolist(),
            "inertiaHistory": inertia,
            "finalInertia": inertia[-1],
        },
    }


def entropy(target: np.ndarray) -> float:
    if len(target) == 0:
        return 0.0
    probabilities = np.bincount(np.asarray(target, dtype=int), minlength=2) / len(target)
    nonzero = probabilities > 0
    return float(-np.sum(probabilities[nonzero] * np.log2(probabilities[nonzero])))


def best_decision_stump(features: np.ndarray, target: np.ndarray) -> dict:
    parent_entropy = entropy(target)
    best = {"gain": -math.inf}
    candidates = []
    for feature_index in range(features.shape[1]):
        values = np.unique(features[:, feature_index])
        thresholds = (values[:-1] + values[1:]) / 2
        for threshold in thresholds:
            left = target[features[:, feature_index] <= threshold]
            right = target[features[:, feature_index] > threshold]
            weighted = (len(left) * entropy(left) + len(right) * entropy(right)) / len(target)
            gain = parent_entropy - weighted
            candidates.append(
                {
                    "feature": feature_index,
                    "threshold": float(threshold),
                    "gain": float(gain),
                }
            )
            if gain > best["gain"]:
                left_class = int(np.mean(left) >= 0.5) if len(left) else 0
                right_class = int(np.mean(right) >= 0.5) if len(right) else 1
                best = {
                    "feature": feature_index,
                    "threshold": float(threshold),
                    "gain": float(gain),
                    "leftClass": left_class,
                    "rightClass": right_class,
                }
    return {**best, "parentEntropy": parent_entropy, "candidates": candidates}


def tree_experiment(**_: Any) -> dict:
    features, target = classification_dataset(seed=29, examples=140)
    stump = best_decision_stump(features, target)
    selected = features[:, stump["feature"]]
    predictions = np.where(
        selected <= stump["threshold"],
        stump["leftClass"],
        stump["rightClass"],
    )
    feature_candidates = [
        item for item in stump["candidates"] if item["feature"] == stump["feature"]
    ]
    feature_candidates.sort(key=lambda item: item["threshold"])
    return {
        "points": features.tolist(),
        "target": target.astype(int).tolist(),
        "feature": stump["feature"],
        "threshold": stump["threshold"],
        "informationGain": stump["gain"],
        "parentEntropy": stump["parentEntropy"],
        "leftClass": stump["leftClass"],
        "rightClass": stump["rightClass"],
        "gainCurve": feature_candidates,
        **binary_metrics(target, predictions),
    }


def train_linear_svm(
    features: np.ndarray,
    target: np.ndarray,
    regularization: float = 0.02,
    steps: int = 500,
    learning_rate: float = 0.025,
) -> tuple[np.ndarray, float, list[dict]]:
    labels = np.where(np.asarray(target) > 0, 1.0, -1.0)
    weights = np.zeros(features.shape[1], dtype=np.float64)
    bias = 0.0
    history = []
    for step in range(steps + 1):
        margins = labels * (features @ weights + bias)
        hinge = np.maximum(0.0, 1.0 - margins)
        loss = float(np.mean(hinge) + 0.5 * regularization * np.sum(weights**2))
        if step == 0 or step % max(1, steps // 80) == 0 or step == steps:
            history.append({"step": step, "loss": loss})
        if step == steps:
            break
        active = margins < 1.0
        gradient_w = regularization * weights
        gradient_b = 0.0
        if np.any(active):
            gradient_w -= np.mean(labels[active, None] * features[active], axis=0)
            gradient_b -= float(np.mean(labels[active]))
        weights -= learning_rate * gradient_w
        bias -= learning_rate * gradient_b
    return weights, bias, history


def rbf_kernel(features: np.ndarray, gamma: float) -> np.ndarray:
    differences = features[:, None, :] - features[None, :, :]
    squared = np.sum(differences**2, axis=2)
    return np.exp(-gamma * squared)


def margin_experiment(gamma: float = 0.8, **_: Any) -> dict:
    features, target = classification_dataset(seed=31, examples=120)
    weights, bias, history = train_linear_svm(features, target)
    signed = features @ weights + bias
    predictions = (signed >= 0).astype(int)
    geometric_margin = 1.0 / max(float(np.linalg.norm(weights)), 1e-15)
    support = np.where(np.abs(signed) <= 1.05)[0]
    sample_indices = np.linspace(0, len(features) - 1, 18, dtype=int)
    kernel = rbf_kernel(features[sample_indices], gamma)
    x_bounds = np.array([float(features[:, 0].min() - 0.3), float(features[:, 0].max() + 0.3)])

    def line(offset: float) -> np.ndarray:
        return np.column_stack(
            [x_bounds, -(weights[0] * x_bounds + bias - offset) / weights[1]]
        )

    return {
        "points": features.tolist(),
        "target": target.astype(int).tolist(),
        "weights": weights.tolist(),
        "bias": bias,
        "boundary": line(0.0).tolist(),
        "negativeMargin": line(-1.0).tolist(),
        "positiveMargin": line(1.0).tolist(),
        "marginWidth": 2 * geometric_margin,
        "supportIndices": support.tolist(),
        "history": history,
        "gamma": gamma,
        "kernelMatrix": kernel.tolist(),
        **binary_metrics(target, predictions),
    }


def roc_curve(target: np.ndarray, scores: np.ndarray) -> dict:
    target = np.asarray(target, dtype=np.int64)
    scores = np.asarray(scores, dtype=np.float64)
    order = np.argsort(scores)[::-1]
    sorted_target = target[order]
    true_positive = np.cumsum(sorted_target == 1)
    false_positive = np.cumsum(sorted_target == 0)
    distinct = np.where(np.diff(scores[order]))[0]
    indices = np.concatenate([distinct, [len(scores) - 1]])
    positives = max(int(np.sum(target == 1)), 1)
    negatives = max(int(np.sum(target == 0)), 1)
    tpr = np.concatenate([[0.0], true_positive[indices] / positives])
    fpr = np.concatenate([[0.0], false_positive[indices] / negatives])
    return {
        "falsePositiveRate": fpr.tolist(),
        "truePositiveRate": tpr.tolist(),
        "auc": float(np.trapezoid(tpr, fpr)),
    }


def evaluation_experiment(folds: int = 5, threshold: float = 0.5, **_: Any) -> dict:
    if folds < 2 or folds > 10:
        raise ValueError("folds must be between 2 and 10")
    features, target = classification_dataset(seed=37, examples=180)
    split = 126
    train_x, test_x = features[:split], features[split:]
    train_y, test_y = target[:split], target[split:]
    weights, bias, _ = train_logistic(train_x, train_y)
    probabilities = sigmoid(test_x @ weights + bias)
    predictions = (probabilities >= threshold).astype(int)
    metrics = binary_metrics(test_y, predictions)
    roc = roc_curve(test_y, probabilities)

    fold_indices = np.array_split(np.arange(len(features)), folds)
    fold_scores = []
    for validation_indices in fold_indices:
        training_indices = np.setdiff1d(np.arange(len(features)), validation_indices)
        fold_weights, fold_bias, _ = train_logistic(
            features[training_indices],
            target[training_indices],
            steps=220,
        )
        fold_prediction = (
            sigmoid(features[validation_indices] @ fold_weights + fold_bias) >= 0.5
        ).astype(int)
        fold_scores.append(
            binary_metrics(target[validation_indices], fold_prediction)["accuracy"]
        )

    thresholds = np.linspace(0.05, 0.95, 37)
    precision = []
    recall = []
    f1 = []
    for candidate in thresholds:
        candidate_metrics = binary_metrics(
            test_y,
            (probabilities >= candidate).astype(int),
        )
        precision.append(candidate_metrics["precision"])
        recall.append(candidate_metrics["recall"])
        f1.append(candidate_metrics["f1"])
    return {
        "threshold": threshold,
        "testExamples": len(test_y),
        "probabilities": probabilities.tolist(),
        "target": test_y.astype(int).tolist(),
        "foldScores": fold_scores,
        "crossValidationMean": float(np.mean(fold_scores)),
        "crossValidationStd": float(np.std(fold_scores)),
        "roc": roc,
        "thresholdCurve": {
            "threshold": thresholds.tolist(),
            "precision": precision,
            "recall": recall,
            "f1": f1,
        },
        **metrics,
    }
