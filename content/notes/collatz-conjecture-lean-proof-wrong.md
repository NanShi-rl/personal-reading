---
id: collatz-conjecture-lean-proof-wrong
title: Collatz Conjecture Lean Proof Turns Out to be Wrong
topic: Mathematics
type: article
sources:
  - title: Collatz Conjecture Lean Proof Discussion
    author: Soham Mallick
    url: 'https://lnkd.in/p/gHcb9imj'
    published_year: 2026
status: completed
rating: 5
tags:
  - math
  - AI
  - Lean
links:
  - id: intro-to-mathematical-formalization-lean
    relationship: related_to
    notes: An example of potential issue behind the Lean framework
date_started: '2026-10-22'
date_finished: '2026-10-22'
last_modified: '2026-10-22'
summary: >-
  For a few days, the Collatz conjecture appeared to have been formally
  disproved. So how did an incorrect proof pass?
key_takeaways:
  - >-
    The proof is accepted by Lean & Nanoda, because of different bugs in the
    checking systems.
  - 'Such bugs although uncommon, are not unprecedented.'
---
### Collatz Conjecture

For any integer `x`, 
- if it is an even number we divide it by 2; 
- if it is an odd number we multiply it by 3 and add 1;

The conjecture stated that any positive integer would end up in the `4 → 2 → 1` loop.
