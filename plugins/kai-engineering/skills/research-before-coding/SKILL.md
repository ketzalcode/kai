---
name: research-before-coding
description: "Use when a code or design decision depends on unresolved evidence about existing behavior, ownership, reuse, consumers, or tradeoffs."
tools: [read, search, execute]
user-invocable: true
argument-hint: "optional task or area description"
---

# Research Before Coding

Answer a bounded question with evidence. Return findings that a user or caller
can act on; do not turn research into implementation, sizing, or a new approval
ceremony.

## Activation

- **Explicit user invocation:** investigate the stated question and return
  useful findings, even when no implementation is requested.
- **From a code-writing caller:** use this method only when unresolved,
  decision-relevant evidence could change the approach.
- Ordinary targeted reading, implementation, and regression work can continue
  without this method when the relevant evidence is already established.

## Method

### 1. Frame the question

State the **Question and scope**: what needs to be learned, which decision or
handoff it informs, and what is outside the investigation.

### 2. Gather relevant local evidence

Collect only the **Relevant local facts** needed to answer the question:

- current behavior and applicable tests, contracts, history, and instructions;
- existing implementations or utilities that may be reused;
- callers and consumers whose behavior constrains the decision;
- ownership or authorization evidence when it affects what may be changed.

Folder names are clues, not ownership or edit authority. Missing ownership
metadata does not block read-only research; report the uncertainty without
granting permission to modify anything.

### 3. Ground each claim

Cite repository paths, lines, commands and results, or supplied source material.
Treat supplied sources as evidence; callers do not need new web or tool
capabilities merely to consume them.

Use external research only when the actual question cannot be answered from
available evidence and the task authorizes it. Prefer authoritative sources.
If authoritative access is unavailable, report the gap and the consequence
instead of inventing a fact.

Run an experiment only when it is necessary to resolve the question and is
authorized. Use a diagram only when relationships are materially clearer
visually.

### 4. Return the evidence handoff

Return:

- **Question and scope**
- **Relevant local facts**
- **Reuse and consumer implications**
- **Grounded sources**
- **Unresolved evidence and consequences**

Add a recommendation only when the user or caller requested a decision. A
durable report requires an explicit request or an existing handoff contract;
otherwise return the findings directly.

## Boundaries

- Do not create a repository-wide map, classify every file, satisfy a reading
  quota, or start an automatic sizing chain.
- Do not edit production source as the output of this method.
- Do not repeat research when current, grounded evidence already answers the
  question.
- The caller may continue its independently authorized work after consuming the
  handoff. This method neither grants nor withdraws that authority.
