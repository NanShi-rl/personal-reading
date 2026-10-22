---
id: "designing-data-intensive-applications"
title: "Designing Data-Intensive Applications (DDIA)"
topic: "Distributed Systems"
type: "book"
source:
  title: "Designing Data-Intensive Applications: The Big Ideas Behind Reliable, Scalable, and Maintainable Systems"
  author: "Martin Kleppmann"
  url: "https://dataintensive.net/"
  published_year: 2017
status: "completed"
rating: 5
tags: ["distributed-systems", "databases", "storage-engines", "consensus", "replication"]
links:
  - id: "clean-architecture"
    relationship: "contrasts"
    notes: "Examines architectural resilience from data consistency and network partition angles."
date_started: "2026-03-10"
date_finished: "2026-04-20"
last_modified: "2026-04-25"
summary: "The definitive guide to data systems architecture, data models, encoding, distributed transactions, replication, and stream processing."
key_takeaways:
  - "Reliability, Scalability, and Maintainability are the three fundamental pillars of modern software systems."
  - "Storage engines: LSM-Trees vs B-Trees present clear trade-offs between write throughput and read latency."
  - "Distributed consensus is tricky: there is no such thing as synchronized clocks in real-world networks."
---

## Deep Dive Notes

### 1. Data Models and Query Languages
- Relational vs Document vs Graph models.
- Choose your model based on query and relationship density, not just hype.

### 2. Replication & Partitioning
- **Single-Leader vs Multi-Leader vs Leaderless (Dynamo-style)**.
- Read-after-write consistency, monotonic reads, consistent prefix reads.
- Split brain risk and fencing tokens.

### 3. Consistency Models & Consensus
- Linearizability vs Serializability.
- Two-Phase Commit (2PC) is a blocking protocol.
- Paxos, Raft, and Zab algorithms for total order broadcast.

## Final Thoughts
DDIA is indispensable for anyone working with modern cloud infrastructures and microservices. Every trade-off in distributed storage is articulated with historical and practical rigor.
