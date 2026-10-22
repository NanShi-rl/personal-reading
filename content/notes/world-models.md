---
id: world-models
title: World Models
topic: Artificial Intelligence
type: article
source:
  title: World model (artificial intelligence)
  author: (Wikipedia)
  url: 'https://en.wikipedia.org/wiki/World_model_(artificial_intelligence)'
  published_year: 2026
status: reading
rating: 4
tags:
  - AI
date_started: '2026-10-22'
date_finished: '2026-10-22'
last_modified: '2026-10-22'
summary: >-
  World models establish a physics-first paradigm shift that allows machines to
  comprehend space, time, and causality. They enable autonomous agents to
  simulate potential future states, predict outcomes, and understand the
  consequences of their actions before execution.
key_takeaways:
  - >-
    LLMs learn and understand information in the format of text (sound) or
    vision (video). But there are many more ways people receive information, for
    example touch, smell, etc.
---
## History

- 1990: Schmidhuber — "Making the World Differentiable": recurrent neural net learns a model of the environment
- 2018: Ha & Schmidhuber "World Models" (NeurIPS): agent trained entirely inside a "dream" world model
- Feb 2024:	Google Genie 1 (11B params), OpenAI Sora technical report
- Jun 2025: Meta V-JEPA 2 (1.2B params, 1M+ hours of video); zero-shot robot planning
- Aug 2025: Google Genie 3 — first real-time interactive world model at 720p, 24fps
- Nov 2025:	World Labs Marble launches; LeCun departs Meta to found AMI Labs
- Dec 2025:	Runway GWM-1 — "first general world model family"
- Feb 2026:	Waymo World Model (built on Genie 3); AMI Labs raises $1.03B seed


## Technical Architecture

- V (Vision): A VAE compresses each frame into a small latent vector z.
- M (Memory): An MDN-RNN predicts the next latent state P(z_{t+1} | a_t, z_t, h_t) — probabilistic, can represent multiple possible futures.
- C (Controller): A tiny linear policy maps latent state to actions, trained by evolution (CMA-ES). Only 867 parameters vs. 4.3M in the VAE.


## Key Notes & Highlights

- Free playground: https://experience.odyssey.systems/
- Enterprise Use Cases:
  - Robotics: Synthetic training data and pre-execution planning (reducing costly trial and error)
  - Autonomous vehicles: Long-tail scenario simulation (Waymo, Wayve, Uber)
  - Healthcare & drug discovery: Integrating genomic, proteomic, chemical data
  - Spatial computing / gaming: Generated 3D worlds (Marble, Genie)
