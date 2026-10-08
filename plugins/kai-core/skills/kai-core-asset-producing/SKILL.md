---
name: kai-core-asset-producing
description: "Use when a validated pack-owned artifact needs a private revision, acceptance binding, publication, provenance, or closure."
tools: [read, edit, execute, search]
---

# Asset production

This shared contract owns lifecycle mechanics only. The caller must already
have loaded its owning pack publication skill immediately before this contract.
That pack skill is the sole authority for namespace, type, subtype, formats,
publication rules, and privacy rules.

Core never substitutes a department vocabulary or invents a fallback lane.

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
7. **Record the accepted asset.** Use `asset.transition` to bind public target,
   accepted hash, authority, approval, subject version, provenance, validity,
   inputs, and supersession.
8. **Close private state.** Remove scratch. Move retained drafts and evidence to
   `.kai/<pack>/archive/<type>/<id>/...` or the subtype equivalent. Preserve the
   public accepted bytes.

SQLite at `.kai/core/runtime/coordination.sqlite` is the only coordination and
acceptance authority. A file's existence, Git status, or polished appearance
does not establish acceptance.

## Required refusals

Refuse before creating a directory or copying bytes when:

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

Retraction and archival preserve the accepted record and rationale. Uninstall
never deletes private or public content.
