/**
 * Initialize the responsive tag graph when the DOM is fully loaded
 */
document.addEventListener("DOMContentLoaded", function () {
	// Check if we have a tag graph container
	const container = document.getElementById("tag-graph-container");
	if (container && window.tagGraphData && typeof ResponsiveTagGraph === 'function') {
		console.log("Initializing ResponsiveTagGraph");
		const tagGraph = new ResponsiveTagGraph("tag-graph-container", {
			// Default options
			responsive: true,
			touchOptimized: "auto",
			data: window.tagGraphData
		});

		// Store reference to the instance to allow external access
		container.__tagGraph = tagGraph;
		console.log("ResponsiveTagGraph initialized successfully");
	} else {
		console.log("Cannot initialize ResponsiveTagGraph:", {
			container: !!container,
			tagGraphData: !!window.tagGraphData,
			ResponsiveTagGraph: typeof ResponsiveTagGraph === 'function'
		});
	}

	// Also check for any shortcode instances
	document
		.querySelectorAll(".tag-graph-shortcode")
		.forEach(function (element, index) {
			const id = "tag-graph-" + index;
			element.id = id;

			// Get options from data attributes
			const style = element.getAttribute("data-style") || "force";

			if (typeof ResponsiveTagGraph === 'function') {
				const tagGraph = new ResponsiveTagGraph(id, {
					// Style-specific configurations
					animate: style !== "static",
					responsive: true,
					touchOptimized: "auto",
				});

				// Store reference to the instance
				element.__tagGraph = tagGraph;

				// Check if there's a filter attribute
				const filterTag = element.getAttribute("data-filter-tag");
				if (filterTag) {
					tagGraph.filterByTag(filterTag);
				}
			}
		});

	// Check for post-specific tag graphs
	document
		.querySelectorAll(".post-tag-graph")
		.forEach(function (element, index) {
			if (
				element.id === "post-tag-graph-container" &&
				window.postTagGraphData &&
				typeof ResponsiveTagGraph === 'function'
			) {
				const tagGraph = new ResponsiveTagGraph("post-tag-graph-container", {
					// Post-specific settings
					data: window.postTagGraphData,
					highlightCurrentPostTags: true,
					nodeColorFn: (d) => (d.isCurrentPostTag ? "#ff7f0e" : "#1f77b4"),
					linkColorFn: (d) => (d.isCurrentPostLink ? "#ff7f0e" : "#999"),
					isPostContext: true,
					responsive: true,
					touchOptimized: "auto",
				});

				// Store reference
				element.__tagGraph = tagGraph;
			}
		});
});