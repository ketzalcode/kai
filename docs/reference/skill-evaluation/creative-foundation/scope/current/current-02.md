Expands scope, so don’t fold it into current screen work.

PROPOSAL
  problem:          Operators need to compare several similar search results without opening multiple tabs or losing context.
  proposed_change:  Add a persistent comparison tray that lets operators pin up to three results and compare them side by side on the Search Results page.
  friction_cost:    Adds pin/unpin controls in each result row, tray state management, a new pinned-results surface, and a side-by-side comparison interaction.
  mission_tradeoff: Fits the workflow goal, but it adds a new surface and a new interaction, so it is a scope expansion rather than a refinement of the current page.
  scope_target:     Search Results page comparison workflow / a future proposal for the results surface.
