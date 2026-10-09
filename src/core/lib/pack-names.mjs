import {WORKSPACE_CONTRACT} from './workspace-layout.mjs';

export const PACK_ORDER = WORKSPACE_CONTRACT.packs;

// Core is the required shared plugin; departments are `kai-<department>`.
export const packPluginName = (pack) => (pack === 'core' ? 'kai-core' : `kai-${pack}`);
