---
id: "thinking-fast-and-slow"
title: "Thinking, Fast and Slow"
topic: "Cognitive Psychology"
type: "book"
source:
  title: "Thinking, Fast and Slow"
  author: "Daniel Kahneman"
  url: "https://us.macmillan.com/books/9780374533557/thinkingfastandslow"
  published_year: 2011
status: "reading"
rating: 5
tags: ["psychology", "decision-making", "heuristics", "biases", "behavioral-economics"]
links:
  - id: "the-pragmatic-programmer-20th"
    relationship: "references"
    notes: "Heuristics and cognitive biases explain why software teams fall into estimation traps and sunk cost fallacies."
date_started: "2026-06-15"
last_modified: "2026-06-20"
summary: "An exploration of the two systems that drive the way we think: System 1 (fast, intuitive) and System 2 (slow, deliberative)."
key_takeaways:
  - "System 1 operates automatically and quickly, with little or no effort and no sense of voluntary control."
  - "System 2 allocates attention to effortful mental operations, including complex computations."
  - "Heuristics: Availability, Representativeness, Anchoring, and Overconfidence lead to systematic cognitive errors."
---

## Notes & Reflections

### Two Systems
- **System 1**: Emotional, instinctive, subconscious, associative. Prone to systematic biases like WYSIATI (What You See Is All There Is).
- **System 2**: Logical, analytical, conscious, lazy. Requires metabolic and mental energy to activate.

### Application to Software Development & Problem Solving
1. **Code Reviews**: System 1 glances over syntax and aesthetic formatting; System 2 is needed to analyze race conditions and concurrency hazards.
2. **Estimation**: The Planning Fallacy is driven by System 1 optimism and Anchoring on best-case scenarios.
3. **Debugging**: Initial hypotheses often anchor on recent commits (Availability Heuristic).
