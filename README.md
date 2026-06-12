# Math for AI Lab

A standalone NumPy project for learning the mathematics behind artificial
intelligence through equations, numerical experiments, and interactive
visualization.

![Math for AI Lab dashboard](docs/screenshots/math-for-ai-lab.png)

The project is not a formula encyclopedia. Every topic follows the same chain:

```text
concept -> equation -> NumPy computation -> visualization -> AI application
```

## What Is Implemented

- **Linear algebra:** vector projection, linear transformations, eigenvectors,
  singular values, low-rank approximation, parameter counts
- **Calculus:** analytic derivatives, finite differences, tangents, chain-rule
  backpropagation, gradient checking
- **Optimization:** ill-conditioned loss surfaces, gradient descent, momentum,
  Adam, convergence traces
- **Probability:** Gaussian density, sampling, expectation, variance, Bayesian
  updating
- **Information theory:** entropy, cross-entropy, KL divergence, softmax
  temperature
- **Numerical methods:** conditioning, perturbation amplification, overflow,
  stable softmax
- **AI connections:** linear regression training and scaled dot-product
  attention
- **Classical machine learning:** polynomial and ridge regression, logistic
  classification, PCA, KNN, K-means, decision trees, linear SVM, RBF kernels,
  ROC-AUC, threshold analysis, and cross-validation

## Start the Lab

```bash
cd MathForAI
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m visualizer.server
```

Open:

```text
http://127.0.0.1:8771
```

The browser sends experiment parameters to the Python API. NumPy recomputes the
result, and the page renders the returned geometry and metrics.

## Project Structure

```text
MathForAI/
├── math_for_ai/
│   ├── linear_algebra.py
│   ├── calculus.py
│   ├── optimization.py
│   ├── probability.py
│   ├── information.py
│   ├── numerics.py
│   ├── connections.py
│   ├── classical_ml.py
│   ├── curriculum.py
│   └── experiments.py
├── visualizer/
│   ├── server.py
│   └── static/
├── tests/
└── docs/
    └── STUDY_GUIDE.md
```

## Recommended Learning Order

1. Treat vectors as coordinates and matrices as transformations.
2. Use eigenvectors and SVD to understand representation and compression.
3. Interpret derivatives as sensitivity, then compose them with the chain rule.
4. Compare optimizers on the same loss surface.
5. Treat predictions as probability distributions rather than isolated numbers.
6. Connect cross-entropy and KL divergence to model training.
7. Study numerical stability before increasing model scale or precision demands.
8. Rebuild regression and attention from the preceding mathematical pieces.
9. Enter the Classical ML chain and compare parametric, distance-based,
   tree-based, and margin-based models.
10. Finish with evaluation and cross-validation before treating any fitted
    model as useful.

## Classical Machine Learning Chain

The dashboard contains a second navigation mode named `Classical ML`:

![Classical Machine Learning chain](docs/screenshots/classical-ml-chain.png)

1. **Regression:** polynomial complexity, train/test error, Ridge penalties,
   coefficient norms, and bias-variance behavior
2. **Classification:** logistic probabilities, cross-entropy optimization,
   decision boundaries, and threshold-dependent metrics
3. **PCA:** covariance, eigenvectors, explained variance, projection, and
   reconstruction
4. **Distance methods:** K-nearest neighbors, K-means assignments, centroids,
   and inertia
5. **Decision trees:** entropy, candidate thresholds, information gain, and
   piecewise predictions
6. **Margins and kernels:** hinge loss, support vectors, maximum-margin
   geometry, and RBF similarity
7. **Evaluation:** confusion matrices, precision, recall, F1, ROC-AUC,
   threshold policy, and K-fold cross-validation

## Relationship to the Other Projects

- `ANN` implements neural-network modules and explicit backpropagation.
- `FineTuning` applies low-rank adaptation and modern training workflows.
- `Quantum` uses linear algebra for state vectors, operators, and tensor
  networks.
- `MathForAI` isolates the mathematical ideas shared by all three.

## Tests

```bash
python -m pytest -q
```

The tests cover mathematical invariants, not just code execution:

- Projection residuals are orthogonal.
- Full-rank SVD reconstructs its input.
- Finite differences match analytic derivatives.
- Chain-rule gradients match numerical gradients.
- Adam reduces an ill-conditioned quadratic loss.
- Gaussian density integrates to one.
- KL divergence is non-negative.
- Stable softmax handles large logits.
- Ridge regularization reduces unstable coefficient growth.
- Logistic regression learns a useful probability boundary.
- PCA orders axes by explained variance.
- K-means reduces within-cluster inertia.
- Decision-tree splits have positive information gain.
- SVM support vectors lie near the margin.
- ROC curves are ordered and bounded.
- Cross-validation returns one score per fold.

## Further Reading

- [Deep Learning, Chapter 2: Linear Algebra](https://www.deeplearningbook.org/contents/linear_algebra.html)
- [Stanford CS229 Linear Algebra Review](https://cs229.stanford.edu/section/cs229-linalg.pdf)
- [Google Machine Learning Crash Course: Gradient Descent](https://developers.google.com/machine-learning/crash-course/linear-regression/gradient-descent)

## Scope

This is a compact research and learning environment, not a substitute for a
complete mathematics degree or a production machine-learning framework. The
examples are deliberately low-dimensional so that the computations remain
inspectable.
