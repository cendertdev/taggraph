/**
 * Enhanced TagGraph class with post-specific functionality
 * Extends the base TagGraph implementation with features for
 * highlighting and filtering based on a specific post's tags
 */

class TagGraph {
	constructor(containerId, options = {}) {
		this.containerId = containerId;
		this.container = document.getElementById(containerId);
		if (!this.container) {
			console.error(`Container element with ID "${containerId}" not found`);
			return;
		}

		// Default configuration
		this.config = {
			minNodeSize: options.minNodeSize || 5,
			maxNodeSize: options.maxNodeSize || 20,
			width: options.width || this.container.clientWidth || 800,
			height: options.height || this.container.clientHeight || 600,
			colors: options.colors || d3.schemeCategory10,
			linkStrength: options.linkStrength || 0.7,
			chargeStrength: options.chargeStrength || -300,
			backgroundColor: options.backgroundColor || "#ffffff",
			linkColor: options.linkColor || "#999",
			linkOpacity: options.linkOpacity || 0.6,
			nodeBorder: options.nodeBorder || "#fff",
			nodeBorderWidth: options.nodeBorderWidth || 1.5,
			labelColor: options.labelColor || "#333",
			fontSize: options.fontSize || 10,
			showLabels: options.showLabels !== undefined ? options.showLabels : true,
			animate: options.animate !== undefined ? options.animate : true,
			highlightCurrentPostTags: options.highlightCurrentPostTags || false,
			isPostContext: options.isPostContext || false,
			nodeColorFn: options.nodeColorFn || null,
			linkColorFn: options.linkColorFn || null,
		};

		// Use provided data or get it from window
		this.originalData =
			options.data ||
			(window.tagGraphData
				? JSON.parse(JSON.stringify(window.tagGraphData))
				: null);

		if (!this.originalData) {
			console.error("Tag graph data not found");
			return;
		}

		// Make a copy of the data for manipulation
		this.data = JSON.parse(JSON.stringify(this.originalData));

		// Track highlighting state
		this.highlighting = this.config.highlightCurrentPostTags;

		// Initialize the visualization
		this.init();
	}

	init() {
		// Create SVG container
		this.svg = d3
			.select(this.container)
			.append("svg")
			.attr("width", this.config.width)
			.attr("height", this.config.height)
			.attr("viewBox", [0, 0, this.config.width, this.config.height])
			.attr(
				"style",
				"max-width: 100%; height: auto; background-color: " +
					this.config.backgroundColor
			);

		// Add a group for all the graph elements
		this.g = this.svg.append("g");

		// Add zoom and pan functionality
		this.zoom = d3
			.zoom()
			.scaleExtent([0.1, 4])
			.on("zoom", (event) => {
				this.g.attr("transform", event.transform);
			});

		this.svg.call(this.zoom);

		// Add controls if not post-specific (post-specific controls added separately)
		if (!this.config.isPostContext) {
			this.addControls();
		}

		// Render the graph
		this.render();
	}

	render() {
		// Clear existing elements
		this.g.selectAll("*").remove();

		// Calculate node sizes based on count
		this.nodeScale = d3
			.scaleSqrt()
			.domain([1, d3.max(this.data.nodes, (d) => d.count)])
			.range([this.config.minNodeSize, this.config.maxNodeSize]);

		// Add groups for links and nodes
		this.linkGroup = this.g.append("g").attr("class", "links");
		this.nodeGroup = this.g.append("g").attr("class", "nodes");

		// Create links
		this.links = this.linkGroup
			.selectAll("line")
			.data(this.data.links)
			.enter()
			.append("line")
			.attr("stroke", (d) => this.getLinkColor(d))
			.attr("stroke-opacity", this.config.linkOpacity)
			.attr("stroke-width", (d) => Math.sqrt(d.value));

		// Create nodes
		this.nodes = this.nodeGroup
			.selectAll("g")
			.data(this.data.nodes)
			.enter()
			.append("g")
			.attr(
				"class",
				(d) => "node" + (d.isCurrentPostTag ? " current-post-tag" : "")
			)
			.call(this.createDragBehavior());

		// Add circles for each node
		this.nodes
			.append("circle")
			.attr("r", (d) => this.nodeScale(d.count))
			.attr("fill", (d, i) => this.getNodeColor(d, i))
			.attr("stroke", this.config.nodeBorder)
			.attr("stroke-width", (d) =>
				d.isCurrentPostTag
					? this.config.nodeBorderWidth * 2
					: this.config.nodeBorderWidth
			);

		// Add text labels if enabled
		if (this.config.showLabels) {
			this.nodes
				.append("text")
				.attr("x", 0)
				.attr("y", (d) => -this.nodeScale(d.count) - 2)
				.attr("text-anchor", "middle")
				.attr("fill", (d) =>
					d.isCurrentPostTag ? "#000" : this.config.labelColor
				)
				.attr("font-size", (d) =>
					d.isCurrentPostTag
						? parseInt(this.config.fontSize) + 2 + "px"
						: this.config.fontSize + "px"
				)
				.attr("font-weight", (d) => (d.isCurrentPostTag ? "bold" : "normal"))
				.text((d) => d.name);
		}

		// Add tooltips
		this.nodes.append("title").text((d) => {
			const postTagIndicator = d.isCurrentPostTag ? " (Current Post)" : "";
			return `${d.name}${postTagIndicator}: ${d.count} posts`;
		});

		// Create force simulation
		this.simulation = d3
			.forceSimulation(this.data.nodes)
			.force(
				"link",
				d3
					.forceLink(this.data.links)
					.id((d) => d.id)
					.distance(100)
					.strength(
						(d) =>
							this.config.linkStrength /
							Math.min(count(d.source), count(d.target))
					)
			)
			.force("charge", d3.forceManyBody().strength(this.config.chargeStrength))
			.force(
				"center",
				d3.forceCenter(this.config.width / 2, this.config.height / 2)
			)
			.force(
				"collide",
				d3.forceCollide().radius((d) => this.nodeScale(d.count) + 10)
			);

		// Helper function to get count
		function count(d) {
			return d.count || 1;
		}

		// Update positions during simulation
		this.simulation.on("tick", () => this.updatePositions());

		// Stop simulation after a while if animation is disabled
		if (!this.config.animate) {
			// Run for a few iterations then stop
			for (let i = 0; i < 300; i++) {
				this.simulation.tick();
			}
			this.simulation.stop();
			this.updatePositions();
		}
	}

	getNodeColor(d, i) {
		// Use custom color function if provided
		if (this.config.nodeColorFn) {
			return this.config.nodeColorFn(d);
		}

		// Use highlighting if enabled
		if (this.highlighting && d.isCurrentPostTag) {
			return "#ff7f0e"; // Highlight color for current post tags
		}

		// Default color scheme
		return this.config.colors[i % this.config.colors.length];
	}

	getLinkColor(d) {
		// Use custom color function if provided
		if (this.config.linkColorFn) {
			return this.config.linkColorFn(d);
		}

		// Use highlighting if enabled
		if (this.highlighting && d.isCurrentPostLink) {
			return "#ff7f0e"; // Highlight color for current post links
		}

		// Default link color
		return this.config.linkColor;
	}

	updatePositions() {
		// Update link positions
		this.links
			.attr("x1", (d) => d.source.x)
			.attr("y1", (d) => d.source.y)
			.attr("x2", (d) => d.target.x)
			.attr("y2", (d) => d.target.y);

		// Update node positions
		this.nodes.attr("transform", (d) => `translate(${d.x},${d.y})`);
	}

	createDragBehavior() {
		return d3
			.drag()
			.on("start", (event, d) => {
				if (!event.active) this.simulation.alphaTarget(0.3).restart();
				d.fx = d.x;
				d.fy = d.y;
			})
			.on("drag", (event, d) => {
				d.fx = event.x;
				d.fy = event.y;
			})
			.on("end", (event, d) => {
				if (!event.active) this.simulation.alphaTarget(0);
				d.fx = null;
				d.fy = null;
			});
	}

	// Filter the graph to show only tags related to the selected tag
	filterByTag(tagName) {
		if (!tagName) {
			this.resetFilters();
			return;
		}

		// Find the selected tag
		const selectedNode = this.originalData.nodes.find((n) => n.id === tagName);
		if (!selectedNode) return;

		// Find all links connected to this tag
		const connectedLinks = this.originalData.links.filter(
			(link) =>
				link.source === tagName ||
				(link.source.id && link.source.id === tagName) ||
				link.target === tagName ||
				(link.target.id && link.target.id === tagName)
		);

		// Get all connected tag IDs
		const connectedTagIds = new Set();
		connectedTagIds.add(tagName);
		connectedLinks.forEach((link) => {
			const sourceId =
				typeof link.source === "object" ? link.source.id : link.source;
			const targetId =
				typeof link.target === "object" ? link.target.id : link.target;

			connectedTagIds.add(sourceId === tagName ? targetId : sourceId);
		});

		// Filter nodes and links
		this.data = {
			nodes: this.originalData.nodes.filter((node) =>
				connectedTagIds.has(node.id)
			),
			links: connectedLinks,
		};

		// Re-render the graph
		this.render();
	}

	// Filter by multiple tags (useful for showing a post's tags)
	filterByMultipleTags(tagNames) {
		if (!tagNames || tagNames.length === 0) {
			this.resetFilters();
			return;
		}

		// Create a set of tag names for quick lookup
		const tagNameSet = new Set(tagNames);

		// Find all links connected to any of these tags
		const connectedLinks = this.originalData.links.filter((link) => {
			const sourceId =
				typeof link.source === "object" ? link.source.id : link.source;
			const targetId =
				typeof link.target === "object" ? link.target.id : link.target;

			return tagNameSet.has(sourceId) || tagNameSet.has(targetId);
		});

		// Get all connected tag IDs
		const connectedTagIds = new Set(tagNames);
		connectedLinks.forEach((link) => {
			const sourceId =
				typeof link.source === "object" ? link.source.id : link.source;
			const targetId =
				typeof link.target === "object" ? link.target.id : link.target;

			connectedTagIds.add(sourceId);
			connectedTagIds.add(targetId);
		});

		// Filter nodes and links
		this.data = {
			nodes: this.originalData.nodes.filter((node) =>
				connectedTagIds.has(node.id)
			),
			links: connectedLinks,
		};

		// Re-render the graph
		this.render();
	}

	// Reset to show all tags
	resetFilters() {
		this.data = JSON.parse(JSON.stringify(this.originalData));
		this.render();
	}

	// Toggle highlighting of post-specific tags
	toggleHighlighting(enabled) {
		this.highlighting = enabled;
		this.render();
	}

	addControls() {
		// Create a control panel
		const controls = document.createElement("div");
		controls.className = "tag-graph-controls";
		controls.style.position = "absolute";
		controls.style.top = "10px";
		controls.style.right = "10px";
		controls.style.background = "rgba(255, 255, 255, 0.8)";
		controls.style.padding = "5px";
		controls.style.borderRadius = "3px";
		controls.style.border = "1px solid #ddd";
		controls.style.fontSize = "12px";

		// Add a reset button
		const resetButton = document.createElement("button");
		resetButton.textContent = "Reset View";
		resetButton.onclick = () => {
			this.svg
				.transition()
				.duration(750)
				.call(this.zoom.transform, d3.zoomIdentity);
		};
		controls.appendChild(resetButton);

		// Add a search input
		const searchDiv = document.createElement("div");
		searchDiv.style.marginTop = "5px";

		const searchInput = document.createElement("input");
		searchInput.type = "text";
		searchInput.placeholder = "Search for a tag...";
		searchInput.style.width = "120px";
		searchInput.onkeyup = (e) => {
			if (e.key === "Enter") {
				this.filterByTag(searchInput.value);
			}
		};
		searchDiv.appendChild(searchInput);

		const searchButton = document.createElement("button");
		searchButton.textContent = "Filter";
		searchButton.style.marginLeft = "5px";
		searchButton.onclick = () => {
			this.filterByTag(searchInput.value);
		};
		searchDiv.appendChild(searchButton);

		controls.appendChild(searchDiv);

		// Toggle for labels
		const labelsDiv = document.createElement("div");
		labelsDiv.style.marginTop = "5px";

		const labelsCheck = document.createElement("input");
		labelsCheck.type = "checkbox";
		labelsCheck.id = "toggle-labels";
		labelsCheck.checked = this.config.showLabels;
		labelsCheck.onchange = () => {
			this.config.showLabels = labelsCheck.checked;
			this.render();
		};
		labelsDiv.appendChild(labelsCheck);

		const labelsLabel = document.createElement("label");
		labelsLabel.htmlFor = "toggle-labels";
		labelsLabel.textContent = " Show Labels";
		labelsDiv.appendChild(labelsLabel);

		controls.appendChild(labelsDiv);

		// Make the container position relative for absolute positioning of controls
		this.container.style.position = "relative";
		this.container.appendChild(controls);
	}
}
