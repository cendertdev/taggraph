/**
 * Responsive Tag Graph - Enhanced for mobile and desktop optimization
 *
 * This extends the base TagGraph class with responsive features
 * to ensure optimal visualization across different screen sizes.
 */

class ResponsiveTagGraph extends TagGraph {
	constructor(containerId, options = {}) {
		// Set default responsive options
		const responsiveDefaults = {
			// Mobile-optimized settings (applied when width < 768px)
			mobile: {
				minNodeSize: 4,
				maxNodeSize: 12,
				fontSize: 9,
				showLabels: false,
				labelVisibilityThreshold: 12, // Only show labels for nodes larger than this
				linkOpacity: 0.4,
				nodeBorderWidth: 1,
				chargeStrength: -150, // Less repulsion for denser layout
			},

			// Tablet settings (applied when 768px <= width < 1024px)
			tablet: {
				minNodeSize: 5,
				maxNodeSize: 16,
				fontSize: 10,
				showLabels: true,
				labelVisibilityThreshold: 8,
				linkOpacity: 0.5,
				nodeBorderWidth: 1.2,
				chargeStrength: -200,
			},

			// Desktop settings (applied when width >= 1024px)
			desktop: {
				minNodeSize: 6,
				maxNodeSize: 20,
				fontSize: 12,
				showLabels: true,
				labelVisibilityThreshold: 6,
				linkOpacity: 0.6,
				nodeBorderWidth: 1.5,
				chargeStrength: -300,
			},

			// Enable responsive adjustments
			responsive: true,

			// Determines if touch optimizations should be applied
			touchOptimized: "auto", // 'auto', true, or false
		};

		// Merge with user options
		const mergedOptions = {
			...responsiveDefaults,
			...options,
			mobile: { ...responsiveDefaults.mobile, ...(options.mobile || {}) },
			tablet: { ...responsiveDefaults.tablet, ...(options.tablet || {}) },
			desktop: { ...responsiveDefaults.desktop, ...(options.desktop || {}) },
		};

		// Initialize the base TagGraph
		super(containerId, mergedOptions);

		// Store responsive settings
		this.responsiveSettings = {
			mobile: mergedOptions.mobile,
			tablet: mergedOptions.tablet,
			desktop: mergedOptions.desktop,
		};

		// Detect touch capability
		this.isTouchDevice =
			mergedOptions.touchOptimized === true ||
			(mergedOptions.touchOptimized === "auto" && this.detectTouchDevice());

		// Initialize responsive behavior
		if (mergedOptions.responsive) {
			this.setupResponsiveBehavior();

			// Apply initial responsive settings
			this.applyResponsiveSettings();

			// Re-render with these settings
			this.render();
		}
	}

	/**
	 * Detect if the device supports touch
	 */
	detectTouchDevice() {
		return (
			"ontouchstart" in window ||
			navigator.maxTouchPoints > 0 ||
			navigator.msMaxTouchPoints > 0
		);
	}

	/**
	 * Set up event listeners for responsive behavior
	 */
	setupResponsiveBehavior() {
		// Add resize listener
		window.addEventListener("resize", this.debouncedResize.bind(this));

		// Add orientation change listener for mobile
		window.addEventListener(
			"orientationchange",
			this.debouncedResize.bind(this)
		);

		// Add visibility change handler (for when tab becomes active again)
		document.addEventListener("visibilitychange", () => {
			if (document.visibilityState === "visible") {
				this.debouncedResize();
			}
		});
	}

	/**
	 * Debounced resize handler to avoid excessive recalculation
	 */
	debouncedResize() {
		// Clear any existing timeout
		if (this.resizeTimer) {
			clearTimeout(this.resizeTimer);
		}

		// Set a new timeout
		this.resizeTimer = setTimeout(() => {
			this.handleResize();
		}, 300);
	}

	/**
	 * Handle window resize events
	 */
	handleResize() {
		// Only proceed if the container exists
		if (!this.container) return;

		// Get new container dimensions
		const newWidth = this.container.clientWidth;
		const newHeight = this.container.clientHeight;

		// Check if dimensions have actually changed
		if (newWidth !== this.config.width || newHeight !== this.config.height) {
			// Update dimensions
			this.config.width = newWidth;
			this.config.height = newHeight;

			// Update SVG dimensions
			this.svg
				.attr("width", this.config.width)
				.attr("height", this.config.height)
				.attr("viewBox", [0, 0, this.config.width, this.config.height]);

			// Update simulation
			if (this.simulation) {
				this.simulation.force(
					"center",
					d3.forceCenter(this.config.width / 2, this.config.height / 2)
				);
				this.simulation.alpha(0.3).restart();
			}

			// Apply responsive settings based on new width
			this.applyResponsiveSettings();

			// Re-render the graph
			this.render();
		}
	}

	/**
	 * Apply settings based on current screen size
	 */
	applyResponsiveSettings() {
		let settings;
		const width = this.container.clientWidth;

		// Determine which settings to apply based on width
		if (width < 768) {
			settings = this.responsiveSettings.mobile;
		} else if (width < 1024) {
			settings = this.responsiveSettings.tablet;
		} else {
			settings = this.responsiveSettings.desktop;
		}

		// Apply the settings
		Object.assign(this.config, settings);

		// Apply touch optimizations if needed
		if (this.isTouchDevice) {
			this.applyTouchOptimizations();
		}

		return settings;
	}

	/**
	 * Apply touch-specific optimizations
	 */
	applyTouchOptimizations() {
		// Ensure node sizes are large enough for touch targets
		this.config.minNodeSize = Math.max(this.config.minNodeSize, 8);

		// Increase clickable area for nodes
		if (this.nodes) {
			this.nodes.each(function (d) {
				const node = d3.select(this);

				// Add invisible larger circle for better touch target if not already there
				if (!node.select(".touch-target").size()) {
					node
						.append("circle")
						.attr("class", "touch-target")
						.attr("r", (d) => Math.max(12, d.r * 1.5))
						.attr("fill", "transparent")
						.attr("stroke", "transparent")
						.style("pointer-events", "all");
				}
			});
		}
	}

	/**
	 * Enhanced rendering function with responsive considerations
	 */
	render() {
		// First call the parent render method
		super.render();

		// Check if we need custom label visibility
		if (this.config.labelVisibilityThreshold > 0) {
			this.optimizeLabels();
		}

		// If touch device, ensure touch targets are added
		if (this.isTouchDevice) {
			this.applyTouchOptimizations();
		}

		// Optimize animations for performance on mobile
		if (this.container.clientWidth < 768) {
			// Use simpler animation by reducing iterations
			if (this.simulation && !this.config.animate) {
				// Run fewer iterations when generating static layouts on mobile
				for (let i = 0; i < 100; i++) {
					// Reduced from 300
					this.simulation.tick();
				}
				this.simulation.stop();
				this.updatePositions();
			}
		}
	}

	/**
	 * Optimize label visibility based on node size
	 */
	optimizeLabels() {
		if (!this.nodes) return;

		this.nodes.selectAll("text").style("display", (d) => {
			// Only show labels for nodes larger than the threshold
			return this.nodeScale(d.count) >= this.config.labelVisibilityThreshold
				? "block"
				: "none";
		});
	}

	/**
	 * Enhanced create controls method for better mobile experience
	 */
	addControls() {
		// Create basic controls from parent method
		super.addControls();

		// Get the controls container
		const controls = this.container.querySelector(".tag-graph-controls");
		if (!controls) return;

		// For mobile, add a collapsible control panel
		if (this.container.clientWidth < 768) {
			// Add a toggle button
			const toggleButton = document.createElement("button");
			toggleButton.className = "controls-toggle";
			toggleButton.innerHTML = "⚙️";
			toggleButton.style.position = "absolute";
			toggleButton.style.top = "5px";
			toggleButton.style.right = "5px";
			toggleButton.style.zIndex = "110";
			toggleButton.style.width = "36px";
			toggleButton.style.height = "36px";
			toggleButton.style.borderRadius = "50%";

			// Hide the main controls by default on mobile
			controls.style.display = "none";

			// Add the toggle button to the container
			this.container.appendChild(toggleButton);

			// Add toggle functionality
			toggleButton.addEventListener("click", () => {
				const isVisible = controls.style.display !== "none";
				controls.style.display = isVisible ? "none" : "block";
				toggleButton.innerHTML = isVisible ? "⚙️" : "✕";
			});

			// Close controls when clicking outside
			document.addEventListener("click", (event) => {
				if (
					!controls.contains(event.target) &&
					event.target !== toggleButton &&
					controls.style.display !== "none"
				) {
					controls.style.display = "none";
					toggleButton.innerHTML = "⚙️";
				}
			});
		}
	}

	/**
	 * Create a custom tooltip for better mobile experience
	 */
	createTooltip() {
		// Remove any existing tooltip
		const existingTooltip = document.querySelector(".tag-tooltip");
		if (existingTooltip) {
			existingTooltip.remove();
		}

		// Create tooltip element
		const tooltip = document.createElement("div");
		tooltip.className = "tag-tooltip";
		tooltip.style.display = "none";
		document.body.appendChild(tooltip);

		// Store tooltip reference
		this.tooltip = tooltip;

		// For mobile, use tap events instead of hover
		if (this.isTouchDevice) {
			// Remove any title attributes to prevent native tooltips
			if (this.nodes) {
				this.nodes.select("title").remove();

				// Add tap handler
				this.nodes.on("click", (event, d) => {
					event.stopPropagation();

					// Get node position relative to viewport
					const rect = this.container.getBoundingClientRect();
					const nodeX = d.x + rect.left;
					const nodeY = d.y + rect.top;

					// Position and show tooltip
					tooltip.innerHTML = `${d.name}${
						d.isCurrentPostTag ? " (Current Post)" : ""
					}: ${d.count} posts`;
					tooltip.style.display = "block";
					tooltip.style.left = `${nodeX}px`;
					tooltip.style.top = `${nodeY - 40}px`;

					// Hide tooltip after delay or on the next tap
					setTimeout(() => {
						tooltip.style.display = "none";
					}, 3000);

					document.addEventListener("click", function hideTooltip() {
						tooltip.style.display = "none";
						document.removeEventListener("click", hideTooltip);
					});
				});
			}
		} else {
			// For desktop, use hover
			if (this.nodes) {
				// Remove any title attributes to prevent native tooltips
				this.nodes.select("title").remove();

				// Add hover handlers
				this.nodes
					.on("mouseover", (event, d) => {
						// Get node position relative to viewport
						const rect = this.container.getBoundingClientRect();
						const nodeX = d.x + rect.left;
						const nodeY = d.y + rect.top;

						// Position and show tooltip
						tooltip.innerHTML = `${d.name}${
							d.isCurrentPostTag ? " (Current Post)" : ""
						}: ${d.count} posts`;
						tooltip.style.display = "block";
						tooltip.style.left = `${nodeX}px`;
						tooltip.style.top = `${nodeY - 40}px`;
					})
					.on("mouseout", () => {
						tooltip.style.display = "none";
					});
			}
		}
	}

	/**
	 * Add screen size indicator for debugging
	 * (can be removed in production)
	 */
	addScreenSizeIndicator() {
		const indicator = document.createElement("div");
		indicator.className = "screen-size-indicator";
		indicator.style.position = "absolute";
		indicator.style.bottom = "5px";
		indicator.style.left = "5px";
		indicator.style.fontSize = "10px";
		indicator.style.padding = "2px 5px";
		indicator.style.backgroundColor = "rgba(0,0,0,0.5)";
		indicator.style.color = "white";
		indicator.style.borderRadius = "3px";
		indicator.style.zIndex = "100";

		const updateIndicator = () => {
			const width = this.container.clientWidth;
			let size = "Desktop";
			if (width < 768) size = "Mobile";
			else if (width < 1024) size = "Tablet";
			indicator.textContent = `${size} (${width}px)`;
		};

		updateIndicator();
		window.addEventListener("resize", updateIndicator);

		this.container.appendChild(indicator);
	}

	/**
	 * Create a more mobile-friendly drag behavior
	 */
	createDragBehavior() {
		// For touch devices, adjust drag behavior
		if (this.isTouchDevice) {
			return d3
				.drag()
				.on("start", (event, d) => {
					// Prevent page scrolling when dragging nodes
					event.sourceEvent.preventDefault();

					if (!event.active) this.simulation.alphaTarget(0.3).restart();
					d.fx = d.x;
					d.fy = d.y;
				})
				.on("drag", (event, d) => {
					// Move the node with touch
					d.fx = event.x;
					d.fy = event.y;
				})
				.on("end", (event, d) => {
					if (!event.active) this.simulation.alphaTarget(0);

					// For better touch experience, keep nodes fixed where they were dragged
					// This creates a more stable visualization on mobile
					// Uncomment the lines below to allow nodes to float again after dragging
					// d.fx = null;
					// d.fy = null;
				});
		} else {
			// Use default behavior for mouse devices
			return super.createDragBehavior();
		}
	}

	/**
	 * Create a responsive loading indicator
	 */
	showLoading() {
		// Create loading container
		const loadingContainer = document.createElement("div");
		loadingContainer.className = "tag-graph-loading";

		// Add spinner
		const spinner = document.createElement("div");
		spinner.className = "tag-graph-loader";
		loadingContainer.appendChild(spinner);

		// Add text
		const text = document.createElement("div");
		text.textContent = "Loading tag visualization...";
		loadingContainer.appendChild(text);

		// Add to container
		this.container.appendChild(loadingContainer);

		return loadingContainer;
	}

	/**
	 * Hide loading indicator
	 */
	hideLoading(loadingElement) {
		if (loadingElement && loadingElement.parentNode) {
			loadingElement.parentNode.removeChild(loadingElement);
		}
	}

	/**
	 * Optimize graph for current device
	 */
	optimizeForDevice() {
		const width = this.container.clientWidth;

		// For very small screens (like phones in portrait mode)
		if (width < 400) {
			// Simplify the graph by limiting number of nodes
			this.config.maxNodeCount = 25; // Only show top 25 tags

			// Reduce simulation complexity
			if (this.simulation) {
				this.simulation.force("charge", d3.forceManyBody().strength(-100));
				this.simulation.force(
					"collide",
					d3.forceCollide().radius((d) => this.nodeScale(d.count) + 5)
				);
			}
		}

		// For medium screens (tablets or phones in landscape)
		else if (width < 768) {
			this.config.maxNodeCount = 50; // Show top 50 tags

			// Adjust forces for medium screens
			if (this.simulation) {
				this.simulation.force("charge", d3.forceManyBody().strength(-150));
				this.simulation.force(
					"collide",
					d3.forceCollide().radius((d) => this.nodeScale(d.count) + 8)
				);
			}
		}

		// For larger screens
		else {
			// Use full node set and more complex simulation
			this.config.maxNodeCount = 0; // No limit

			// Restore default forces
			if (this.simulation) {
				this.simulation.force(
					"charge",
					d3.forceManyBody().strength(this.config.chargeStrength)
				);
				this.simulation.force(
					"collide",
					d3.forceCollide().radius((d) => this.nodeScale(d.count) + 10)
				);
			}
		}

		// Apply node count limit if needed
		if (
			this.config.maxNodeCount > 0 &&
			this.originalData.nodes.length > this.config.maxNodeCount
		) {
			// Sort nodes by count
			const sortedNodes = [...this.originalData.nodes].sort(
				(a, b) => b.count - a.count
			);

			// Take top N nodes
			const topNodes = sortedNodes.slice(0, this.config.maxNodeCount);

			// Create a set of node IDs for quick lookup
			const topNodeIds = new Set(topNodes.map((n) => n.id));

			// Filter links to only include top nodes
			const filteredLinks = this.originalData.links.filter((link) => {
				const sourceId =
					typeof link.source === "object" ? link.source.id : link.source;
				const targetId =
					typeof link.target === "object" ? link.target.id : link.target;
				return topNodeIds.has(sourceId) && topNodeIds.has(targetId);
			});

			// Update data
			this.data = {
				nodes: topNodes,
				links: filteredLinks,
			};
		}
	}
}

// Initialize the responsive tag graph when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
	// Check if we have a tag graph container
	const container = document.getElementById("tag-graph-container");
	if (container && window.tagGraphData) {
		const tagGraph = new ResponsiveTagGraph("tag-graph-container", {
			// Default options
			responsive: true,
			touchOptimized: "auto",
		});

		// Store reference to the instance to allow external access
		container.__tagGraph = tagGraph;
	}

	// Also check for any shortcode instances
	document
		.querySelectorAll(".tag-graph-shortcode")
		.forEach(function (element, index) {
			const id = "tag-graph-" + index;
			element.id = id;

			// Get options from data attributes
			const style = element.getAttribute("data-style") || "force";

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
		});

	// Check for post-specific tag graphs
	document
		.querySelectorAll(".post-tag-graph")
		.forEach(function (element, index) {
			if (
				element.id === "post-tag-graph-container" &&
				window.postTagGraphData
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
