import {RuntimeError, validateCommand} from './contract.mjs';
import {applyCommand} from './engine.mjs';
import {bindEvidenceRuntime, registerArtifact, registerEvidence, recordReview, recordApproval, transitionAsset} from './evidence.mjs';
import {bindHostRuntime, recordAttempt, recordHostResult, recordEffect} from './host.mjs';
import {sameActor} from './authority.mjs';

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
      const producer = {
        'artifact.register': registerArtifact,
        'asset.transition': transitionAsset,
        'evidence.register': (s, c) => registerEvidence(s, c, options.capture),
        'review.record': recordReview, 'approval.record': recordApproval,
      }[command.kind];
      if (producer) return producer(store, command);
      if (['attempt.start', 'attempt.result', 'effect.intent', 'effect.result'].includes(command.kind)) {
        bindHostRuntime(store, {root, authority, roster, profiles, capabilities, maxAttempts, verifyObservation});
        if (command.kind === 'attempt.start') return recordAttempt(store, command);
        if (command.kind === 'attempt.result') return recordHostResult(store, command, options.capture);
        return recordEffect(store, command, options.capture);
      }
      return applyCommand(store, command, authority);
    },
  };
}
