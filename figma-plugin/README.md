# H93Lab Blueprint Handoff
In Figma desktop, open Plugins → Development → Import plugin from manifest, and select manifest.json. Run the plugin inside a Design file. Import the project's downloaded figma-handoff.json. The plugin creates editable Auto Layout frames and connects navigation buttons. Cairo is preferred, Inter is a fallback.

Each blueprint version gets a dedicated page. Importing the same version twice preserves its existing nodes. New versions create new pages, so manual edits and unrelated content are never silently deleted. Download the receipt to associate the resulting node IDs with the matching version in H93Lab. The plugin uses no network access or API keys.
