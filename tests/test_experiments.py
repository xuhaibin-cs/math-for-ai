import pytest

from math_for_ai.experiments import EXPERIMENTS, run_experiment


@pytest.mark.parametrize("name", list(EXPERIMENTS))
def test_all_experiments_produce_structured_results(name: str) -> None:
    experiment = run_experiment(name)

    assert experiment["id"] == name
    assert experiment["formula"]
    assert experiment["connection"]
    assert experiment["result"]


def test_unknown_experiment_is_rejected() -> None:
    with pytest.raises(ValueError):
        run_experiment("unknown")

