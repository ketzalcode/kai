PROPOSAL
  problem:          The search results page has no way to compare several similar results without opening multiple tabs, which makes side-by-side review slow and error-prone.
  proposed_change:  Add a persistent comparison tray where operators can pin up to three results from the list and compare them side by side without leaving the page.
  friction_cost:    This introduces a new pinned-results surface, pin/unpin controls in each row, tray state management, and a new comparison interaction on the current screen.
  mission_tradeoff: The idea improves review efficiency, but it adds a new capability and interaction surface, so it expands beyond the current screen work rather than refining existing behavior.
  scope_target:     New search-results comparison capability; it should be handled as a separate proposal, not folded into the current screen.
