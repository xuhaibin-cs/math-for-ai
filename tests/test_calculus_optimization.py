from math_for_ai.calculus import chain_rule_experiment, derivative_experiment
from math_for_ai.optimization import optimization_trajectory


def test_finite_difference_matches_analytic_derivative() -> None:
    result = derivative_experiment(point=0.73)

    assert result["absoluteError"] < 1e-8


def test_chain_rule_matches_numerical_gradient() -> None:
    result = chain_rule_experiment()

    assert result["absoluteError"] < 1e-8


def test_adam_reduces_ill_conditioned_quadratic_loss() -> None:
    result = optimization_trajectory(
        "adam",
        steps=100,
        learning_rate=0.08,
        condition=50.0,
    )

    assert result["finalLoss"] < result["history"][0]["loss"] * 0.001

