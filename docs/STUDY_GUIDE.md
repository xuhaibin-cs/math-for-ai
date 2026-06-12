# Progressive Study Guide

## How to Use the Project

For each stage:

1. Read the equation in the dashboard.
2. Predict what the visualization should do when a parameter changes.
3. Recompute the experiment.
4. Inspect the corresponding Python module.
5. Derive one result by hand.
6. Change the experiment and add a test for the expected invariant.

## Stage 1: Linear Algebra

### Core Questions

- What information does a vector encode?
- How does a matrix change a basis and reshape space?
- Which directions remain unchanged except for scale?
- Why does a low-rank matrix use fewer degrees of freedom?

### Experiments

- Observe area scaling through the determinant.
- Compare original and transformed grid lines.
- Follow eigenvector directions through the transformation.
- Change the SVD rank and measure retained energy and approximation error.

### AI Connection

Dense layers, embedding projections, PCA, attention projections, and LoRA all
use matrix transformations. LoRA specifically constrains a weight update to a
low-rank factorization.

## Stage 2: Calculus

### Core Questions

- What does a derivative measure locally?
- Why is the gradient perpendicular to a level curve?
- How does the chain rule assign responsibility through a computation graph?
- How can a numerical gradient detect a backward-pass bug?

### Experiments

- Move the tangent point across a nonlinear function.
- Compare analytic and finite-difference derivatives.
- Multiply local derivatives in the chain-rule graph.
- Verify the final gradient numerically.

### AI Connection

Backpropagation is an efficient organization of the chain rule. Automatic
differentiation changes how derivatives are computed, but not the mathematics
being computed.

## Stage 3: Optimization

### Core Questions

- Why does gradient descent zigzag in a narrow valley?
- What does the learning rate control?
- How does momentum accumulate direction?
- Why does Adam rescale coordinates?

### Experiments

- Increase the condition number.
- Compare parameter-space paths.
- Compare loss on a logarithmic scale.
- Find a learning rate that makes gradient descent unstable.

### AI Connection

Model training is numerical optimization over many parameters. Architecture,
normalization, initialization, data scale, and optimizer settings all affect
the geometry of this problem.

## Stage 4: Probability

### Core Questions

- How do expectation and variance summarize a distribution?
- Why do samples fluctuate around theoretical values?
- How does a likelihood transform a prior into a posterior?
- What assumptions are hidden inside a probability model?

### Experiments

- Compare Gaussian density with a sample histogram.
- Change the prior probability.
- Compare posterior changes under different false-positive rates.

### AI Connection

Generative models define or approximate distributions. Classification outputs
are normalized scores interpreted as probabilities, and uncertainty requires
more than selecting the largest score.

## Stage 5: Information Theory

### Core Questions

- What does entropy measure?
- Why is cross-entropy larger than target entropy?
- What does KL divergence isolate?
- How does temperature reshape a softmax distribution?

### Experiments

- Lower temperature to sharpen predictions.
- Raise temperature to increase uncertainty.
- Compare target and model distributions.
- Verify `cross_entropy = entropy + KL`.

### AI Connection

Cross-entropy is central to classification and language modeling. KL divergence
appears in variational methods, distillation, and distribution matching.

## Stage 6: Numerical Methods

### Core Questions

- What is the difference between an ill-conditioned problem and an unstable
  algorithm?
- Why can a tiny input perturbation create a large output change?
- Why does naive softmax overflow?
- How do normalization and precision choices affect training?

### Experiments

- Increase the matrix condition number.
- Measure error amplification.
- Compare naive and max-shifted softmax.

### AI Connection

Large models perform enormous numbers of floating-point operations. Stable
formulas, normalization, loss scaling, and precision policies are essential to
obtaining usable results.

## Stage 7: AI Connections

### Linear Regression

This experiment combines:

- linear algebra for the affine prediction,
- calculus for gradients,
- probability for the noise model,
- optimization for parameter fitting.

### Attention

This experiment combines:

- learned linear projections,
- dot-product similarity,
- scale normalization,
- softmax probability weights,
- weighted aggregation.

## Suggested Extensions

1. Add PCA with a two-dimensional point cloud.
2. Add logistic regression and decision boundaries.
3. Add Jacobian-vector and vector-Jacobian products.
4. Add maximum likelihood and MAP estimation.
5. Add covariance, whitening, and normalization.
6. Add Hessian eigenvalues and curvature.
7. Import a small metric trace from `ANN` or `FineTuning` and explain it using
   the mathematical modules here.

# Classical Machine Learning Chain

The Classical ML chain begins after the mathematical foundations. Its purpose
is to compare different assumptions about how a model should learn.

## Classical 1: Regression and Regularization

### Core Questions

- How does polynomial degree change model capacity?
- Why can training error decrease while test error increases?
- How does Ridge regularization shrink coefficients?
- What is the relationship between model complexity, bias, and variance?

### Experiments

- Increase polynomial degree and inspect train/test error.
- Set the Ridge penalty to zero and observe coefficient growth.
- Increase the penalty until the model underfits.
- Compare coefficient norm with held-out error.

## Classical 2: Logistic Classification

### Core Questions

- Why does a sigmoid convert a score into a probability?
- How is cross-entropy related to maximum likelihood?
- What geometric shape does a linear classifier produce?
- Why is the classification threshold separate from model training?

### Experiments

- Change L2 strength and inspect the boundary.
- Move the probability threshold.
- Compare accuracy, precision, recall, and F1.
- Follow cross-entropy during gradient descent.

## Classical 3: PCA and Feature Geometry

### Core Questions

- What does a covariance matrix measure?
- Why are principal components covariance eigenvectors?
- How much variance is retained after projection?
- What information appears as reconstruction error?

### Experiments

- Retain one component, then two.
- Compare eigenvalues and explained-variance ratios.
- Relate the principal axes to the point-cloud geometry.

## Classical 4: KNN and K-means

### Core Questions

- How does local voting differ from fitting global parameters?
- How does the choice of K affect KNN?
- Why does K-means alternate assignment and centroid updates?
- What does inertia measure?

### Experiments

- Change the number of neighbors around the fixed query.
- Change the number of clusters.
- Identify selected neighbors and final centroids.
- Follow inertia from initialization to convergence.

## Classical 5: Decision Trees

### Core Questions

- How does entropy quantify class uncertainty?
- What makes one threshold better than another?
- Why are tree predictions piecewise constant?
- How do deep trees overfit?

### Experiments

- Inspect information gain across candidate thresholds.
- Compare parent entropy with post-split uncertainty.
- Read the selected feature and class rule directly.

## Classical 6: Margins and Kernels

### Core Questions

- Why does hinge loss ignore confidently correct points?
- Which points become support vectors?
- Why is a wide margin desirable?
- How does an RBF kernel turn distance into similarity?

### Experiments

- Inspect the decision boundary and both margin lines.
- Identify highlighted support vectors.
- Change RBF gamma and observe similarity concentration.
- Compare initial and final hinge loss.

## Classical 7: Evaluation and Generalization

### Core Questions

- Which errors appear inside a confusion matrix?
- Why do precision and recall move when the threshold changes?
- What does ROC-AUC measure independently of one threshold?
- Why is cross-validation more informative than one train/test split?
- How can data leakage invalidate every metric?

### Experiments

- Move the threshold and follow precision, recall, and F1.
- Inspect the ROC curve against random ranking.
- Compare fold-level accuracy and its standard deviation.
- Treat validation choices as part of the experiment, not an afterthought.
