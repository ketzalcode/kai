import {RuntimeError, validateCommand} from './contract.mjs';
import {applyCommand} from './engine.mjs';
import {bindEvidenceRuntime, registerArtifact, registerEvidence, recordReview, recordApproval, transitionAsset} from './evidence.mjs';
import {bindHostRuntime, recordAttempt, recordHostResult, recordEffect} from './host.mjs';
import {sameActor} from './authority.mjs';
import {commandKind} from './schema.mjs';

const trustedHandlers = new Map([
  ['artifact.register', {kind: 'evidence', apply: (store, command) => registerArtifact(store, command)}],
  ['asset.transition', {kind: 'evidence', apply: (store, command) => transitionAsset(store, command)}],
  ['evidence.register', {
    kind: 'evidence',
    apply: (store, command, options) => registerEvidence(store, command, options.capture),
  }],
  ['review.record', {kind: 'evidence', apply: (store, command) => recordReview(store, command)}],
  ['approval.record', {kind: 'evidence', apply: (store, command) => recordApproval(store, command)}],
  ['attempt.start', {kind: 'host', apply: (store, command) => recordAttempt(store, command)}],
  ['attempt.result', {
    kind: 'host',
    apply: (store, command, options) => recordHostResult(store, command, options.capture),
  }],
  ['effect.intent', {
    kind: 'host',
    apply: (store, command, options) => recordEffect(store, command, options.capture),
  }],
  ['effect.result', {
    kind: 'host',
    apply: (store, command, options) => recordEffect(store, command, options.capture),
  }],
]);

/**
 * Trusted embedding only. The caller owns identity, grants and opaque receipt
 * registries; none of these functions can be decoded from a CLI command.
 * A worker's runId must be its real host context, not a role-specific alias.
 */
export function createTrustedEmbedding({
  identity, authorize, runs, verifyCapture, verifyOperatorDecision, verifyObservation,
  roster = [], profiles = {}, capabilities, maxAttempts = 3,
}) {
  if (typeof identity !== 'function' || typeof authorize !== 'function' || typeof runs !== 'function') {
    throw new RuntimeError('INVALID_INPUT', 'trusted embedding requires identity, authorize and runs functions');
  }
  return {
    async apply({root, store, command, options = {}}) {
      validateCommand(command);
      const actual = identity();
      if (!actual || actual !== command.actor.runId) {
        throw new RuntimeError('AUTHORITY_REQUIRED', 'command actor must use the actual current host context ID');
      }
      const authority = await authorize({root, store, command, options});
      const approvedRuns = await runs({root, actor: command.actor});
      if (!approvedRuns.every(run => sameActor(run.actor, command.actor))) {
        throw new RuntimeError('AUTHORITY_REQUIRED', 'embedding must not relabel another producing context');
      }
      bindEvidenceRuntime(store, {
        root, authority, runs: approvedRuns, verifyCapture, verifyOperatorDecision,
      });
      const handler = trustedHandlers.get(commandKind(command.kind).handler);
      if (handler?.kind === 'host') {
        bindHostRuntime(store, {root, authority, roster, profiles, capabilities, maxAttempts, verifyObservation});
      }
      if (handler) return handler.apply(store, command, options);
      return applyCommand(store, command, authority);
    },
  };
}
