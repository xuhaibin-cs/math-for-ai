import numpy as np

from math_for_ai.classical_ml import (
    best_decision_stump,
    classification_dataset,
    distance_experiment,
    evaluation_experiment,
    kmeans,
    logistic_experiment,
    margin_experiment,
    pca_experiment,
    regression_experiment,
    ridge_solution,
    roc_curve,
)


def test_ridge_regularization_reduces_coefficient_norm() -> None:
    result = regression_experiment(degree=12, regularization=0.1)

    assert result["ridgeCoefficientNorm"] < result["plainCoefficientNorm"]
    assert result["ridgeTestMse"] < result["plainTestMse"]


def test_ridge_does_not_penalize_intercept() -> None:
    features = np.column_stack([np.ones(4), np.zeros(4)])
    target = np.full(4, 3.5)

    weights = ridge_solution(features, target, strength=100.0)

    np.testing.assert_allclose(weights[0], 3.5)


def test_logistic_classifier_learns_useful_boundary() -> None:
    result = logistic_experiment()

    assert result["accuracy"] > 0.85
    assert result["history"][-1]["loss"] < result["history"][0]["loss"]


def test_pca_one_component_retains_most_variance() -> None:
    result = pca_experiment(components=1)

    assert result["retainedVariance"] > 0.9
    assert result["explainedVarianceRatio"][0] >= result["explainedVarianceRatio"][1]


def test_kmeans_reduces_inertia() -> None:
    rng = np.random.default_rng(3)
    points = np.vstack(
        [
            rng.normal([-1, 0], 0.2, size=(30, 2)),
            rng.normal([1, 0], 0.2, size=(30, 2)),
        ]
    )
    _, labels, inertia = kmeans(points, clusters=2)

    assert len(np.unique(labels)) == 2
    assert inertia[-1] <= inertia[0]


def test_distance_experiment_returns_neighbors_and_centroids() -> None:
    result = distance_experiment(neighbors=5, clusters=3)

    assert len(result["knn"]["neighborIndices"]) == 5
    assert len(result["kmeans"]["centroids"]) == 3


def test_decision_stump_has_positive_information_gain() -> None:
    features, target = classification_dataset()
    result = best_decision_stump(features, target)

    assert result["gain"] > 0
    assert result["feature"] in {0, 1}


def test_svm_margin_contains_support_vectors() -> None:
    result = margin_experiment()

    assert result["marginWidth"] > 0
    assert result["supportIndices"]
    assert result["accuracy"] > 0.85


def test_roc_curve_is_bounded_and_ordered() -> None:
    target = np.array([0, 0, 1, 1])
    scores = np.array([0.1, 0.4, 0.35, 0.8])
    result = roc_curve(target, scores)

    assert 0 <= result["auc"] <= 1
    assert np.all(np.diff(result["falsePositiveRate"]) >= 0)


def test_cross_validation_returns_one_score_per_fold() -> None:
    result = evaluation_experiment(folds=5)

    assert len(result["foldScores"]) == 5
    assert 0 <= result["roc"]["auc"] <= 1

