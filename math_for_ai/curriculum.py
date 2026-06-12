from __future__ import annotations

CURRICULUM = [
    {
        "id": "linear",
        "index": 1,
        "title": "Linear Algebra",
        "subtitle": "Representations and transformations",
        "concepts": ["vectors", "basis", "eigenvectors", "SVD", "low rank"],
        "aiConnections": ["embeddings", "PCA", "attention projections", "LoRA"],
    },
    {
        "id": "calculus",
        "index": 2,
        "title": "Calculus",
        "subtitle": "How models change",
        "concepts": ["derivatives", "partial derivatives", "gradients", "chain rule"],
        "aiConnections": ["backpropagation", "sensitivity", "automatic differentiation"],
    },
    {
        "id": "optimization",
        "index": 3,
        "title": "Optimization",
        "subtitle": "How models learn",
        "concepts": ["loss surfaces", "gradient descent", "momentum", "Adam"],
        "aiConnections": ["training loops", "learning rates", "conditioning"],
    },
    {
        "id": "probability",
        "index": 4,
        "title": "Probability",
        "subtitle": "Reasoning under uncertainty",
        "concepts": ["distributions", "expectation", "variance", "Bayes rule"],
        "aiConnections": ["generative models", "uncertainty", "maximum likelihood"],
    },
    {
        "id": "information",
        "index": 5,
        "title": "Information Theory",
        "subtitle": "Learning distributions",
        "concepts": ["entropy", "cross-entropy", "KL divergence", "temperature"],
        "aiConnections": ["classification loss", "distillation", "language sampling"],
    },
    {
        "id": "numerics",
        "index": 6,
        "title": "Numerical Methods",
        "subtitle": "Making equations computable",
        "concepts": ["floating point", "stability", "conditioning", "normalization"],
        "aiConnections": ["stable softmax", "mixed precision", "gradient scaling"],
    },
]

