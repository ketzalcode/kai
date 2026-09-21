import {randomUUID, createHash} from 'node:crypto';
import {existsSync} from 'node:fs';
import {RuntimeError, assertExactKeys, canonicalJson, commandDigest, criteriaRef,
  validateActor, validateCommand, validateRecord, COMMAND_KINDS, CLASSIFICATIONS} from './contract.mjs';
import {contextIdentity, matchHumanDecision, readNativeTool} from './native-receipts.mjs';
import {capabilityId, readIssued, writeIssued} from './native-capabilities.mjs';
import {createTrustedEmbedding} from './host-composition.mjs';
import {migrationManifest, privateAdmission, safePath, exactFile, DATABASE, LOCK} from './migration-files.mjs';
import {openStore, closeStore, readRecord, listRecords, readOperationReceipt} from './store.mjs';
import {assertWorkspaceWrite} from './workspace-guard.mjs';
import {migrateWorkspace, recoverMigration, rollbackMigration, bindMigrationRepair, repairLegacyRecord} from './migration.mjs';
import {planDispatch} from './host.mjs';
import {sameActor} from './authority.mjs';
import {captureInputBasis} from './input-basis.mjs';
import {verifyNativeContext} from './native-context.mjs';
import {routingActions, delegatedActions, routingBasis, requireRoutingScope} from './native-routing.mjs';
import {copilotLaunch} from './native-discovery.mjs';

const fail = (code, message) => { throw new RuntimeError(code, message); };
const hash = value => createHash('sha256').update(canonicalJson(value)).digest('hex');
const exact = (value, keys, label) => assertExactKeys(value, new Set(keys), label);
const manifestHash = root => hash(JSON.parse(exactFile(root, '.kai/manifest.json')));
const runActions = new Set([...COMMAND_KINDS].filter(k => !k.startsWith('initiative.')
  && !k.startsWith('attempt.') && !k.startsWith('effect.') && k !== 'item.create'));
const commandActions = command => [command.kind, ...(command.kind === 'item.handoff'
  && command.payload.state !== null ? ['item.transition'] : [])];
function currentBasis(root, id) {
  const store = openStore({path: safePath(root, DATABASE), mode: 'read'});
  try {
    const item = readRecord(store, 'item', id) ?? fail('EVIDENCE_GAP', 'run scope requires an existing item');
    return itemBasis(root, store, item);
  }
  finally { closeStore(store); }
}
function itemBasis(root, store, item) {
  return {subject: item.body.change_ref, criteria: criteriaRef(item.body),
    inputs: captureInputBasis({root}, {get: (kind, id) => readRecord(store, kind, id)}, item.body.context_artifacts)};
}
function commandBasis(root, store, command) {
  const item = readRecord(store, 'item', command.recordId) ?? fail('EVIDENCE_GAP', 'command scope requires an existing item');
  const changes = command.kind === 'item.update' ? command.payload.changes : null;
  if (!changes || !Object.hasOwn(changes, 'context_artifacts')) return itemBasis(root, store, item);
  if (command.actor.role !== item.body.scope_authority) {
    fail('AUTHORITY_REQUIRED', 'prospective context replacement requires the actual scope owner decision');
  }
  const prospective = validateRecord({...item, body: {...item.body, ...changes}});
  const tx = {get: (kind, id) => readRecord(store, kind, id)};
  const priorBasis = {subject: item.body.change_ref, criteria: criteriaRef(item.body), inputs: [], gaps: []};
  for (const reference of [...new Set(item.body.context_artifacts)].sort()) {
    try { priorBasis.inputs.push(...captureInputBasis({root}, tx, [reference])); }
    catch (error) {
      if (!(error instanceof RuntimeError) || error.code !== 'EVIDENCE_GAP') throw error;
      priorBasis.gaps.push({reference, code: error.code, message: error.message});
    }
  }
  return {priorBasis, prospectiveBasis: itemBasis(root, store, prospective)};
}
function requestCommandBasis(root, command) {
  const store = openStore({path: safePath(root, DATABASE), mode: 'read'});
  try { return commandBasis(root, store, command); }
  finally { closeStore(store); }
}
function visibleRequest(payload) {
  const {nonce, createdAt, expiresAt, ...scope} = payload;
  return {...payload,
    message: `Kai operator authorization\nWorkspace: ${payload.root}\nNonce: ${nonce}\nScope (exact JSON):\n${canonicalJson(scope)}\n`
      + `Expires: ${expiresAt}\nApprove only this actor, workspace, subject, criteria and action. `
      + `Reply exactly APPROVE ${nonce} or DECLINE ${nonce}. Conditional/freeform replies do not authorize work.`,
    requestedSchema: {type: 'object', properties: {decision: {
      type: 'string', enum: [`APPROVE ${nonce}`, `DECLINE ${nonce}`],
    }}, required: ['decision'], additionalProperties: false},
  };
}

async function captureReceipt(env, request, toolCallId) {
  const receipt = await readNativeTool({env, toolCallId, toolNames: ['powershell'],
    matchesStart: args => args?.command === request.command});
  if (receipt.start.arguments?.command !== request.command
    || receipt.start.arguments.mode === 'async'
    || Date.parse(receipt.start.timestamp) < Date.parse(request.createdAt)
    || receipt.complete.success !== true) {
    fail('EVIDENCE_GAP', 'capture requires the exact completed native command issued after its scoped intent; no automatic execution/retry');
  }
  return receipt;
}

/** Default CLI integration. Environment is the trusted host launch context,
 * not authentication against arbitrary code running as the same OS user.
 * discover is an embedding seam only, never selected by command JSON.
 */
export function createNativeHost({env = process.env, discover} = {}) {
  const identity = () => contextIdentity(env);
  const discovery = async (root, role) => discover ? discover({root, role}) : (await import('./native-discovery.mjs')).discoverCopilot({root, env, role});
  const ensureIdentity = actor => {
    validateActor(actor);
    if (actor.runId !== identity()) fail('AUTHORITY_REQUIRED', 'actor runId must match COPILOT_AGENT_SESSION_ID; role relabeling does not create independence');
  };
  function capability(root, id, currentContext = true) {
    const cap = readIssued(root, 'capabilities', id);
    if (cap.request.root !== root || cap.request.workspaceManifest !== manifestHash(root)
      || Date.parse(cap.request.expiresAt) <= Date.now()) fail('AUTHORITY_REQUIRED', 'issued capability expired or workspace binding changed');
    if (currentContext && cap.request.requesterContext !== identity()) fail('AUTHORITY_REQUIRED', 'capability belongs to a different actual host context');
    return cap;
  }
  function preparation(root, actor) {
    const prepared = readIssued(root, 'preparations', actor.runId);
    if (!sameActor(prepared.actor, actor) || prepared.root !== root
      || prepared.workspaceManifest !== manifestHash(root) || Date.parse(prepared.expiresAt) <= Date.now()) {
      fail('AUTHORITY_REQUIRED', 'native preparation actor, workspace or lifetime does not match');
    }
    return prepared;
  }
  async function delegatedContext(root, store, cap, command) {
    const scope = cap.request.scope;
    const parent = capability(root, cap.parentCapability, false);
    if (parent.request.scope.type !== 'coordination'
      || parent.request.scope.itemId !== scope.itemId
      || scope.actions.some(a => !delegatedActions.has(a) || !parent.request.scope.actions.includes(a))) {
      fail('AUTHORITY_REQUIRED', 'delegation is not a bounded subset of an actual coordinator grant');
    }
    requireRoutingScope(root, store, parent);
    requireRoutingScope(root, store, cap, command);
    const prepared = preparation(root, scope.actor);
    const context = await verifyNativeContext({env, root, preparation: prepared, reservedAt: cap.request.createdAt});
    return {prepared, context};
  }
  async function leaseContext(root, store, actor, itemId, token) {
    const item = readRecord(store, 'item', itemId);
    const lease = item?.body.lease;
    const grant = lease && lease.token === token && sameActor(lease.holder, actor)
      && Date.parse(lease.expires_at) > Date.now() && listRecords(store, {kind: 'grant', itemId})
        .find(r => sameActor(r.body.actor, actor) && r.body.lease_token === token
          && r.body.status === 'active' && Date.parse(r.body.expires_at) > Date.now());
    if (!grant) fail('AUTHORITY_REQUIRED', 'the actual actor must hold a live persisted lease or bounded delegation');
    const reserved = readIssued(root, 'reservations', token);
    if (reserved.itemId !== itemId || !sameActor(reserved.actor, actor) || reserved.leaseToken !== token) {
      fail('AUTHORITY_REQUIRED', 'native reservation is not bound to this persisted lease');
    }
    const prepared = preparation(root, actor);
    const context = await verifyNativeContext({env, root, preparation: prepared, reservedAt: reserved.reservedAt});
    return {prepared, context, grant, leaseToken: token};
  }
  return {
    async capabilities({root}) {
      return {discovery: await discovery(root)};
    },
    async prepare({root, body}) {
      exact(body, ['role'], 'native preparation');
      if (typeof body.role !== 'string' || !body.role || body.role === 'operator') fail('INVALID_INPUT', 'prepare requires a non-operator native role');
      const requesterContext = identity();
      const catalog = await discovery(root, body.role);
      const actor = catalog.prepared?.actor;
      if (!actor || actor.role !== body.role || !catalog.roster.some(r => r.id === catalog.prepared.agentId && r.role === actor.role)
        || catalog.modelPromptSent !== false || catalog.transportClosed !== true) {
        fail('UNSUPPORTED_HOST', 'host did not supply a metadata-only prepared native context');
      }
      const id = capabilityId(actor.runId);
      const prepared = {id, actor, agentId: catalog.prepared.agentId, root,
        workspaceManifest: manifestHash(root), requesterContext, catalog,
        createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 3600_000).toISOString(), reserved: false};
      writeIssued(root, 'preparations', id, prepared);
      const launch = copilotLaunch(env);
      return {preparation: prepared, discovery: catalog,
        launch: {executable: launch.executable, arguments: [`--session-id=${id}`, `--agent=${prepared.agentId}`, ...launch.pluginArguments]},
        instruction: 'Metadata only; not permission to start model work. First persist item.grant or delegate to this actor. Then launch this standalone context in this workspace using these identity arguments and existing host permissions. Its first command should be claim. Native ACP metadata-only sessions are not promised to survive transport closure.'};
    },
    async delegate({root, store, body, options}) {
      exact(body, ['actor', 'itemId', 'preparation', 'actions', 'questionId'], 'role delegation');
      ensureIdentity(body.actor);
      const parent = capability(root, options.capability);
      if (parent.request.scope.type !== 'coordination' || !sameActor(parent.request.scope.actor, body.actor)
        || parent.request.scope.itemId !== body.itemId
        || !Array.isArray(body.actions) || !body.actions.length || new Set(body.actions).size !== body.actions.length
        || body.actions.some(a => !delegatedActions.has(a) || !parent.request.scope.actions.includes(a))) {
        fail('AUTHORITY_REQUIRED', 'delegation requires an already-authorized coordinator and explicit bounded role-owned actions');
      }
      const item = requireRoutingScope(root, store, parent);
      const prepared = readIssued(root, 'preparations', body.preparation);
      preparation(root, prepared.actor);
      if (prepared.requesterContext !== identity()) fail('AUTHORITY_REQUIRED', 'only the preparing coordinator can delegate this context');
      const question = body.questionId === null ? null : readRecord(store, 'question', body.questionId);
      if (body.actions.includes('question.answer') && (!question || question.itemId !== body.itemId
        || question.body.recipient !== prepared.actor.role || prepared.actor.role === 'operator')) {
        fail('AUTHORITY_REQUIRED', 'answer delegation must bind the actual addressed role and question');
      }
      if (!body.actions.includes('question.answer') && body.questionId !== null) fail('INVALID_INPUT', 'question binding is only for an answer delegation');
      if (!question && ![item.body.next_role, item.body.scope_authority].includes(prepared.actor.role)) {
        fail('AUTHORITY_REQUIRED', 'handoff delegation must be assigned to the current routed role or scope owner');
      }
      const nonce = randomUUID();
      const request = {nonce, root, workspaceManifest: manifestHash(root), requesterContext: prepared.actor.runId,
        createdAt: new Date().toISOString(), expiresAt: new Date(Math.min(
          Date.parse(parent.request.expiresAt), Date.parse(prepared.expiresAt))).toISOString(),
        routingBasis: parent.request.routingBasis, scope: {type: 'delegation', actor: prepared.actor,
          itemId: body.itemId, actions: body.actions, questionId: body.questionId}};
      writeIssued(root, 'capabilities', nonce, {request, parentCapability: options.capability, catalog: prepared.catalog});
      return {capability: nonce, actor: prepared.actor, expiresAt: request.expiresAt, reservedAt: request.createdAt};
    },
    async claim({root, store, options}) {
      const prepared = readIssued(root, 'preparations', identity());
      preparation(root, prepared.actor);
      if (options.capability) {
        const cap = capability(root, options.capability);
        if (cap.request.scope.type !== 'delegation' || cap.request.scope.itemId !== options.item
          || !sameActor(cap.request.scope.actor, prepared.actor)) fail('AUTHORITY_REQUIRED', 'claim requires this prepared actor and exact delegated item');
        const {context} = await delegatedContext(root, store, cap);
        return {actor: prepared.actor, context, actions: cap.request.scope.actions, leaseToken: null};
      }
      const lease = readRecord(store, 'item', options.item)?.body.lease;
      const bound = await leaseContext(root, store, prepared.actor, options.item, lease?.token);
      return {actor: prepared.actor, context: bound.context, actions: bound.grant.body.actions, leaseToken: bound.leaseToken};
    },
    async request({root, body}) {
      const requesterContext = identity();
      const payload = {nonce: randomUUID(), root, workspaceManifest: manifestHash(root),
        requesterContext, createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), scope: body};
      if (body.type === 'command') {
        exact(body, ['type', 'command'], 'command request');
        validateCommand(body.command); ensureIdentity(body.command.actor);
        payload.subject = body.command.payload.body?.subject ?? body.command.payload.subject ?? null;
        payload.criteria = body.command.payload.body?.criteria_ref ?? null;
        payload.action = body.command.kind;
        if (body.command.recordKind === 'item' && body.command.expectedVersion > 0) {
          Object.assign(payload, requestCommandBasis(root, body.command));
        }
      } else if (body.type === 'coordination') {
        exact(body, ['type', 'actor', 'itemId', 'actions'], 'coordination request');
        ensureIdentity(body.actor);
        if (body.actor.role === 'operator' || !Array.isArray(body.actions) || !body.actions.length
          || new Set(body.actions).size !== body.actions.length || body.actions.some(a => !routingActions.has(a))) {
          fail('INVALID_INPUT', 'coordination actions must be explicit non-operator routing actions, not acceptance');
        }
        const store = openStore({path: safePath(root, DATABASE), mode: 'read'});
        try {
          const item = readRecord(store, 'item', body.itemId) ?? fail('EVIDENCE_GAP', 'coordination requires an existing item');
          payload.routingBasis = routingBasis(root, store, item);
        } finally { closeStore(store); }
        payload.action = body.actions;
      } else if (body.type === 'run') {
        exact(body, ['type', 'actor', 'itemId', 'actions'], 'run request');
        ensureIdentity(body.actor);
        if (body.actor.role === 'operator' || !Array.isArray(body.actions) || !body.actions.length
          || new Set(body.actions).size !== body.actions.length || body.actions.some(a => !runActions.has(a))) {
          fail('INVALID_INPUT', 'run actions must be explicit supported item actions for a non-operator');
        }
        Object.assign(payload, currentBasis(root, body.itemId), {action: body.actions});
      } else if (body.type === 'maintenance') {
        exact(body, ['type', 'action'], 'maintenance request');
        if (!['init', 'migrate', 'recover-activate', 'recover-abandon', 'rollback'].includes(body.action)) fail('INVALID_INPUT', 'unsupported maintenance action');
        payload.subject = payload.workspaceManifest; payload.criteria = null; payload.action = body.action;
      } else if (body.type === 'repair') {
        exact(body, ['type', 'request'], 'repair decision request');
        exact(body.request, ['operationId', 'sourceId', 'expectedVersion', 'actor', 'reason', 'body'], 'repair request');
        ensureIdentity(body.request.actor);
        payload.subject = hash(body.request); payload.criteria = null; payload.action = 'repair';
      } else if (body.type === 'capture') {
        exact(body, ['type', 'actor', 'itemId', 'command', 'checks', 'classification'], 'capture request');
        ensureIdentity(body.actor);
        if (typeof body.command !== 'string' || !body.command.trim() || Buffer.byteLength(body.command) > 32 * 1024
          || !Array.isArray(body.checks) || body.checks.length > 64
          || body.checks.some(c => typeof c !== 'string' || !c.trim() || c.length > 256)
          || new Set(body.checks).size !== body.checks.length || !CLASSIFICATIONS.has(body.classification)
          || (body.itemId !== null && (typeof body.itemId !== 'string' || !body.itemId))) {
          fail('INVALID_INPUT', 'capture needs an exact PowerShell command, bounded check labels, classification and itemId|null');
        }
        if (body.itemId !== null) Object.assign(payload, currentBasis(root, body.itemId));
        else { payload.subject = null; payload.criteria = null; payload.inputs = []; }
        const request = {...payload, command: `# Kai capture ${payload.nonce}\n${body.command}`,
          instruction: 'Run this exact command once through the existing authorized native PowerShell tool. This request neither authorizes nor executes it. Then use receipt/capture with this request nonce; --tool-call is optional when known. Never replay an uncertain effect.'};
        writeIssued(root, 'requests', request.nonce, request);
        return {request};
      } else fail('INVALID_INPUT', 'request type must be command, run, coordination, maintenance, repair or capture');
      const request = visibleRequest(payload);
      writeIssued(root, 'requests', request.nonce, request);
      return {request};
    },
    async receipt({root, options}) {
      const request = readIssued(root, 'requests', options.request);
      if (request.root !== root || request.workspaceManifest !== manifestHash(root)
        || Date.parse(request.expiresAt) <= Date.now()) fail('AUTHORITY_REQUIRED', 'request expired or workspace changed');
      if (request.scope.type === 'capture') {
        if (request.requesterContext !== identity()) fail('AUTHORITY_REQUIRED', 'capture receipt belongs to another context');
        const receipt = await captureReceipt(env, request, options['tool-call']);
        return {receipt: {toolCallId: receipt.toolCallId, sessionId: receipt.sessionId,
          startEventId: receipt.start.id, completeEventId: receipt.complete.id, capturedAt: receipt.complete.timestamp}};
      }
      const receipt = await matchHumanDecision({env, request, toolCallId: options['tool-call']});
      return {receipt};
    },
    async authorize({root, options}) {
      const request = readIssued(root, 'requests', options.request);
      if (request.scope.type === 'capture') fail('INVALID_INPUT', 'capture intents are not authorization requests');
      if (request.scope.type === 'coordination' && request.scope.actions.some(action => !routingActions.has(action))) {
        fail('INVALID_INPUT', 'coordination request contains unsupported routing actions; issue a new supported request');
      }
      if (request.root !== root || request.workspaceManifest !== manifestHash(root) || Date.parse(request.expiresAt) <= Date.now()) {
        fail('AUTHORITY_REQUIRED', 'request expired or workspace changed');
      }
      const receipt = await matchHumanDecision({env, request, toolCallId: options['tool-call']});
      const actor = request.scope.command?.actor ?? request.scope.actor ?? request.scope.request?.actor;
      let catalog;
      if (existsSync(safePath(root, `.kai/state/host/capabilities/${request.nonce}.json`))) {
        const existing = readIssued(root, 'capabilities', request.nonce);
        if (canonicalJson(existing.request) !== canonicalJson(request) || canonicalJson(existing.receipt) !== canonicalJson(receipt)) {
          fail('OPERATION_CONFLICT', 'this nonce already has a different issued decision receipt');
        }
        catalog = existing.catalog;
      } else catalog = await discovery(root);
      if (actor && actor.role !== 'operator' && !catalog.roster.some(entry => entry.role === actor.role)) {
        fail('ROLE_UNAVAILABLE', 'requested actor role is not in the actual host roster');
      }
      writeIssued(root, 'capabilities', request.nonce, {request, receipt, catalog});
      return {capability: request.nonce, actor: actor ?? null, expiresAt: request.expiresAt,
        receipt: {reference: receipt.reference, captured_at: receipt.captured_at}};
    },
    async maintenance({root, verb, body, options}) {
      const cap = capability(root, options.capability);
      const action = verb === 'recover' ? `recover-${options.action}` : verb;
      if (verb === 'repair') {
        if (cap.request.scope.type !== 'repair' || canonicalJson(cap.request.scope.request) !== canonicalJson(body)) {
          fail('AUTHORITY_REQUIRED', 'repair requires a matched decision for the exact repair request');
        }
        ensureIdentity(body.actor);
        assertWorkspaceWrite(safePath(root, DATABASE), {requirePrivate: true});
        const store = openStore({path: safePath(root, DATABASE), mode: 'write'});
        try {
          bindMigrationRepair(store, {root, roles: cap.catalog.roster.map(e => e.role),
            verify: ({request}) => canonicalJson(request) === canonicalJson(body)});
          return repairLegacyRecord(store, body);
        } finally { closeStore(store); }
      }
      if (options.confirm !== true || cap.request.scope.type !== 'maintenance' || cap.request.scope.action !== action) {
        fail('AUTHORITY_REQUIRED', 'maintenance requires --confirm and an issued capability for the exact action');
      }
      if (verb === 'migrate') return migrateWorkspace({root, confirm: true, roles: cap.catalog.roster.map(e => e.role), env});
      if (verb === 'recover') {
        if (!existsSync(safePath(root, LOCK))) fail('RECOVERY_REQUIRED', 'no interrupted migration lock exists; recovery never initializes or retries work');
        return recoverMigration({root, confirm: true, action: options.action, env});
      }
      if (verb === 'rollback') return rollbackMigration({root, confirm: true, env});
      migrationManifest(root, [4], env);
      const path = safePath(root, DATABASE);
      if (existsSync(path)) fail('VERSION_CONFLICT', 'store already exists; init never replaces or repairs it');
      const privacy = privateAdmission(root, {admit: true});
      if (privacy.errors.length) fail('INVALID_INPUT', privacy.errors.join('; '));
      assertWorkspaceWrite(path, {requirePrivate: true});
      const store = openStore({path, mode: 'create'});
      closeStore(store);
      return {initialized: true, databasePath: path, privateAdmission: privacy.admitted};
    },
    async apply({root, store, command, options}) {
      ensureIdentity(command.actor);
      const cap = options.capability ? capability(root, options.capability) : null;
      let catalog, grants = [];
      if (cap) {
        const scope = cap.request.scope;
        if (scope.type === 'command') {
          if (canonicalJson(scope.command) !== canonicalJson(command)) fail('AUTHORITY_REQUIRED', 'command capability does not cover these exact command bytes');
          if (cap.request.prospectiveBasis) {
            const priorReceipt = readOperationReceipt(store, command);
            if (priorReceipt) return priorReceipt;
            if (canonicalJson(commandBasis(root, store, command)) !== canonicalJson({
              priorBasis: cap.request.priorBasis, prospectiveBasis: cap.request.prospectiveBasis,
            })) fail('EVIDENCE_GAP', 'prospective replacement or explicit prior basis gaps changed after decision');
          } else if (cap.request.inputs) {
            const current = readRecord(store, 'item', command.recordId);
            const basis = current && itemBasis(root, store, current);
            if (!basis || canonicalJson(basis.inputs) !== canonicalJson(cap.request.inputs)) fail('EVIDENCE_GAP', 'command capability applicable input basis changed');
          }
        } else if (scope.type === 'run') {
          const item = readRecord(store, 'item', scope.itemId);
          if (!sameActor(scope.actor, command.actor) || command.recordKind !== 'item'
            || command.recordId !== scope.itemId || commandActions(command).some(action => !scope.actions.includes(action))
            || !item || canonicalJson(itemBasis(root, store, item)) !== canonicalJson({
              subject: cap.request.subject, criteria: cap.request.criteria, inputs: cap.request.inputs})) {
            fail('AUTHORITY_REQUIRED', 'run capability does not cover the actor, action, subject and current input criteria');
          }
          if (command.kind === 'approval.record' && item.body.artifact_class === 'paid-media') {
            fail('AUTHORITY_REQUIRED', 'paid-media approval requires a command-specific actual human decision');
          }
        } else if (scope.type === 'coordination' || scope.type === 'delegation') {
          if (!sameActor(scope.actor, command.actor)) fail('AUTHORITY_REQUIRED', 'routing capability belongs to a different role/context');
          requireRoutingScope(root, store, cap, command);
          if (scope.type === 'delegation') await delegatedContext(root, store, cap, command);
        } else fail('AUTHORITY_REQUIRED', 'not an execution capability');
        catalog = cap.catalog;
        grants = [{actor: command.actor, actions: commandActions(command), recordKind: command.recordKind,
          recordId: command.recordId, basisRef: `${command.recordKind}/${command.recordId}@${command.expectedVersion}`}];
        if (['attempt.start', 'effect.intent'].includes(command.kind)) grants.push({
          actor: command.actor, actions: [command.kind], recordKind: 'item', recordId: command.payload.itemId,
          basisRef: `item/${command.payload.itemId}@${command.payload.itemVersion}`,
        });
      } else {
        const bound = await leaseContext(root, store, command.actor, command.recordId, command.leaseToken);
        if (commandActions(command).some(a => !bound.grant.body.actions.includes(a))) fail('AUTHORITY_REQUIRED', 'lease does not authorize the complete command');
        catalog = bound.prepared.catalog;
      }
      if (command.kind === 'item.grant') preparation(root, command.payload.holder);
      let capture;
      if (options.capture) capture = readIssued(root, 'captures', options.capture);
      const decision = () => {
        if (!cap || cap.request.scope.type !== 'command' || command.kind !== 'approval.record') return null;
        const {source, reference, attributed_to, captured_at} = cap.receipt;
        const b = command.payload.body;
        return {source, reference, attributed_to, captured_at, ...Object.fromEntries(
          ['item_id', 'subject', 'criteria_ref', 'kind', 'decision', 'deployment', 'recovery'].map(k => [k, b[k]]))};
      };
      const embedding = createTrustedEmbedding({
        identity, authorize: () => ({roles: catalog.roster.map(e => e.role), grants}),
        runs: ({actor}) => [{actor, directory: `.kai/runs/native/${actor.runId}`}],
        verifyCapture: c => {
          if (!capture || capture.type !== 'command' || !sameActor(capture.actor, c.actor)
            || capture.root !== root || capture.itemId !== c.recordId
            || canonicalJson(capture.subject) !== canonicalJson(c.payload.body.subject)
            || capture.criteria !== c.payload.body.criteria_ref
            || canonicalJson(capture.inputs) !== canonicalJson(itemBasis(root, store, readRecord(store, 'item', c.recordId)).inputs)) {
            fail('EVIDENCE_GAP', 'no host-owned capture for this actor, item, subject and current input criteria');
          }
          return {...capture.proof, command_digest: commandDigest(c)};
        },
        verifyOperatorDecision: decision,
        verifyObservation: () => {
          fail('UNSUPPORTED_HOST', 'native terminal tool receipts do not prove peer model execution or external effect outcome; bind an actual host-owned observation registry through createTrustedEmbedding');
        },
        roster: catalog.roster, profiles: catalog.profiles, capabilities: catalog.capabilities,
      });
      const result = await embedding.apply({root, store, command, options});
      const lease = command.kind === 'item.grant' && result.data.record.body.lease;
      if (lease) {
        const name = `.kai/state/host/reservations/${lease.token}.json`;
        if (!existsSync(safePath(root, name))) writeIssued(root, 'reservations', lease.token, {
          itemId: command.recordId, actor: lease.holder, leaseToken: lease.token,
          operationId: command.operationId, reservedAt: new Date().toISOString(),
        });
        else readIssued(root, 'reservations', lease.token);
      }
      return result;
    },
    async plan({root, store, itemId}) {
      const catalog = await discovery(root);
      const item = readRecord(store, 'item', itemId) ?? fail('EVIDENCE_GAP', 'item does not exist');
      return {...planDispatch({item: item.body, ...catalog}),
        gap: 'No automatic peer dispatch or effect replay. For each queued native role: prepare, persist item.grant or delegate, then launch the standalone --session-id context with existing host permissions. Inspect claim before acting; metadata preparation alone does not authorize model work.'};
    },
    async capture({root, body, options}) {
      exact(body, ['requestId'], 'capture delivery');
      const request = readIssued(root, 'requests', body.requestId);
      if (request.scope.type !== 'capture' || request.root !== root
        || request.workspaceManifest !== manifestHash(root) || request.requesterContext !== identity()
        || Date.parse(request.expiresAt) <= Date.now()) fail('AUTHORITY_REQUIRED', 'capture request is not current for this workspace and host context');
      const receipt = await captureReceipt(env, request, options['tool-call']);
      const result = receipt.complete.content;
      if (typeof result !== 'string' || Buffer.byteLength(result) > 1024 * 1024) fail('EVIDENCE_GAP', 'native command result is missing or exceeds 1 MiB; capture a bounded existing check');
      for (const line of result.split(/\r?\n/)) {
        let event;
        try { event = JSON.parse(line); } catch { continue; }
        if (typeof event?.type === 'string' && /^(assistant|model|session|user)\./.test(event.type)) {
          fail('UNSUPPORTED_HOST', 'native model/event streams require an allowlisted host-owned observation adapter; command capture never retains reasoning/cache internals');
        }
      }
      const exit = /(?:^|\n)<shellId: [^\r\n<>]+ completed with exit code (-?\d+)>\s*$/.exec(result);
      if (!exit || !Number.isSafeInteger(Number(exit[1]))) {
        fail('UNSUPPORTED_HOST', 'native command is partial or has an unsupported completion format; inspect/reconcile it, never automatically replay');
      }
      const proof = {
        source: 'host-command', reference: `host:copilot:${receipt.sessionId}:${receipt.complete.id}`,
        actor: request.scope.actor, captured_at: receipt.complete.timestamp,
        command: ['powershell', '-Command', receipt.start.arguments.command],
        exit_code: Number(exit[1]), checks: request.scope.checks, classification: request.scope.classification,
      };
      const capture = {type: 'command', root, actor: request.scope.actor, itemId: request.scope.itemId,
        subject: request.subject, criteria: request.criteria, inputs: request.inputs, proof, result,
        toolCallId: receipt.toolCallId, startEventId: receipt.start.id, completeEventId: receipt.complete.id};
      writeIssued(root, 'captures', request.nonce, capture);
      return {capture: request.nonce, exitCode: proof.exit_code, capturedAt: proof.captured_at,
        capturedCommand: receipt.start.arguments.command, reference: proof.reference,
        classification: proof.classification, resultBytes: Buffer.byteLength(result)};
    },
  };
}
