---
id: "attention-is-all-you-need"
title: "Attention Is All You Need (Transformer Architecture)"
topic: "Artificial Intelligence"
type: "paper"
source:
  title: "Attention Is All You Need"
  author: "Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, et al."
  url: "https://arxiv.org/abs/1706.03762"
  published_year: 2017
status: "completed"
rating: 5
tags: ["ai", "transformers", "nlp", "deep-learning", "attention-mechanism"]
links:
  - id: "the-pragmatic-programmer-20th"
    relationship: "inspires"
    notes: "A prime example of breaking entrenched paradigms (RNNs/LSTMs) with a simpler, highly parallelizable model."
date_started: "2026-05-01"
date_finished: "2026-05-03"
last_modified: "2026-05-04"
summary: "The landmark 2017 paper introducing the Transformer model based solely on multi-head self-attention mechanisms."
key_takeaways:
  - "Eliminates recurrent networks (RNN/LSTM) and sequential token dependency, allowing massive GPU parallelism."
  - "Multi-Head Self-Attention allows the model to jointly attend to information from different representation subspaces."
  - "Positional encodings inject relative and absolute token order into permutation-invariant attention matrices."
---

## Key Mathematical Insights

### Scaled Dot-Product Attention
$$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V$$

The scaling factor $\frac{1}{\sqrt{d_k}}$ counteracts the effect of dot products growing large in magnitude for high dimensions, which would push softmax into regions with vanishing gradients.

### Multi-Head Attention
Instead of performing a single attention function with $d_{model}$-dimensional queries, keys, and values, it projects queries, keys, and values $h$ times with different learned linear projections to $d_k, d_k, d_v$ dimensions respectively.

## Impact & Takeaways
This paper sparked the modern foundation model era (BERT, GPT, Claude, LLaMA, Vision Transformers). The simplicity of scaled dot-product attention paired with residual connections and layer normalization proved extraordinarily scalable.
