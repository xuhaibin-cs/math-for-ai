import numpy as np

from math_for_ai.linear_algebra import projection, svd_low_rank, transform_grid


def test_projection_residual_is_orthogonal() -> None:
    result = projection(np.array([2.0, 1.0]), np.array([1.0, 2.0]))

    assert abs(result["orthogonality"]) < 1e-12


def test_full_rank_svd_reconstructs_matrix() -> None:
    matrix = np.array([[3.0, 1.0], [1.0, 2.0], [0.0, 1.0]])
    result = svd_low_rank(matrix, rank=2)

    np.testing.assert_allclose(result["approximation"], matrix, atol=1e-12)
    assert result["energyRetained"] == 1.0


def test_transform_grid_reports_matrix_determinant() -> None:
    matrix = np.array([[2.0, 0.5], [0.0, 3.0]])
    result = transform_grid(matrix)

    assert result["determinant"] == 6.0
    assert len(result["segments"]) == 18

