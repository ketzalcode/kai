# Pack split host gates

**Status:** IN PROGRESS — macOS PASS; cloud consumer PASS; SRE corrections prepared for re-review
**Prepared:** 2026-08-26
**macOS source pin:** `9a800e4e76cd6c15b9dfab01a7b1ed99c4285080`
**Release 12b verdict:** **NO-GO**

## Decision

Release 12b must not start until independent reliability review. The macOS host
arm passed. The authorized disposable consumer repository then proved that the
cloud host resolves and loads the positive control, `kai-core`, and
`kai-personal` from default-branch repository settings, invokes the core
contract, and completes a `kai-personal:persona-self` child task that invokes
that contract. Host session records now provide the exact task arguments and
same-session begin/end markers naming the `persona-self` subagent. The packs
remain committed and unpublished.

The evidence path uses the lowest persistent-install rung that exercises each
required provenance. It does not require either pack to appear in the public
marketplace:

```text
  RubenSaucedo/kai main
       |
       +-- authenticated macOS arm -------------------------- PASS
       |     direct both orders + directory marketplace
       |     provider events + checksums + refusal probes
       |
  disposable consumer repository, DEFAULT branch
       +-- direct kai-core + kai-personal specs
       +-- default-marketplace positive control
       +-- host resolves and loads all 3 -------------------- PASS
       +-- core contract invocation ------------------------- PASS
       +-- persona-self -> nested core contract -> success --- PASS
```

This packet implements the architecture decision at
`kai/initiatives/pack-split/artifacts/decisions/pack-split-host-gates.md`.
That decision removed two false prerequisites from the earlier packet:

- publication is not a prerequisite for marketplace-provenance evidence; and
- enterprise managed settings are not the only documented cloud-agent plugin
  control plane.

The item Acceptance is unchanged. The architecture decision does not complete
the required `principal-sre` independent reliability review.

## Evidence state

| Gate | macOS | cloud host | Status |
| --- | --- | --- | --- |
| Host identity and run-start `main` tip | PASS | PASS — host-issued task/run/session IDs and fixture SHA | PASS |
| Persistent core-first and personal-first install | PASS | PASS — declarative direct specs resolve on each fresh task | PASS |
| Fresh-session activation | PASS | PASS — repeated independent cloud tasks load all three plugins | PASS |
| Cross-plugin core contract resolution | PASS | PASS — selected `persona-self` and nested `skill.invoked` events | PASS |
| Marketplace and direct binding | PASS | PASS — `spark@copilot-plugins` plus both direct Kai specs resolve together | PASS |
| Direct/marketplace collision refusal | PASS | not required separately | PASS |
| Per-pack npm / `node_modules` behavior | PASS — inventories empty | host does not export installed-tree inventories | PASS |
| Exact no-core refusal | PASS | not required separately | PASS |
| Exact `--contract 2` refusal | PASS | not required separately | PASS |

No row is inferred from Windows evidence, a generic subagent, or final model
text. A generic Actions CLI runner still cannot substitute for the Copilot cloud
host. The accepted macOS arm is different: it is a first-party authenticated
Copilot CLI run on a genuine GitHub-hosted Apple Silicon macOS runner and
preserves installed-plugin and provider evidence.

## Observed macOS result — PASS

- GitHub Actions run
  [`33024791572`](https://github.com/RubenSaucedo/kai/actions/runs/33024791572),
  job `98363497414`, succeeded on 2026-08-26 at source
  `9a800e4e76cd6c15b9dfab01a7b1ed99c4285080`.
- Host: macOS `26.5.2` build `25F84`, Darwin `25.5.0` arm64
  `VMAPPLE`; Node `v24.18.0`; npm `11.16.0`; Copilot CLI `1.0.80`.
- Result file is `PASS`; process exit status is `0`.
- Direct core-first and personal-first installs both list `kai-core` and
  `kai-personal` at `0.64.0`. The run-local directory marketplace lists
  `kai-core@pack-split-host-gate` and
  `kai-personal@pack-split-host-gate`, also at `0.64.0`.
- Host `skill.invoked` events bind selected
  `kai-personal:persona-self` to `kai-core-contract-v1` from source plugin
  `kai-core` `0.64.0`. Direct providers resolve under
  `_direct/RubenSaucedo--kai--packs-kai-core/...`; marketplace providers
  resolve under `pack-split-host-gate/kai-core/...`.
- Installed and source `plugin.json` SHA-256 values match:
  `kai-core` `ea392ecc72c5c5404180fc7291a33d0ae816292fbf231a4372e183c27262f80b`;
  `kai-personal`
  `cfbb11184f5d326a3e95b2e3e3ed79524f081580f572e0665a0c3eb5928dd59b`.
- Direct and marketplace per-pack inventories contain no `package.json`,
  `package-lock.json`, `npm-shrinkwrap.json`, or `node_modules`.
- The migration doctor refused the two-provenance install with
  `provenance-collision`. Its additional `workspace-provenance-stale` code is
  expected because the producer workspace still records legacy `kai`; it is
  not a host-gate failure.
- No-core and contract-2 sessions each returned exactly
  `KAI-CORE-MISSING`. The skew provider event identifies
  `kai-core-preview`, contract `2`.
- Retained positive-session files contain exactly
  `KAI_CORE_READY` / `contract: 1`. The execution packet below now asserts
  those contract lines. Its earlier `DIRECT_OK` / `MARKETPLACE_OK` prompts
  conflicted with the contract skill's required output and did not describe the
  accepted files.

Sanitized evidence is under
`.kai/runs/eng/2026-08-26/02-infra-pack-split-host-gates/macos/`.
No raw Copilot home, session database, or configuration was copied.

## Observed cloud branch result — INDETERMINATE

- Task
  [`7160810a-a4e1-43eb-bc97-d6f8e2f53aad`](https://github.com/RubenSaucedo/kai/tasks/7160810a-a4e1-43eb-bc97-d6f8e2f53aad)
  completed. Host run
  [`33024086802`](https://github.com/RubenSaucedo/kai/actions/runs/33024086802),
  event `dynamic`, job `98361210602`, succeeded; task session
  `43a930a4-59d5-4577-9345-6da7aa86c2d5`; created
  `2026-08-26T23:38:25Z`, completed `2026-08-26T23:39:25Z`.
- Selected base `kai/chore/pack-split-host-gates-cloud-spike` and generated
  head `copilot/readonly-host-gate-spike` both resolved to
  `fb04975c2969e1aca463d148b6cb1784966e20b9`; no change was committed.
- The host resolved the selected base and the task confirmed
  `.github/copilot/settings.json` exists. It then made only two bash calls:
  zero plugin discovery/install events, zero `skill.invoked` events, and zero
  `persona-self` dispatches.
- This is not a pass. It also does not prove default-branch-only semantics or
  direct-spec rejection: there is no positive control and no host-side
  plugin-root evidence.

Only the sanitized identity/result summary was retained at
`.kai/runs/eng/2026-08-26/02-infra-pack-split-host-gates/cloud/99-summary.json`.
The raw host log remains temporary session material and was not copied.

## Observed cloud consumer result — PASS

The operator authorized `Q-pack-split-host-gates-04` and created private,
disposable repository
[`RubenSaucedo/kai-pack-host-gate-consumer`](https://github.com/RubenSaucedo/kai-pack-host-gate-consumer).
Default-branch fixture commit
`7d80b4b12942eb0acce972e1e83c36f88023fde6` declared:

```json
{
  "enabledPlugins": {
    "RubenSaucedo/kai:packs/kai-core": true,
    "RubenSaucedo/kai:packs/kai-personal": true,
    "spark@copilot-plugins": true
  }
}
```

The provisioning task
[`bc62f1d9-eb90-45b7-90b0-44ade5c60da5`](https://github.com/RubenSaucedo/kai-pack-host-gate-consumer/tasks/bc62f1d9-eb90-45b7-90b0-44ade5c60da5),
run
[`33026579996`](https://github.com/RubenSaucedo/kai-pack-host-gate-consumer/actions/runs/33026579996),
job `98369253049`, session
`733d02f6-6eae-4610-950e-b04f6e56eae2`, resolved `spark`, `kai-core`, and
`kai-personal`, reported `Successfully loaded 3/3 plugin(s)`, and emitted
`skill.invoked: kai-core-contract-v1`.

The child task
[`7e6cf168-469b-4224-9ba7-f2123207bdd3`](https://github.com/RubenSaucedo/kai-pack-host-gate-consumer/tasks/7e6cf168-469b-4224-9ba7-f2123207bdd3),
run
[`33026682808`](https://github.com/RubenSaucedo/kai-pack-host-gate-consumer/actions/runs/33026682808),
job `98369587097`, session
`6ff59e2a-578b-4ed1-9bf6-b5ed99af9515`, again loaded all three plugins. Host
events then recorded `tool.execution_start: task`, nested
`skill.invoked: kai-core-contract-v1`, and
`tool.execution_complete: task success=true`.

A final repeat made the requested target explicit in the host-persisted task
record: task
[`47438e15-4b6c-421f-97a2-f783434b7fdb`](https://github.com/RubenSaucedo/kai-pack-host-gate-consumer/tasks/47438e15-4b6c-421f-97a2-f783434b7fdb),
run
[`33027220466`](https://github.com/RubenSaucedo/kai-pack-host-gate-consumer/actions/runs/33027220466),
job `98371301103`, session
`410d2bc8-30e7-401a-ad12-13233c09a1f2`. The persisted prompt requires
`agent_type kai-personal:persona-self`, forbids a built-in substitute, and
requires the child's first action to invoke `kai-core-contract-v1`; the host
recorded the task start, nested skill invocation, and successful task
completion.

Cloud session storage later ingested the authoritative same-session records for
session `410d2bc8-30e7-401a-ad12-13233c09a1f2`:

- `tool_requests` records tool call
  `toolu_019eFjZzzD2FszpjX6GTTWXA` with
  `agent_type: kai-personal:persona-self`;
- the task prompt requires `kai-core-contract-v1` as the child's first action;
- the event stream emits the host-authored boundary
  `All messages ... are from the persona-self subagent`;
- inside that boundary, `skill` loads `kai-core-contract-v1` and the child
  returns exactly `KAI_CORE_READY` / `contract: 1`; and
- the host emits the matching end boundary and successful task completion.

This is the required causal binding between the selected department agent and
the nested core invocation. No model-authored final identity is credited.
Actions log export still omits task arguments, and repository
`subagentStart`/`preToolUse` hooks did not fire, but those observability gaps no
longer block identity because the host session records supply it. Direct Agent
Tasks API selection of `custom_agent: kai-personal:persona-self` returned HTTP
404 because that field resolves repository custom-agent filenames, not
installed plugin agents.

The direct specs followed Kai's default branch. GitHub commit history at both
the first provisioning timestamp (`2026-08-27T00:21:57Z`) and the final child
resolution timestamp (`2026-08-27T00:33:29Z`) resolves `main` to
`fe562b9364256b159d7016d8bdc79d989bc7e3a3`. At that revision,
`kai-core` and `kai-personal` are version `0.64.0`; their `plugin.json` blob IDs
are `0a5614a275f692159ef5d9fbddaf3ea652f17527` and
`60113222921a0f4af651d7f744539fe705b599c2`, respectively.

Sanitized local summaries:

- `.kai/runs/eng/2026-08-26/02-infra-pack-split-host-gates/cloud/10-consumer-provisioning.json`
- `.kai/runs/eng/2026-08-26/02-infra-pack-split-host-gates/cloud/20-consumer-child.json`
- `.kai/runs/eng/2026-08-26/02-infra-pack-split-host-gates/cloud/30-selected-agent-telemetry.json`
- `.kai/runs/eng/2026-08-26/02-infra-pack-split-host-gates/cloud/40-cloud-source-pin.json`

Temporary settings on Kai `main` remain rejected because they would
auto-install core/personal beside legacy `kai`, activate duplicate
hooks/coexistence, persist host state, and contradict the
committed-unpublished boundary. The disposable repository remains private only
until SRE has reviewed the preserved evidence, then it must be deleted.

## Common evidence contract

Evidence lands under:

```text
.kai/runs/eng/2026-08-26/02-infra-pack-split-host-gates/
  macos/
  cloud/
```

Each host records UTC start/end, host type, OS/architecture, Node/npm/Copilot
versions, source revision, plugin inventory, install provenance, and per-pack
dependency inventory. The macOS run additionally records SHA-256 for each source
and installed `plugin.json`.

A direct `OWNER/REPO:PATH` spec follows the repository default branch. It does
not pin a historical commit. Therefore:

1. record `main` tip before installation;
2. check out that tip in the disposable clone;
3. require remote `main` to remain at that tip through the install packet; and
4. require installed `plugin.json` bytes to match the checked-out source.

Provider identity comes from host events or plugin inventory, not the model's
final text. A cloud identity record must be host-issued and include the task/run
URL or stable ID and selected branch; the model must not author it.

Do not transfer `$COPILOT_HOME/config.json`, cookies, session databases, auth
headers, environment dumps, or credential files. Before transfer, scan the
sanitized evidence:

```bash
rg -n -i \
  '(gh[pousr]_|github_pat_|bearer |authorization:|oauth|cookie:|session=)' \
  .kai/runs/eng/2026-08-26/02-infra-pack-split-host-gates
```

Any match aborts transfer. Keep raw host state on the executing host and copy
only sanitized evidence plus checksums into the run root.

## macOS execution packet

### 1. Record the current source pin

Run on an authorized macOS host. Use a disposable clone and never the normal
Copilot home.

```bash
set -euo pipefail

REPO_URL="https://github.com/RubenSaucedo/kai.git"
ROOT="$HOME/kai-host-gate-$(date -u +%Y%m%dT%H%M%SZ)"
test ! -e "$ROOT"
git clone "$REPO_URL" "$ROOT"
git -C "$ROOT" fetch --quiet origin main
RUN_SHA="$(git -C "$ROOT" rev-parse origin/main)"
git -C "$ROOT" checkout --detach "$RUN_SHA"
test "$(git -C "$ROOT" rev-parse HEAD)" = "$RUN_SHA"
test "$(git ls-remote "$REPO_URL" refs/heads/main | awk '{print $1}')" = "$RUN_SHA"
git -C "$ROOT" diff --quiet
git -C "$ROOT" diff --cached --quiet

RUN_ROOT="$ROOT/.kai/runs/eng/2026-08-26/02-infra-pack-split-host-gates"
test ! -e "$RUN_ROOT"
mkdir -p "$RUN_ROOT/macos"
printf '%s\n' "$RUN_SHA" | script -q "$RUN_ROOT/macos/00-main-tip.txt" cat
script -q "$RUN_ROOT/macos/01-uname.txt" uname -a
script -q "$RUN_ROOT/macos/02-sw-vers.txt" sw_vers
script -q "$RUN_ROOT/macos/03-node.txt" node --version
script -q "$RUN_ROOT/macos/04-npm.txt" npm --version
script -q "$RUN_ROOT/macos/05-copilot.txt" copilot --version
script -q "$RUN_ROOT/macos/06-pack-check.txt" \
  node "$ROOT/scripts/pack-preview.mjs" --check
script -q "$RUN_ROOT/macos/07-source-sha256.txt" \
  shasum -a 256 \
  "$ROOT/packs/kai-core/plugin.json" \
  "$ROOT/packs/kai-personal/plugin.json"
```

Do not replace `RUN_SHA` with the earlier `9a800e4e...` merge. The direct specs
below cannot request that historical commit.

### 2. Persistent direct installs in both orders

Each home is isolated and each agent invocation starts only after both installs
complete. These are the persistent install-order and fresh-session arms; no
`--plugin-dir` is used.

```bash
set -euo pipefail

DIRECT_CORE_FIRST="$RUN_ROOT/macos/home-direct-core-first"
DIRECT_PERSONAL_FIRST="$RUN_ROOT/macos/home-direct-personal-first"
EMPTY_WORKSPACE="$RUN_ROOT/macos/empty-workspace"
mkdir -p "$DIRECT_CORE_FIRST" "$DIRECT_PERSONAL_FIRST" "$EMPTY_WORKSPACE"

script -q "$RUN_ROOT/macos/10-direct-core-first-install-core.txt" \
  env COPILOT_HOME="$DIRECT_CORE_FIRST" \
  copilot plugin install "RubenSaucedo/kai:packs/kai-core"
script -q "$RUN_ROOT/macos/11-direct-core-first-install-personal.txt" \
  env COPILOT_HOME="$DIRECT_CORE_FIRST" \
  copilot plugin install "RubenSaucedo/kai:packs/kai-personal"
script -q "$RUN_ROOT/macos/12-direct-core-first-list.txt" \
  env COPILOT_HOME="$DIRECT_CORE_FIRST" copilot plugin list

script -q "$RUN_ROOT/macos/13-direct-personal-first-install-personal.txt" \
  env COPILOT_HOME="$DIRECT_PERSONAL_FIRST" \
  copilot plugin install "RubenSaucedo/kai:packs/kai-personal"
script -q "$RUN_ROOT/macos/14-direct-personal-first-install-core.txt" \
  env COPILOT_HOME="$DIRECT_PERSONAL_FIRST" \
  copilot plugin install "RubenSaucedo/kai:packs/kai-core"
script -q "$RUN_ROOT/macos/15-direct-personal-first-list.txt" \
  env COPILOT_HOME="$DIRECT_PERSONAL_FIRST" copilot plugin list

(
  cd "$EMPTY_WORKSPACE"
  env COPILOT_HOME="$DIRECT_CORE_FIRST" \
    copilot --no-auto-update --no-custom-instructions --no-remote --silent \
    --allow-all-tools --max-ai-credits 40 \
    --agent kai-personal:persona-self \
    -p 'Invoke kai-core-contract-v1 as your first action. Return only the contract result.' \
    | python3 -c \
    'import pathlib,sys; s=sys.stdin.read(); pathlib.Path(sys.argv[1]).write_text(s); assert s.strip()=="KAI_CORE_READY\ncontract: 1"' \
    "$RUN_ROOT/macos/16-direct-core-first-session.txt"
)

(
  cd "$EMPTY_WORKSPACE"
  env COPILOT_HOME="$DIRECT_PERSONAL_FIRST" \
    copilot --no-auto-update --no-custom-instructions --no-remote --silent \
    --allow-all-tools --max-ai-credits 40 \
    --agent kai-personal:persona-self \
    -p 'Invoke kai-core-contract-v1 as your first action. Return only the contract result.' \
    | python3 -c \
    'import pathlib,sys; s=sys.stdin.read(); pathlib.Path(sys.argv[1]).write_text(s); assert s.strip()=="KAI_CORE_READY\ncontract: 1"' \
    "$RUN_ROOT/macos/17-direct-personal-first-session.txt"
)
```

Verify each installed manifest against the source at `RUN_SHA`. The helper
requires exactly one installed manifest with the requested plugin name.

```bash
set -euo pipefail

for HOME_PATH in "$DIRECT_CORE_FIRST" "$DIRECT_PERSONAL_FIRST"; do
  for PLUGIN_NAME in kai-core kai-personal; do
    SOURCE_MANIFEST="$ROOT/packs/$PLUGIN_NAME/plugin.json"
    RESULT_NAME="$(basename "$HOME_PATH")-$PLUGIN_NAME-sha256.json"
    python3 -c \
    'import hashlib,json,pathlib,sys
home,name,source,out=map(pathlib.Path,[sys.argv[1],sys.argv[2],sys.argv[3],sys.argv[4]])
matches=[]
for manifest in home.joinpath("installed-plugins").rglob("plugin.json"):
    try:
        if json.loads(manifest.read_text()).get("name")==name.name: matches.append(manifest)
    except Exception:
        pass
assert len(matches)==1, (name.name,[str(p) for p in matches])
digest=lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
record={"plugin":name.name,"source":str(source),"installed":str(matches[0]),"source_sha256":digest(source),"installed_sha256":digest(matches[0])}
assert record["source_sha256"]==record["installed_sha256"], record
out.write_text(json.dumps(record,indent=2)+"\n")' \
    "$HOME_PATH" "$PLUGIN_NAME" "$SOURCE_MANIFEST" \
    "$RUN_ROOT/macos/$RESULT_NAME"
  done
done

test "$(git ls-remote "$REPO_URL" refs/heads/main | awk '{print $1}')" = "$RUN_SHA"
```

Record package-manager behavior without assuming the installed tree layout:

```bash
python3 -c \
'import json,pathlib,sys
out={}
for raw in sys.argv[2:]:
    home=pathlib.Path(raw)
    for manifest in home.joinpath("installed-plugins").rglob("plugin.json"):
        try: name=json.loads(manifest.read_text()).get("name")
        except Exception: continue
        if name not in {"kai-core","kai-personal"}: continue
        root=manifest.parent
        out[f"{home.name}/{name}"]=sorted(str(p.relative_to(root)) for p in root.rglob("*") if p.name in {"package.json","package-lock.json","npm-shrinkwrap.json","node_modules"})
pathlib.Path(sys.argv[1]).write_text(json.dumps(out,indent=2)+"\n")' \
"$RUN_ROOT/macos/18-direct-dependency-inventory.json" \
"$DIRECT_CORE_FIRST" "$DIRECT_PERSONAL_FIRST"
```

### 3. Run-local directory marketplace

This marketplace is run-local, points at the checked-out source, and is never
committed or published. It supplies marketplace provenance without touching
`.github/plugin/marketplace.json`.

```bash
set -euo pipefail

MARKET_ROOT="$RUN_ROOT/macos/directory-marketplace"
MARKET_HOME="$RUN_ROOT/macos/home-marketplace"
COLLISION_HOME="$RUN_ROOT/macos/home-collision"
mkdir -p "$MARKET_ROOT/.github/plugin" "$MARKET_HOME" "$COLLISION_HOME"
ln -s "$ROOT/packs" "$MARKET_ROOT/packs"

python3 -c \
'import json,pathlib,sys
target=pathlib.Path(sys.argv[1])
data={"name":"pack-split-host-gate","owner":{"name":"host-gate"},"plugins":[
{"name":"kai-core","source":"./packs/kai-core","description":"Run-local host-gate source"},
{"name":"kai-personal","source":"./packs/kai-personal","description":"Run-local host-gate source"}]}
target.write_text(json.dumps(data,indent=2)+"\n")' \
"$MARKET_ROOT/.github/plugin/marketplace.json"

script -q "$RUN_ROOT/macos/20-marketplace-add.txt" \
  env COPILOT_HOME="$MARKET_HOME" \
  copilot plugin marketplace add "$MARKET_ROOT"
script -q "$RUN_ROOT/macos/21-marketplace-install-core.txt" \
  env COPILOT_HOME="$MARKET_HOME" \
  copilot plugin install "kai-core@pack-split-host-gate"
script -q "$RUN_ROOT/macos/22-marketplace-install-personal.txt" \
  env COPILOT_HOME="$MARKET_HOME" \
  copilot plugin install "kai-personal@pack-split-host-gate"
script -q "$RUN_ROOT/macos/23-marketplace-list.txt" \
  env COPILOT_HOME="$MARKET_HOME" copilot plugin list

(
  cd "$EMPTY_WORKSPACE"
  env COPILOT_HOME="$MARKET_HOME" \
    copilot --no-auto-update --no-custom-instructions --no-remote --silent \
    --allow-all-tools --max-ai-credits 40 \
    --agent kai-personal:persona-self \
    -p 'Invoke kai-core-contract-v1 as your first action. Return only the contract result.' \
    | python3 -c \
    'import pathlib,sys; s=sys.stdin.read(); pathlib.Path(sys.argv[1]).write_text(s); assert s.strip()=="KAI_CORE_READY\ncontract: 1"' \
    "$RUN_ROOT/macos/24-marketplace-session.txt"
)
```

Repeat the manifest SHA helper from the direct arm for `MARKET_HOME`, then
record its package-manager inventory. Installed bytes must match source at
`RUN_SHA`.

```bash
for PLUGIN_NAME in kai-core kai-personal; do
  SOURCE_MANIFEST="$ROOT/packs/$PLUGIN_NAME/plugin.json"
  RESULT_NAME="home-marketplace-$PLUGIN_NAME-sha256.json"
  python3 -c \
  'import hashlib,json,pathlib,sys
home,name,source,out=map(pathlib.Path,[sys.argv[1],sys.argv[2],sys.argv[3],sys.argv[4]])
matches=[]
for manifest in home.joinpath("installed-plugins").rglob("plugin.json"):
    try:
        if json.loads(manifest.read_text()).get("name")==name.name: matches.append(manifest)
    except Exception:
        pass
assert len(matches)==1, (name.name,[str(p) for p in matches])
digest=lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
record={"plugin":name.name,"source":str(source),"installed":str(matches[0]),"source_sha256":digest(source),"installed_sha256":digest(matches[0])}
assert record["source_sha256"]==record["installed_sha256"], record
out.write_text(json.dumps(record,indent=2)+"\n")' \
  "$MARKET_HOME" "$PLUGIN_NAME" "$SOURCE_MANIFEST" \
  "$RUN_ROOT/macos/$RESULT_NAME"
done

python3 -c \
'import json,pathlib,sys
home=pathlib.Path(sys.argv[2]); out={}
for manifest in home.joinpath("installed-plugins").rglob("plugin.json"):
    try: name=json.loads(manifest.read_text()).get("name")
    except Exception: continue
    if name not in {"kai-core","kai-personal"}: continue
    root=manifest.parent
    out[name]=sorted(str(p.relative_to(root)) for p in root.rglob("*") if p.name in {"package.json","package-lock.json","npm-shrinkwrap.json","node_modules"})
pathlib.Path(sys.argv[1]).write_text(json.dumps(out,indent=2)+"\n")' \
"$RUN_ROOT/macos/25-marketplace-dependency-inventory.json" "$MARKET_HOME"

test "$(git ls-remote "$REPO_URL" refs/heads/main | awk '{print $1}')" = "$RUN_SHA"
```

### 4. Direct/marketplace collision

Install the same identity from both provenances, then require the read-only
migration doctor to refuse the state. Do not launch an agent from this home.

```bash
set -euo pipefail

script -q "$RUN_ROOT/macos/30-collision-marketplace-add.txt" \
  env COPILOT_HOME="$COLLISION_HOME" \
  copilot plugin marketplace add "$MARKET_ROOT"
script -q "$RUN_ROOT/macos/31-collision-marketplace-install.txt" \
  env COPILOT_HOME="$COLLISION_HOME" \
  copilot plugin install "kai-core@pack-split-host-gate"
script -q "$RUN_ROOT/macos/32-collision-direct-install.txt" \
  env COPILOT_HOME="$COLLISION_HOME" \
  copilot plugin install "RubenSaucedo/kai:packs/kai-core"

set +e
node "$ROOT/scripts/workspace-doctor.mjs" \
  --migration-check --home "$COLLISION_HOME" --json \
  | python3 -c \
  'import json,pathlib,sys; data=json.load(sys.stdin); pathlib.Path(sys.argv[1]).write_text(json.dumps(data,indent=2)+"\n"); assert data["status"]=="blocked"; assert "provenance-collision" in data["codes"]' \
  "$RUN_ROOT/macos/33-collision-doctor.json"
DOCTOR_STATUS=$?
set -e
test "$DOCTOR_STATUS" -eq 2
```

If the CLI prevents the second provenance from being installed, preserve that
host result and stop. Do not manufacture a collision fixture and call it host
evidence.

### 5. Exact refusal arms

Use a third persistent direct home for no-core. The generated contract-skew arm
may use `--plugin-dir`, but it is supplementary exact-reply evidence only; it is
not persistent-install evidence.

```bash
set -euo pipefail

NO_CORE_HOME="$RUN_ROOT/macos/home-no-core"
mkdir -p "$NO_CORE_HOME"
script -q "$RUN_ROOT/macos/40-no-core-install-personal.txt" \
  env COPILOT_HOME="$NO_CORE_HOME" \
  copilot plugin install "RubenSaucedo/kai:packs/kai-personal"

(
  cd "$EMPTY_WORKSPACE"
  env COPILOT_HOME="$NO_CORE_HOME" \
    copilot --no-auto-update --no-custom-instructions --no-remote --silent \
    --allow-all-tools --max-ai-credits 40 \
    --agent kai-personal:persona-self \
    -p 'Obey the mandatory core preflight.' \
    | python3 -c \
    'import pathlib,sys; s=sys.stdin.read(); pathlib.Path(sys.argv[1]).write_text(s); assert s.strip()=="KAI-CORE-MISSING"' \
    "$RUN_ROOT/macos/41-no-core.txt"
)

node "$ROOT/scripts/pack-preview.mjs" --all --packs personal --contract 2 \
  --out "$RUN_ROOT/macos/skew-preview"

(
  cd "$EMPTY_WORKSPACE"
  env COPILOT_HOME="$RUN_ROOT/macos/home-skew" COPILOT_PLUGIN_DIR_ONLY=true \
    copilot --no-auto-update --no-custom-instructions --no-remote --silent \
    --allow-all-tools --max-ai-credits 40 \
    --plugin-dir "$RUN_ROOT/macos/skew-preview/kai-core-preview" \
    --plugin-dir "$RUN_ROOT/macos/skew-preview/kai-personal-preview" \
    --agent kai-personal-preview:persona-self \
    -p 'Obey the mandatory core preflight.' \
    | python3 -c \
    'import pathlib,sys; s=sys.stdin.read(); pathlib.Path(sys.argv[1]).write_text(s); assert s.strip()=="KAI-CORE-MISSING"' \
    "$RUN_ROOT/macos/42-contract-2.txt"
)
```

Both refusal files pass only when their trimmed content is exactly
`KAI-CORE-MISSING`.

## Cloud throwaway-branch spike (executed; indeterminate)

Official documentation says Copilot coding agent installs plugins declaratively
from repository `.github/copilot/settings.json`. The bounded question is whether
the cloud host reads this file from the assigned non-default branch and accepts
direct plugin specs as `enabledPlugins` keys. The packet below is retained as
execution history; its observed result is recorded above and must not be rerun
as a substitute for the consumer-repository experiment.

### Branch payload

The throwaway branch contains exactly:

```json
{
  "enabledPlugins": {
    "RubenSaucedo/kai:packs/kai-core": true,
    "RubenSaucedo/kai:packs/kai-personal": true
  }
}
```

Use object form unless current official schema proves it invalid. Do not add
`extraKnownMarketplaces`, `copilot-setup-steps.yml`, or a public marketplace
entry during this spike.

Operator branch commands:

```bash
set -euo pipefail

REPO_URL="https://github.com/RubenSaucedo/kai.git"
BRANCH="kai/chore/pack-split-host-gates-cloud-spike"
SPIKE_CLONE="$PWD/.kai/runs/eng/2026-08-26/02-infra-pack-split-host-gates/cloud-branch"
test ! -e "$SPIKE_CLONE"
test -z "$(git ls-remote --heads "$REPO_URL" "$BRANCH")"
git clone "$REPO_URL" "$SPIKE_CLONE"
git -C "$SPIKE_CLONE" fetch origin main
git -C "$SPIKE_CLONE" switch --create "$BRANCH" origin/main
test ! -e "$SPIKE_CLONE/.github/copilot/settings.json"
mkdir -p "$SPIKE_CLONE/.github/copilot"
python3 -c \
'import json,pathlib,sys
path=pathlib.Path(sys.argv[1])
data={"enabledPlugins":{"RubenSaucedo/kai:packs/kai-core":True,"RubenSaucedo/kai:packs/kai-personal":True}}
path.write_text(json.dumps(data,indent=2)+"\n")' \
"$SPIKE_CLONE/.github/copilot/settings.json"
test "$(git -C "$SPIKE_CLONE" status --short)" = "?? .github/copilot/"
git -C "$SPIKE_CLONE" add .github/copilot/settings.json
git -C "$SPIKE_CLONE" diff --cached --check
test "$(git -C "$SPIKE_CLONE" diff --cached --name-only)" = ".github/copilot/settings.json"
git -C "$SPIKE_CLONE" commit -m "chore: configure pack host-gate cloud spike"
git -C "$SPIKE_CLONE" push --set-upstream origin "$BRANCH"
```

The operator executed those commands for the historical spike. The cloud task
committed no changes. Never merge this branch.

### One cloud task

Assign exactly one Copilot coding-agent task with
`kai/chore/pack-split-host-gates-cloud-spike` selected as its base branch. A
plain issue assignment that silently defaults to `main` does not qualify.

Task prompt:

```text
Read-only host-gate spike. Do not edit, commit, push, install, update, publish,
open a pull request, or change settings.

First use read-only shell commands to report:
uname -a
node --version
npm --version
git rev-parse HEAD
git branch --show-current
git status --porcelain

Require the selected base to contain .github/copilot/settings.json with exactly
these enabledPlugins keys:
RubenSaucedo/kai:packs/kai-core
RubenSaucedo/kai:packs/kai-personal

Invoke kai-core-contract-v1 and require exactly:
KAI_CORE_READY
contract: 1

Then dispatch kai-personal:persona-self once. Ask it to obey its mandatory
preflight, load kai-core-team-operating-rules from the core provider, and return
exactly CLOUD_CHILD_OK. Return CLOUD_PARENT_OK only after that succeeds.

Do not claim provider identity from final text. The operator will preserve the
host event record for the selected plugin agent and both skill providers.
Do not author a task URL, run ID, or other host identity.
```

The task must not manually run `copilot plugin install`; declarative
installation is the behavior under test. It must not edit, commit, push,
install, update, publish, or open a pull request.

### Cloud evidence to preserve

```text
cloud/00-run-identity.json
cloud/01-branch-and-head.txt
cloud/02-host.txt
cloud/10-enabled-plugin-inventory.json
cloud/20-parent-provider-events.jsonl
cloud/21-child-provider-events.jsonl
cloud/99-summary.json
```

`00-run-identity.json` must come from GitHub host metadata or an operator export,
not task output. It records repository, selected base branch, task/run URL or
stable ID, and timestamps. Provider event files must preserve the host events
showing `kai-core-contract-v1` and `kai-core-team-operating-rules` from
`kai-core`, and `kai-personal:persona-self` from `kai-personal`.

If the result is **default-branch-only**, stop and route escalation E1 to
`principal-product-manager`. Infra does not decide whether to change `main`,
substitute a non-cloud host, or narrow acceptance. If declarative plugins are
honored but not auto-installed, record the host finding and route it to the
steward; do not work around it with a manual install.

## Safety and abort criteria

Abort and preserve evidence if:

- remote `main` moves during the macOS install packet;
- installed manifest bytes differ from source at the recorded run-start tip;
- a command targets the normal Copilot home;
- legacy `kai` or an unreadable inventory is present;
- direct and directory-marketplace provenance cannot be distinguished;
- a provider cannot be tied to its installed root;
- an unexpected package manifest, lockfile, or `node_modules` appears;
- either refusal arm contains additional model text;
- the cloud task ran against a branch other than the explicitly selected
  fixture branch (throwaway branch for the historical spike; default branch for
  the consumer fixture);
- the cloud run lacks host-issued task/run identity;
- plugin or skill provider events cannot be preserved;
- the cloud task edits, commits, pushes, installs, updates, publishes, or opens a
  pull request; or
- credentials appear in transferred evidence.

Do not substitute a generic subagent, a generic Linux/Windows Actions CLI
runner, a local VM, or model-authored identity for the cloud arm. Do not use
`--plugin-dir` as persistent-install evidence. Do not modify the public
marketplace, release metadata, plugin manifests, packs, or Kai `main` cloud
settings.

## Completion rule

After the cloud arm produces a conclusive result, update this record with exact
evidence paths and results. Commit the documentation/coordination revision to
obtain a `change_ref`, then route that exact revision to `principal-sre` for
`independent-reliability`. Until reviewed completion, the item stays incomplete
and release 12b remains **NO-GO**.
