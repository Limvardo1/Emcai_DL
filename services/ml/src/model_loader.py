"""Pemuatan model dan inferensi."""
from __future__ import annotations

import re
import threading
from dataclasses import dataclass, field

import joblib
import numpy as np

from .config import MODEL_PATH, MODEL_VERSION

_TOKEN_RE = re.compile(r"[a-z0-9+#.]+")


@dataclass
class ModelBundle:
    pipeline: object
    classes: list[str]
    metrics: dict = field(default_factory=dict)
    best_parameters: dict = field(default_factory=dict)
    skill_dictionary: list[str] = field(default_factory=list)
    vocab_set: set[str] = field(default_factory=set)

    # -- inference ---------------------------------------------------------
    def predict_proba(self, text: str) -> np.ndarray:
        return np.asarray(self.pipeline.predict_proba([text])[0], dtype=float)

    def ranked(self, text: str) -> list[dict]:
        proba = self.predict_proba(text)
        order = np.argsort(proba)[::-1]
        return [
            {"category": self.classes[i], "probability": float(proba[i])}
            for i in order
        ]

    # -- diagnostik --------------------------------------------------------
    def in_vocab_ratio(self, text: str) -> float:
        tokens = _TOKEN_RE.findall(text.lower())
        if not tokens:
            return 0.0
        known = sum(1 for t in tokens if t in self.vocab_set)
        return known / len(tokens)

    def info(self) -> dict:
        tfidf = self.pipeline.named_steps.get("tfidf")
        mlp = self.pipeline.named_steps.get("mlp")
        return {
            "model_version": MODEL_VERSION,
            "algorithm": "TF-IDF + MLPClassifier",
            "vectorizer": type(tfidf).__name__ if tfidf is not None else None,
            "vocabulary_size": int(len(getattr(tfidf, "vocabulary_", {}))),
            "classifier": type(mlp).__name__ if mlp is not None else None,
            "hidden_layer_sizes": list(getattr(mlp, "hidden_layer_sizes", [])),
            "activation": getattr(mlp, "activation", None),
            "solver": getattr(mlp, "solver", None),
            "alpha": getattr(mlp, "alpha", None),
            "learning_rate_init": getattr(mlp, "learning_rate_init", None),
            "n_iter": getattr(mlp, "n_iter_", None),
            "classes": self.classes,
            "n_classes": len(self.classes),
            "metrics": self.metrics,
            "best_parameters": self.best_parameters,
            "loss_curve": [float(x) for x in getattr(mlp, "loss_curve_", [])],
        }


_LOCK = threading.Lock()
_BUNDLE: ModelBundle | None = None


def load_model() -> ModelBundle:
    global _BUNDLE
    if _BUNDLE is not None:
        return _BUNDLE
    with _LOCK:
        if _BUNDLE is not None:
            return _BUNDLE
        raw = joblib.load(MODEL_PATH)
        pipeline = raw["model"]
        tfidf = pipeline.named_steps["tfidf"]
        _BUNDLE = ModelBundle(
            pipeline=pipeline,
            classes=[str(c) for c in raw["classes"]],
            metrics=dict(raw.get("metrics") or {}),
            best_parameters=dict(raw.get("best_parameters") or {}),
            skill_dictionary=list(raw.get("skill_dictionary") or []),
            vocab_set=set(tfidf.vocabulary_.keys()),
        )
    return _BUNDLE
