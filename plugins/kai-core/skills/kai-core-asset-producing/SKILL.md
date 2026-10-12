---
name: kai-core-asset-producing
description: "Use when a validated pack-owned artifact needs a private revision, provenance, acceptance binding, publication, or recorded state transition."
tools: [read, edit, execute, search]
---

# Asset production

This shared contract owns lifecycle mechanics only. The caller must already
have loaded its owning pack publication skill immediately before this contract.
That pack skill is the sole authority for namespace, type, subtype, formats,
publication rules, and privacy rules.

Core never substitutes a department vocabulary, chooses semantic disposition,
or invents a fallback lane. Before deriving a path, require an existing
standalone Task or explicit direct authority, an authorized artifact target,
current acting authority, and named acceptance authority. Direct work never
enters this lifecycle by implication.

## Interface

Execute this sequence:

1. **Validate owning-pack route.** Confirm the caller's source pack matches the
   loaded publication contract and requested namespace.
2. **Derive the private typed path.** Use the validated pack, type, optional
   subtype, stable ID, and one lifecycle: `drafts`, `evidence`, or `scratch`.
   Derivation performs no filesystem write.
3. **Produce a mutable private revision.** Create only the exact validated
   parent on first write. Keep working bytes private and untracked.
4. **Register provenance.** Use `artifact.register` to bind the typed hierarchy
   subject and version, producer, project, private source, content hash, input
   basis, classification, and expected public target.
5. **Bind acceptance.** The named completion authority accepts one exact
   revision and SHA-256 hash. Producer self-acceptance is invalid where
   independence is required.
6. **Copy the accepted revision.** Re-resolve both roots, verify source hash,
   destination ownership, path safety, and current acceptance, then copy the
   exact bytes to the mirrored public path. Publication is never a rename of
   mutable private state.
7. **Record the requested transition.** After the owning pack decides the
   semantic state, use `asset.transition` to bind public target, accepted hash,
   authority, approval, Task version, provenance, validity, inputs, and any
   predecessor/successor link.
8. **Apply pack-owned cleanup.** Remove scratch and retain or archive private
   drafts/evidence exactly as the owning publication contract requires.

SQLite at `.kai/core/runtime/coordination.sqlite` is the only coordination and
acceptance authority. A file's existence, Git status, or polished appearance
does not establish acceptance.

## Required refusals

Refuse before creating a directory or copying bytes when:

- the Task or direct authority basis is missing or stale, or acting, target, or
  acceptance authority is missing;
- the owning publication route is absent, belongs to another pack, or is not
  immediately before this contract;
- type or subtype is unknown;
- the request selects scratch as a publication source;
- a draft lacks exact named-authority acceptance;
- the source is private evidence;
- the request supplies an arbitrary root or non-mirrored destination;
- source or destination has a link, junction, case alias, nested Git root,
  collision, namespace mismatch, or path escape;
- the source hash, subject version, approval, authority, inputs, or destination
  ownership changed;
- a media destination is unsafe or lacks explicit durable-destination approval.

Return the typed refusal. Do not publish inline guesses, create `misc`, or
silently downgrade durable output to another directory.

## Revision and supersession

Mutable work remains private. A new accepted revision gets a new hash and
provenance record. Supersession names the predecessor and successor; it never
rewrites historical evidence or claims the predecessor was always invalid.

Retraction and archival preserve the accepted record and rationale. The owning
pack decides whether those states apply; Core only records the authorized
transition. Uninstall never deletes private or public content.
