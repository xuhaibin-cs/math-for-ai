import numpy as np

from math_for_ai.information import entropy, kl_divergence, softmax
from math_for_ai.numerics import stable_softmax
from math_for_ai.probability import bayes_update, gaussian_pdf


def test_bayes_positive_evidence_increases_probability() -> None:
    posterior = bayes_update(prior=0.1, sensitivity=0.9, false_positive=0.1)

    assert posterior > 0.1


def test_gaussian_density_integrates_to_one() -> None:
    x = np.linspace(-8, 8, 20000)
    area = np.trapezoid(gaussian_pdf(x, 0.0, 1.0), x)

    assert abs(area - 1.0) < 1e-6


def test_kl_divergence_is_non_negative() -> None:
    p = np.array([0.7, 0.2, 0.1])
    q = np.array([0.2, 0.3, 0.5])

    assert kl_divergence(p, q) >= 0
    assert entropy(p) > 0


def test_stable_softmax_handles_large_logits() -> None:
    result = stable_softmax(np.array([1000.0, 1001.0, 999.0]))

    assert np.all(np.isfinite(result))
    np.testing.assert_allclose(result, softmax(np.array([1000.0, 1001.0, 999.0])))
    np.testing.assert_allclose(np.sum(result), 1.0)

