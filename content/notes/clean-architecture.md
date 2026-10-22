---
id: "clean-architecture"
title: "Clean Architecture: A Craftsman's Guide to Software Structure"
topic: "Software Architecture"
type: "book"
source:
  title: "Clean Architecture"
  author: "Robert C. Martin (Uncle Bob)"
  url: "https://www.pearson.com/en-us/subject-catalog/p/clean-architecture-a-craftsmans-guide-to-software-structure-and-design/P200000000103"
  published_year: 2017
status: "completed"
rating: 4
tags: ["architecture", "domain-driven", "solid", "modularity"]
links:
  - id: "designing-data-intensive-applications"
    relationship: "contrasts"
    notes: "Clean Architecture focuses heavily on domain purity and OOP boundaries, whereas DDIA focuses on distributed systems and data storage trade-offs."
  - id: "the-pragmatic-programmer-20th"
    relationship: "extends"
    notes: "Builds upon foundational programming values with structural boundaries."
date_started: "2026-02-12"
date_finished: "2026-03-01"
last_modified: "2026-03-05"
summary: "Universal rules of software architecture and boundary separation centered on the Dependency Inversion Principle."
key_takeaways:
  - "Architecture is about intent and keeping options open as long as possible."
  - "The Dependency Rule: source code dependencies must point only inward toward higher-level policies."
  - "Databases, frameworks, and UIs are implementation details and should be relegated to the outermost ring."
---

## Key Conceptual Takeaways

### The Concentric Rings Model
1. **Enterprise Business Rules (Entities)**: Critical business logic that would exist even without computers.
2. **Application Business Rules (Use Cases)**: Orchestrates data flow to and from entities.
3. **Interface Adapters (Controllers, Presenters, Gateways)**: Translates data from use case format to UI/DB format.
4. **Frameworks & Drivers (Web, DB, Devices)**: External tools and infrastructure.

### The Dependency Rule
> "Source code dependencies must point only inward, toward higher-level policies."

Nothing in an inner circle can know anything at all about something in an outer circle.

## Pragmatic Thoughts & Critiques
- While conceptually elegant, dogmatic application of Clean Architecture in simple CRUD applications often introduces excessive boilerplate (DTO conversions, multiple layers of interfaces).
- Best applied to core domain workflows that undergo frequent business rule shifts.
