from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from typing import Protocol

from PIL import Image

MODEL_ID = "rakib730/vit-base-oxford-iiit-pets"
CAT_BREEDS = {"abyssinian", "bengal", "birman", "bombay", "british_shorthair", "egyptian_mau", "maine_coon", "persian", "ragdoll", "russian_blue", "siamese", "sphynx"}

@dataclass(frozen=True)
class BreedCandidate:
    breed: str
    confidence: float

@dataclass(frozen=True)
class BreedResult:
    candidates: tuple[BreedCandidate, ...]
    verdict: str
    is_cat: bool

class BreedClassifier(Protocol):
    def classify(self, image_bytes: bytes) -> BreedResult: ...

class OxfordPetsClassifier:
    """Lazy local ViT inference. Model/provider details stay outside the UI."""
    def __init__(self, model_id: str = MODEL_ID) -> None:
        from transformers import AutoImageProcessor, AutoModelForImageClassification
        self.processor = AutoImageProcessor.from_pretrained(model_id)
        self.model = AutoModelForImageClassification.from_pretrained(model_id)
        self.model.eval()

    def classify(self, image_bytes: bytes) -> BreedResult:
        import torch
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        inputs = self.processor(images=image, return_tensors="pt")
        with torch.inference_mode():
            probabilities = self.model(**inputs).logits.softmax(dim=-1)[0]
        values, indices = torch.topk(probabilities, k=min(8, probabilities.numel()))
        all_candidates, cat_candidates = [], []
        for score, index in zip(values.tolist(), indices.tolist()):
            normalized = self.model.config.id2label[index].strip().lower().replace(" ", "_")
            candidate = BreedCandidate(normalized.replace("_", " ").title(), float(score))
            all_candidates.append(candidate)
            if normalized in CAT_BREEDS: cat_candidates.append(candidate)
        top_is_cat = bool(all_candidates) and all_candidates[0].breed.lower().replace(" ", "_") in CAT_BREEDS
        cats = tuple(cat_candidates[:3]); top_score = cats[0].confidence if cats else 0.0
        if not top_is_cat: verdict = "The model does not think this is one of its known cat breeds."
        elif top_score < .45: verdict = "Uncertain — this may be a mixed breed or outside the training set."
        elif top_score < .70: verdict = "Possible match — confirm with visual traits or a professional."
        else: verdict = "Likely visual match — not a pedigree or veterinary determination."
        return BreedResult(candidates=cats, verdict=verdict, is_cat=top_is_cat)
