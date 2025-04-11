# Hugo Tag Graph Module

A Hugo module that visualizes relationships between tags in your blog posts as an interactive nodes-and-edges graph.

![Hugo Tag Graph Demo](https://via.placeholder.com/800x400.png?text=Hugo+Tag+Graph+Visualization)

## Features

- **Interactive Visualization**: Force-directed graph showing relationships between tags
- **Customizable Appearance**: Change colors, sizes, and styles to match your site theme
- **Performance Optimized**: Pre-processing option for large sites
- **Flexible Integration**: Use as a partial in templates or as a shortcode in content
- **Filtering Capabilities**: Focus on specific tags and their relationships
- **Responsive Design**: Works on mobile and desktop screens
- **Search & Zoom**: Interactive controls for better exploration

## Installation

### As a Hugo Module (Recommended)

1. Initialize your Hugo site as a module (if not already done):

```bash
hugo mod init github.com/yourusername/your-site-name
```

2. Add this module to your site's configuration:

```yaml
# In config.yaml
module:
  imports:
    - path: github.com/cendertdev/taggraph
```

3. Update your modules:

```bash
hugo mod get -u
```

### Manual Installation

If you prefer not to use Hugo Modules:

1. Download or clone this repository
2. Copy the contents to your Hugo site, maintaining the directory structure

## Quick Start

### Basic Usage

Add the tag graph to any template by including the partial:

```html
{{ partial "taggraph.html" . }}
```

Or use the shortcode in your content:

```markdown
{{< tag-graph >}}
```

### Configuration

Add these settings to your `config.yaml` or `config.toml`:

```yaml
params:
  tagGraph:
    width: "800px"
    height: "600px"
    minNodeSize: 5
    maxNodeSize: 20
    # See config-example.yaml for all options
```

## Advanced Usage

### Filtering by Tag

On tag pages, you can automatically filter the graph to show only the current tag and related tags:

```html
<!-- layouts/taxonomy/tag.html -->
{{ partial "taggraph.html" . }}

<script>
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
      const tagGraph = document.querySelector('#tag-graph-container').__tagGraph;
      if (tagGraph) {
        tagGraph.filterByTag("{{ .Title }}");
      }
    }, 500);
  });
</script>
```

With shortcodes, use the `filter` parameter:

```markdown
{{< tag-graph filter="javascript" >}}
```

### Pre-processing Tag Data

For sites with many tags and posts, pre-processing can improve performance:

1. Include the processor partial in a template that runs once per build:

```html
<!-- layouts/index.html -->
{{ partial "taggraph-processor.html" . }}
```

2. Enable pre-processed data usage in your config:

```yaml
params:
  tagGraph:
    usePreprocessedData: true
```

### Customizing with CSS

Add custom styles to override the defaults:

```css
.tag-graph {
  background-color: #f0f8ff;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.tag-graph-controls button {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
}
```

## Examples

### Tags Page Integration

```html
<!-- layouts/taxonomy/tag.html -->
{{ define "main" }}
  <h1>{{ .Title }}</h1>
  
  <div class="tag-connections">
    <h2>Related Tags</h2>
    {{ partial "tag-graph.html" . }}
  </div>
  
  <div class="tag-posts">
    <h2>Articles Tagged "{{ .Title }}"</h2>
    <ul>
      {{ range .Pages }}
        <li><a href="{{ .Permalink }}">{{ .Title }}</a></li>
      {{ end }}
    </ul>
  </div>
{{ end }}
```

### Homepage Tag Overview

```html
<!-- layouts/index.html -->
<section class="tag-overview">
  <h2>Topics on This Blog</h2>
  <p>Explore the connections between topics covered in my articles:</p>
  
  {{ partial "taggraph.html" . }}
  
  <p class="tag-info">
    Larger nodes indicate more frequent topics. 
    Connected nodes appear together in the same posts.
  </p>
</section>
```

## How It Works

This module works by:

1. **Extracting tag data** from your site's content
2. **Building a relationship graph** where:
   - Each tag is a node
   - Tags that appear together are connected by edges
   - Node size reflects how frequently a tag is used
   - Edge strength shows how often tags appear together
3. **Rendering this data** using D3.js force-directed graph visualization

## Browser Support

- **Modern browsers**: Full support (Chrome, Firefox, Safari, Edge)
- **IE11**: Basic support (without animations)
- **Mobile**: Touch-optimized for mobile devices

### Browser Requirements
- Requires a modern browser with JavaScript enabled
- Interactive features may be limited on older browsers
- Mobile devices may have reduced performance with large graphs

## Dependencies

- [D3.js](https://d3js.org/) (v7) - For the graph visualization

## Performance Considerations

### Tag Count Limitations
- The visualization works best with 5-100 tags
- Very large sites with 200+ tags may experience performance issues
- Use the `maxNodesShown` config option to limit displayed tags
- Set `minTagCount` to only show tags that appear multiple times

# Using Post-Specific Tag Graphs in Hugo

This document provides examples for implementing post-specific tag graphs in your Hugo site.

## Integration Options

### 1. In Single Post Templates

Add this to your `layouts/_default/single.html` template:

```html
<div class="post-tags-section">
  <h3>Related Topics</h3>
  <p class="tag-explanation">This visualization shows how this post's tags (highlighted in orange) 
     relate to other topics on this site.</p>
  
  {{ partial "post-tag-graph.html" . }}
  
  <div class="post-tags-list">
    <h4>Tags in this post:</h4>
    <ul>
      {{ range .Params.tags }}
        <li><a href="{{ "/tags/" | relLangURL }}{{ . | urlize }}">{{ . }}</a></li>
      {{ end }}
    </ul>
  </div>
</div>
```

### 2. In Post Footers

Add to your post footer partial (`layouts/partials/post-footer.html` or similar):

```html
{{ if .Params.tags }}
  <div class="post-footer-tags">
    <h4>Explore Related Topics</h4>
    {{ partial "post-tag-graph.html" . }}
  </div>
{{ end }}
```

### 3. Custom Shortcode for Selective Use

Create a shortcode in `layouts/shortcodes/post-tag-graph.html`:

```html
{{ $width := .Get "width" | default "800px" }}
{{ $height := .Get "height" | default "400px" }}

<div class="custom-tag-graph" style="width: {{ $width }}; height: {{ $height }};">
  {{ partial "post-tag-graph.html" .Page }}
  
  <div class="graph-legend">
    <div class="legend-item">
      <span class="color-box" style="background-color: #ff7f0e;"></span>
      <span>Tags in this post</span>
    </div>
    <div class="legend-item">
      <span class="color-box" style="background-color: #1f77b4;"></span>
      <span>Related tags</span>
    </div>
  </div>
</div>
```

Then use in content:

```markdown
## Related Topics

This post connects several themes that appear throughout this blog:

{{< post-tag-graph width="700px" height="350px" >}}

As you can see, these topics connect to many other areas I write about.
```

## Configuration Options

Add these settings to your site configuration to customize the post-specific tag graph:

```yaml
params:
  tagGraph:
    # Post-specific tag graph settings
    postGraph:
      enabled: true
      height: "400px"
      width: "100%"
      showOnAllPosts: true
      minPostTags: 2  # Only show on posts with at least this many tags
      highlightColor: "#ff7f0e"
      normalColor: "#1f77b4"
      showInSidebar: false
      sidebarWidth: "300px"
      sidebarHeight: "200px"
```

## Advanced Usage

### 1. Tag Page with Both Global and Post-Specific Views

For a tag page that shows both the entire tag network and the specific tag's connections:

```html
<!-- layouts/taxonomy/tag.html -->
{{ define "main" }}
  <h1>{{ .Title }}</h1>
  
  <div class="tag-visualizations">
    <div class="global-tag-view">
      <h2>All Site Tags</h2>
      <p>Complete network of topics on this site. The selected tag "{{ .Title }}" is highlighted.</p>
      {{ partial "tag-graph.html" . }}
      
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          setTimeout(function() {
            const tagGraph = document.querySelector('#tag-graph-container').__tagGraph;
            if (tagGraph) {
              // Highlight but don't filter
              tagGraph.highlightTag("{{ .Title }}");
            }
          }, 500);
        });
      </script>
    </div>
    
    <div class="focused-tag-view">
      <h2>Tag Relationships for "{{ .Title }}"</h2>
      <p>This view shows only topics directly connected to "{{ .Title }}".</p>
      {{ partial "tag-graph.html" . }}
      
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          setTimeout(function() {
            const tagGraph = document.querySelectorAll('#tag-graph-container')[1].__tagGraph;
            if (tagGraph) {
              // Filter to show only related tags
              tagGraph.filterByTag("{{ .Title }}");
            }
          }, 500);
        });
      </script>
    </div>
  </div>
  
  <div class="tag-posts">
    <h2>Posts tagged with "{{ .Title }}"</h2>
    <ul>
      {{ range .Pages }}
        <li>
          <a href="{{ .Permalink }}">{{ .Title }}</a>
          <span class="post-date">{{ .Date.Format "January 2, 2006" }}</span>
          
          {{/* Optional: Mini post-specific graph for each post */}}
          {{ if gt (len .Params.tags) 1 }}
            <div class="mini-tag-graph" data-post-tags="{{ delimit .Params.tags "," }}">
              <h4>Tag connections for this post:</h4>
              {{ partial "post-tag-graph.html" . }}
            </div>
          {{ end }}
        </li>
      {{ end }}
    </ul>
  </div>
{{ end }}
```

### 2. Sidebar Widget for Related Tags

Create a sidebar partial for showing related tags:

```html
<!-- layouts/partials/sidebar-tag-widget.html -->
{{ if .Params.tags }}
  <div class="sidebar-widget tag-connections-widget">
    <h3>Related Topics</h3>
    
    <div class="mini-tag-graph" style="width: 100%; height: 200px;">
      {{ partial "post-tag-graph.html" . }}
    </div>
    
    <div class="more-tags">
      <button id="explore-tags-btn">Explore All Topics</button>
      <div id="full-tag-modal" class="tag-modal" style="display: none;">
        <div class="modal-content">
          <span class="close-modal">&times;</span>
          <h2>Topic Explorer</h2>
          
          <div class="full-tag-graph-container" style="width: 100%; height: 500px;">
            {{ partial "tag-graph.html" . }}
          </div>
          
          <div class="tag-list-container">
            <h3>All Topics</h3>
            <ul class="all-tags-list">
              {{ range $name, $taxonomy := .Site.Taxonomies.tags }}
                <li>
                  <a href="{{ "/tags/" | relLangURL }}{{ $name | urlize }}">
                    {{ $name }} ({{ len $taxonomy.Pages }})
                  </a>
                </li>
              {{ end }}
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
{{ end }}

<script>
  document.addEventListener('DOMContentLoaded', function() {
    const exploreBtn = document.getElementById('explore-tags-btn');
    const modal = document.getElementById('full-tag-modal');
    const closeBtn = modal.querySelector('.close-modal');
    
    if (exploreBtn && modal) {
      exploreBtn.onclick = function() {
        modal.style.display = 'block';
      }
      
      closeBtn.onclick = function() {
        modal.style.display = 'none';
      }
      
      window.onclick = function(event) {
        if (event.target == modal) {
          modal.style.display = 'none';
        }
      }
    }
  });
</script>
```

### 3. Implementing Tag Graph in a Post Series

For blog posts that are part of a series, you can create a special visualization that shows how the series topics connect:

```html
<!-- layouts/partials/series-tag-graph.html -->
{{ $series := .Params.series | default "" }}

{{ if $series }}
  <div class="series-tag-visualization">
    <h3>Topics in the "{{ $series }}" Series</h3>
    
    <div id="series-tag-graph-container" class="tag-graph series-tag-graph"
         style="width: 100%; height: 400px;"
         data-series="{{ $series }}">
    </div>
    
    <script>
      // This will hold our series tag data for the visualization
      const seriesTagGraphData = {
        nodes: [],
        links: []
      };
      
      // Current post's tags for highlighting
      const currentPostTags = {{ .Params.tags | jsonify }};
      
      // Process only posts from this series
      {{ range (where .Site.RegularPages "Params.series" $series) }}
        {{ $pageTags := .Params.tags }}
        {{ $isCurrentPage := eq $.Page.Permalink .Permalink }}
        
        {{ with $pageTags }}
          {{ range . }}
            // Add tag as node if it doesn't exist
            if (!seriesTagGraphData.nodes.some(node => node.id === "{{ . }}")) {
              // Check if this tag is in the current post
              const isCurrentPostTag = currentPostTags.includes("{{ . }}");
              
              seriesTagGraphData.nodes.push({
                id: "{{ . }}",
                name: "{{ . }}",
                count: 1,
                isCurrentPostTag: isCurrentPostTag,
                isCurrentPage: {{ $isCurrentPage }}
              });
            } else {
              // Increment count for existing tag
              const existingNode = seriesTagGraphData.nodes.find(node => node.id === "{{ . }}");
              existingNode.count += 1;
              // Update if it's part of current post
              if ({{ $isCurrentPage }}) {
                existingNode.isCurrentPostTag = true;
                existingNode.isCurrentPage = true;
              }
            }
            
            // Create links between co-occurring tags in this series
            {{ range $pageTags }}
              {{ $targetTag := . }}
              {{ range $pageTags }}
                {{ if ne . $targetTag }}
                  // Add link between tags if they appear on the same page
                  const linkId = ["{{ $targetTag }}", "{{ . }}"].sort().join("-");
                  
                  // Check if both tags are from current post
                  const isCurrentPostLink = {{ $isCurrentPage }} && 
                                            currentPostTags.includes("{{ $targetTag }}") && 
                                            currentPostTags.includes("{{ . }}");
                  
                  if (!seriesTagGraphData.links.some(link => link.id === linkId)) {
                    seriesTagGraphData.links.push({
                      id: linkId,
                      source: "{{ $targetTag }}",
                      target: "{{ . }}",
                      value: 1,
                      isCurrentPostLink: isCurrentPostLink,
                      isCurrentPage: {{ $isCurrentPage }}
                    });
                  } else {
                    // Increment weight of existing link
                    const existingLink = seriesTagGraphData.links.find(link => link.id === linkId);
                    existingLink.value += 1;
                    // Update if it's part of current post
                    if ({{ $isCurrentPage }}) {
                      existingLink.isCurrentPostLink = true;
                      existingLink.isCurrentPage = true;
                    }
                  }
                {{ end }}
              {{ end }}
            {{ end }}
          {{ end }}
        {{ end }}
      {{ end }}
      
      // Store the series-specific tag data
      window.seriesTagGraphData = seriesTagGraphData;
      
      // Initialize the series tag graph when the DOM is fully loaded
      document.addEventListener('DOMContentLoaded', function() {
        // Check if we have a series tag graph container
        const container = document.getElementById('series-tag-graph-container');
        if (container && window.seriesTagGraphData) {
          const tagGraph = new TagGraph('series-tag-graph-container', {
            // Use the series-specific data
            data: window.seriesTagGraphData,
            // Highlight current post's tags with different colors
            highlightCurrentPostTags: true,
            // Custom node color function to show progression through series
            nodeColorFn: (d) => {
              if (d.isCurrentPage) return "#ff7f0e"; // Current post
              if (d.isCurrentPostTag) return "#ffbb78"; // Current post's tag
              return "#1f77b4"; // Regular tag
            },
            // Custom link color function
            linkColorFn: (d) => d.isCurrentPostLink ? "#ff7f0e" : "#999",
            // Series context
            isSeriesContext: true
          });
          
          // Add series navigation controls
          addSeriesControls(container, "{{ $series }}");
        }
      });
      
      function addSeriesControls(container, seriesName) {
        // Create a series navigation panel
        const seriesNav = document.createElement("div");
        seriesNav.className = "series-tag-controls";
        seriesNav.style.marginTop = "10px";
        seriesNav.style.textAlign = "center";
        
        const seriesTitle = document.createElement("h4");
        seriesTitle.textContent = "Posts in this series:";
        seriesNav.appendChild(seriesTitle);
        
        const seriesList = document.createElement("ul");
        seriesList.className = "series-post-list";
        
        // Add links to all posts in the series
        {{ range (where .Site.RegularPages "Params.series" $series) }}
          {{ $isCurrent := eq $.Page.Permalink .Permalink }}
          const listItem = document.createElement("li");
          
          {{ if $isCurrent }}
            listItem.className = "current-series-post";
            listItem.innerHTML = '<strong>{{ .Title }}</strong> <span class="current-indicator">(current)</span>';
          {{ else }}
            const link = document.createElement("a");
            link.href = "{{ .Permalink }}";
            link.textContent = "{{ .Title }}";
            listItem.appendChild(link);
          {{ end }}
          
          seriesList.appendChild(listItem);
        {{ end }}
        
        seriesNav.appendChild(seriesList);
        
        // Add navigation after the graph
        container.parentNode.appendChild(seriesNav);
      }
    </script>
  </div>
{{ end }}
```

## Styling Examples

Add these CSS styles to make your tag graphs more attractive:

```css
/* Basic tag graph styling */
.tag-graph {
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  margin: 1.5rem 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

/* Post-specific tag highlighting */
.post-tag-graph circle {
  transition: all 0.3s ease;
}

.post-tag-graph .current-post-tag circle {
  stroke: #ff7f0e;
  stroke-width: 2px;
}

/* Tag controls styling */
.post-tag-graph-controls button {
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.post-tag-graph-controls button:hover {
  background-color: #e0e0e0;
}

/* Graph legend */
.graph-legend {
  display: flex;
  justify-content: center;
  margin-top: 10px;
  font-size: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin: 0 10px;
}

.color-box {
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-right: 5px;
  border-radius: 2px;
}

/* Modal for full tag exploration */
.tag-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.7);
  z-index: 1000;
}

.modal-content {
  background-color: white;
  margin: 5% auto;
  padding: 20px;
  width: 90%;
  max-width: 1000px;
  border-radius: 8px;
  max-height: 85vh;
  overflow-y: auto;
}

.close-modal {
  float: right;
  font-size: 28px;
  font-weight: bold;
  cursor: pointer;
}

/* Series tag visualization */
.series-tag-visualization {
  margin: 2rem 0;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.series-post-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.series-post-list li {
  padding: 5px 10px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.series-post-list .current-series-post {
  background-color: #fff3e0;
  border-left: 3px solid #ff7f0e;
}

.current-indicator {
  font-size: 0.85em;
  color: #ff7f0e;
  font-style: italic;
}
```

## Integration with Popular Hugo Themes

### For Hugo Theme PaperMod:

Add to `layouts/partials/extend_head.html`:

```html
{{ if (.Params.tags) }}
  {{ $css := resources.Get "css/tag-graph.css" }}
  <link rel="stylesheet" href="{{ $css.RelPermalink }}">
{{ end }}
```

Add to `layouts/partials/extend_footer.html`:

```html
{{ if and (.Params.tags) (gt (len .Params.tags) 0) }}
  {{ $d3js := resources.Get "js/d3.v7.min.js" | resources.Fingerprint }}
  <script src="{{ $d3js.RelPermalink }}"></script>
  
  {{ $tagGraphJs := resources.Get "js/tag-graph.js" | resources.Fingerprint }}
  <script src="{{ $tagGraphJs.RelPermalink }}"></script>
  
  {{ if .IsPage }}
    {{ partial "post-tag-graph.html" . }}
  {{ end }}
{{ end }}
```

### For Hugo Theme Mainroad:

Add to `layouts/partials/widgets/tagcloud.html`:

```html
<div class="widget-taglist widget">
  <h4 class="widget__title">Tags Graph</h4>
  <div class="widget__content">
    <div id="sidebar-tag-graph" class="tag-graph sidebar-tag-graph" 
         style="width: 100%; height: 200px;">
    </div>
    {{ partial "tag-graph.html" . }}
  </div>
</div>
```

# Post-Specific Tag Graph Implementation Guide

This guide explains how to enhance the tag graph module to display relationships between a post's specific tags and the rest of your site's tag structure.

## Table of Contents

1. [Overview](#overview)
2. [Implementation Steps](#implementation-steps)
3. [Customization Options](#customization-options)
4. [Practical Applications](#practical-applications)
5. [Performance Considerations](#performance-considerations)
6. [Advanced Usage](#advanced-usage)

## Overview

The post-specific tag graph feature enhances the base tag graph module by:

1. **Highlighting the current post's tags** in the visualization
2. **Showing relationships** between the post's specific tags and other tags
3. **Providing filtering options** to focus on the most relevant connections
4. **Helping readers discover related content** based on tag connections

This creates a more personalized and contextually relevant tag visualization for each post.

## Implementation Steps

### 1. Create the Post-Specific Partial

First, create a new partial template for post-specific contexts:

```bash
mkdir -p layouts/partials
touch layouts/partials/post-tag-graph.html
```

Add the implementation code to this file (see the `post-specific-graph.html` artifact).

### 2. Update the JavaScript

Enhance the tag graph JavaScript to handle post-specific features:

```bash
mkdir -p assets/js
touch assets/js/tag-graph.js
```

Add the enhanced implementation code (see the `tag-graph-enhanced.js` artifact).

### 3. Include the Partial in Templates

Add the post-specific graph to your single post template:

```html
<!-- layouts/_default/single.html -->
<article class="post">
  <h1>{{ .Title }}</h1>
  <div class="content">
    {{ .Content }}
  </div>
  
  {{ if .Params.tags }}
    <div class="post-tags-section">
      <h3>Tag Connections</h3>
      {{ partial "post-tag-graph.html" . }}
    </div>
  {{ end }}
</article>
```

### 4. Add Supporting CSS

Create styles for the post-specific graph:

```css
/* assets/css/tag-graph.css */

/* Post-specific tag graph styling */
.post-tag-graph {
  margin-top: 2rem;
  margin-bottom: 2rem;
}

/* Highlight current post's tags */
.post-tag-graph .current-post-tag circle {
  stroke: #ff7f0e;
  stroke-width: 2px;
}

/* Controls for post tag graph */
.post-tag-graph-controls {
  padding: 8px;
  border-radius: 4px;
}

.post-tag-graph-controls button {
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 3px;
  padding: 3px 8px;
  font-size: 12px;
  cursor: pointer;
}

.post-tag-graph-controls button:hover {
  background-color: #e5e5e5;
}
```

## Customization Options

### Tag Highlighting Colors

You can customize the colors used for highlighting in the post-specific context:

```javascript
// In your enhanced tag-graph.js
getNodeColor(d, i) {
  // Highlight post-specific tags
  if (this.highlighting && d.isCurrentPostTag) {
    return "#ff7f0e"; // Change to your preferred highlight color
  }
  
  // Default color scheme
  return this.config.colors[i % this.config.colors.length];
}
```

### Filtering Options

The post tag graph supports several filtering modes:

1. **Show all tags** - The entire site's tag network
2. **Filter by post's tags** - Only show the post's tags and directly connected tags
3. **Focus on a specific tag** - Show relationships for one selected tag

These can be controlled via the UI or programmatically.

### Layout and Size Adjustments

Adjust the size and appearance based on your theme's layout:

```html
<!-- For a sidebar widget -->
<div class="sidebar-tag-widget">
  {{ partial "post-tag-graph.html" . }}
</div>

<style>
  .sidebar-tag-widget #post-tag-graph-container {
    width: 100%;
    height: 200px;
  }
</style>
```

## Practical Applications

### Related Content Discovery

The post-specific tag graph helps readers discover related content by visualizing connections between tags. This increases page views and time on site.

### Content Organization Insights

For site authors, the visualization provides insights into content organization:

- Identify clusters of related topics
- Find isolated or underutilized tags
- Discover potential connections between seemingly unrelated topics

### Enhanced Reader Navigation

Place the graph at strategic points to help readers navigate your content:

1. **Post footer** - For discovering related content after reading
2. **Sidebar** - As a persistent navigation aid
3. **Topic pages** - To show the context of a specific topic

## Performance Considerations

### Large Sites

For sites with hundreds of posts and tags:

1. **Use pre-processing** to generate the tag relationship data once at build time
2. **Limit displayed nodes** to the most relevant ones:
   - Set a minimum occurrence threshold
   - Only show tags within N degrees of connection
   - Cap the total number of displayed nodes

### Implementation:

```html
<!-- In post-tag-graph.html -->
<script>
  // Filter to only show tags that appear at least 3 times
  const filteredNodes = tagGraphData.nodes.filter(node => node.count >= 3);
  
  // Limit to the 50 most frequent tags (plus current post's tags)
  const sortedNodes = filteredNodes.sort((a, b) => b.count - a.count);
  const topNodes = sortedNodes.slice(0, 50);
  
  // Always include current post's tags
  currentPostTags.forEach(tagName => {
    if (!topNodes.some(node => node.id === tagName)) {
      const tagNode = tagGraphData.nodes.find(node => node.id === tagName);
      if (tagNode) {
        topNodes.push(tagNode);
      }
    }
  });
  
  // Update the filtered data
  tagGraphData.nodes = topNodes;
  tagGraphData.links = tagGraphData.links.filter(link => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    return topNodes.some(node => node.id === sourceId) && 
           topNodes.some(node => node.id === targetId);
  });
</script>
```

## Advanced Usage

### Tag Graph for Post Series

For blogs with series or sequential posts:

```html
<!-- Series-aware tag graph -->
{{ if .Params.series }}
  <div class="series-tag-section">
    <h3>Topics in the "{{ .Params.series }}" Series</h3>
    
    <script>
      // Collect tags from all posts in this series
      const seriesTags = new Set();
      {{ range (where .Site.RegularPages "Params.series" .Params.series) }}
        {{ range .Params.tags }}
          seriesTags.add("{{ . }}");
        {{ end }}
      {{ end }}
      
      // Highlight current post in series
      document.addEventListener('DOMContentLoaded', function() {
        const tagGraph = document.querySelector('#post-tag-graph-container').__tagGraph;
        if (tagGraph) {
          // Filter to show series tags
          tagGraph.filterByMultipleTags(Array.from(seriesTags));
        }
      });
    </script>
    
    {{ partial "post-tag-graph.html" . }}
    
    <div class="series-navigation">
      <h4>Other posts in this series:</h4>
      <ul>
        {{ range (where .Site.RegularPages "Params.series" .Params.series) }}
          {{ if ne .Permalink $.Permalink }}
            <li><a href="{{ .Permalink }}">{{ .Title }}</a></li>
          {{ else }}
            <li><strong>{{ .Title }}</strong> (current)</li>
          {{ end }}
        {{ end }}
      </ul>
    </div>
  </div>
{{ end }}
```

### Integration with Related Posts

Combine the tag graph with a related posts section:

```html
<!-- layouts/partials/related-posts.html -->
<div class="related-content">
  <div class="tag-connections">
    <h3>Topic Connections</h3>
    {{ partial "post-tag-graph.html" . }}
  </div>
  
  <div class="related-posts">
    <h3>Related Articles</h3>
    <ul>
      {{ $currentPage := . }}
      {{ $tags := .Params.tags }}
      {{ $posts := where .Site.RegularPages "Type" "posts" }}
      
      {{ range $posts.ByDate.Reverse }}
        {{ $matchingTags := 0 }}
        {{ range $tags }}
          {{ if in $.Page.Params.tags . }}
            {{ $matchingTags = add $matchingTags 1 }}
          {{ end }}
        {{ end }}
        
        {{ if and (gt $matchingTags 0) (ne .Permalink $currentPage.Permalink) }}
          <li>
            <a href="{{ .Permalink }}">{{ .Title }}</a>
            <span class="tags-match">({{ $matchingTags }} matching
              {{ if eq $matchingTags 1 }}tag{{ else }}tags{{ end }})
            </span>
          </li>
        {{ end }}
      {{ end }}
    </ul>
  </div>
</div>
```

### Interactive Tag Explorer

Create a more interactive tag exploration experience:

```html
<!-- layouts/shortcodes/tag-explorer.html -->
<div class="tag-explorer">
  <div class="controls">
    <input type="text" id="tag-search" placeholder="Search for a tag...">
    <button id="reset-graph">Reset View</button>
    <select id="view-mode">
      <option value="all">All Tags</option>
      <option value="post">This Post's Tags</option>
      <option value="related">Related Tags</option>
    </select>
  </div>
  
  <div class="visualization">
    {{ partial "post-tag-graph.html" .Page }}
  </div>
  
  <div class="tag-details" id="tag-details-panel">
    <h3>Tag Details</h3>
    <p class="select-prompt">Click on a tag to see details</p>
    <div class="tag-info" style="display: none;">
      <h4 id="selected-tag-name"></h4>
      <p>Used in <span id="tag-count"></span> posts</p>
      <div id="related-tags"></div>
      <h5>Recent Posts:</h5>
      <ul id="tag-posts"></ul>
    </div>
  </div>
</div>

<script>
  document.addEventListener('DOMContentLoaded', function() {
    const tagGraph = document.querySelector('#post-tag-graph-container').__tagGraph;
    if (!tagGraph) return;
    
    // Search functionality
    const searchInput = document.getElementById('tag-search');
    searchInput.addEventListener('keyup', function(e) {
      if (e.key === 'Enter') {
        tagGraph.filterByTag(this.value);
      }
    });
    
    // Reset button
    document.getElementById('reset-graph').addEventListener('click', function() {
      tagGraph.resetFilters();
      // Clear selection
      document.querySelector('.tag-info').style.display = 'none';
      document.querySelector('.select-prompt').style.display = 'block';
    });
    
    // View mode selector
    document.getElementById('view-mode').addEventListener('change', function() {
      const mode = this.value;
      if (mode === 'all') {
        tagGraph.resetFilters();
      } else if (mode === 'post') {
        const postTags = {{ .Page.Params.tags | jsonify }};
        tagGraph.filterByMultipleTags(postTags);
      } else if (mode === 'related') {
        const postTags = {{ .Page.Params.tags | jsonify }};
        // Show tags that are one connection away from post tags
        tagGraph.filterByTagsWithConnections(postTags, 1);
      }
    });
    
    // Tag selection
    tagGraph.nodes.on('click', function(event, d) {
      // Update details panel
      const detailsPanel = document.getElementById('tag-details-panel');
      const tagInfo = detailsPanel.querySelector('.tag-info');
      const selectPrompt = detailsPanel.querySelector('.select-prompt');
      
      // Show tag info, hide prompt
      tagInfo.style.display = 'block';
      selectPrompt.style.display = 'none';
      
      // Update tag details
      document.getElementById('selected-tag-name').textContent = d.name;
      document.getElementById('tag-count').textContent = d.count;
      
      // Show related tags
      const relatedTagsDiv = document.getElementById('related-tags');
      relatedTagsDiv.innerHTML = '<h5>Related Tags:</h5><ul></ul>';
      const relatedTagsList = relatedTagsDiv.querySelector('ul');
      
      // Find related tags through links
      const relatedTags = tagGraph.data.links
        .filter(link => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          return sourceId === d.id || targetId === d.id;
        })
        .map(link => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          return sourceId === d.id ? targetId : sourceId;
        });
      
      // Add related tags to list
      relatedTags.forEach(tagId => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = "/tags/" + tagId;
        a.textContent = tagId;
        a.addEventListener('click', function(e) {
          e.preventDefault();
          tagGraph.filterByTag(tagId);
          // Update details for this tag
          const tagNode = tagGraph.data.nodes.find(n => n.id === tagId);
          if (tagNode) {
            document.getElementById('selected-tag-name').textContent = tagNode.name;
            document.getElementById('tag-count').textContent = tagNode.count;
          }
        });
        li.appendChild(a);
        relatedTagsList.appendChild(li);
      });
      
      // Load posts with this tag
      const tagPostsList = document.getElementById('tag-posts');
      tagPostsList.innerHTML = 'Loading...';
      
      // We would typically fetch this data, but for Hugo we'll pre-generate it
      tagPostsList.innerHTML = '';
      {{ range .Site.Pages }}
        {{ if .Params.tags }}
          {{ $currentPagePath := $.Page.RelPermalink }}
          {{ range .Params.tags }}
            if ("{{ . }}" === d.id) {
              const li = document.createElement('li');
              const a = document.createElement('a');
              a.href = "{{ $.RelPermalink }}";
              a.textContent = "{{ .Title }}";
              {{ if eq $.RelPermalink $currentPagePath }}
                a.classList.add('current-page');
                a.textContent += ' (current)';
              {{ end }}
              li.appendChild(a);
              tagPostsList.appendChild(li);
            }
          {{ end }}
        {{ end }}
      {{ end }}
    });
  });
</script>

<style>
  .tag-explorer {
    display: grid;
    grid-template-columns: 70% 30%;
    grid-gap: 20px;
    margin: 2rem 0;
  }
  
  .tag-explorer .controls {
    grid-column: 1 / 3;
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
  }
  
  .tag-explorer .controls input {
    flex-grow: 1;
    padding: 5px 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  .tag-explorer .visualization {
    grid-column: 1;
  }
  
  .tag-explorer .tag-details {
    grid-column: 2;
    background: #f9f9f9;
    border-radius: 4px;
    padding: 15px;
    border: 1px solid #e0e0e0;
  }
  
  .current-page {
    font-weight: bold;
    color: #ff7f0e;
  }
</style>
```

Adopting these approaches will create a richer, more interactive experience for your readers, helping them explore your content through tag relationships.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT