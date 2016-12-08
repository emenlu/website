/* Control the explore visualisation with filters.
 *
 * var ctrl = new window.control(<sigma instance>)
 *
 * events:
 *	ctrl.bind("*" | "reset" | "select" | "deselect", fn())
 *
 * select node (add node to filter):
 *	ctrl.select(<sigma graph node>)
 *
 * deselect node (remove node from filter):
 *	ctrl.deselect(<sigma graph node>)
 *
 * reset (remove all filters ):
 *	ctrl.reset()
 */
(function (scope) {

	// Add a method to the graph model that returns an
	// object with every neighbors of a node inside:
	sigma.classes.graph.addMethod('neighbors', function(nodeId) {
		var neighbors = {}
		var index = this.allNeighborsIndex[nodeId] || {}

		for (var k in index)
			neighbors[k] = this.nodesIndex[k]

		return neighbors
	})

	function controls (instance) {
		this.filter = new sigma.plugins.filter(instance)
		this.sigma = instance
		this._listeners = []
		this._node = undefined
		this._activeFilters = []

		instance.bind("clickNode", evt => {
			if (evt.data.node.selected)
				this.deselect(evt.data.node)
			else
				this.select(evt.data.node)
		})

		this.evtid = document.getElementById('reset')
			.addEventListener('click', evt => this.reset(), false)
	}

	controls.prototype.reset = function() {
		this.sigma.graph.nodes().forEach((n) => {
			n.selected = false
			if (n._color)
				n.color = n._color
		})
		this.sigma.graph.edges().forEach(e => e.highlight = false)
		this.filter.undo().apply()
		this._fire('reset')
	}

	/* sneaky api, _ = might change so don't depend on it */
	controls.prototype._fire = function(evt) {
		var ln = this._listeners.length
		while (ln--) {
			var k = this._listeners[ln]
			if (k.on === '*' || k.on === evt)
				k.do.call()
		}
	}

	controls.prototype._selectFacet = function(node) {
		node.filterStack = (node.filterStack || 0) + 1
		if (node.filterStack === 1) {
			this._activeFilters.push(node.id)
			node.selected = true
			var adjacent = this.sigma.graph.neighbors(node.id)
			this.filter.nodesBy(n => {
				return adjacent[n.id] || n.category === CATEGORY_FACET
			}, `facet-${node.id}-filter`)
		}
	}

	controls.prototype._deselectFacet = function(node) {
		node.filterStack = node.filterStack - 1
		if (node.filterStack === 0) {
			var idx = this._activeFilters.indexOf(node.id)
			this._activeFilters.splice(idx, 1)

			node.selected = false
			this.filter.undo(`facet-${node.id}-filter`)
		}
	}

	controls.prototype.activeFilters = function () {
		return this._activeFilters
	}

	controls.prototype.deselect = function (node) {
		if (this._node &&
			this._node.category !== CATEGORY_FACET &&
			this._node.id === node.id)
			this._node = undefined

		node.previouslySelected = node.selected
		node.selected = false
		if (node.category === CATEGORY_FACET) {
			node.filterStack = 1
			this._deselectFacet(node)
		} else {
			this.filter.undo(`node-${node.id}-filter`)
			var facets = this.sigma.graph.neighbors(node.id)
			for (k in facets) this._deselectFacet(facets[k])
		}

		/* Colors for nodes that were gray must be restored, but instead of
		 * checking if some other filter exists that forces the node to retain
		 * its gray color, simply reset all colors and let filters gray them
		 * out as necessary.
		 */
		this.sigma.graph.nodes().forEach(n => n.color = n._color || n.color)
		this.filter.apply()

		/* filter.apply() repaints the graph; so toggle back */
		node.previouslySelected = node.selected

		this._fire('deselect')
	}

	controls.prototype.select = function (node) {
		if (this._node && node.category !== CATEGORY_FACET) {
			this.deselect(this._node)
		}

		if (node.category !== CATEGORY_FACET)
			this._node = node

		node.previouslySelected = node.selected
		node.selected = true

		/* however we filter, always keep facets visible */
		if (node.category === CATEGORY_FACET) {
			/* clicked on facet: filter out all nodes that aren't connected */
			this._selectFacet(node)
		} else {
			/* Clicked on node: do matching based on complete and incomplete
			 * matches, see: https://trello.com/c/HcpPVQoK
			 */

			/* We want to use the serp.is*Match() functions, so figure out which
			 * facets this node connects to. Maybe add an alternative ctor to
			 * SERP for constructing objects from subfacets.
			 */
			var facets = this.sigma.graph.neighbors(node.id)
			for (k in facets) {
				this._selectFacet(facets[k])
			}

			var edges = this.sigma.graph.edges()
			for (var i = 0; i < edges.length; i++) {
				var edge = edges[i]

				if (edge.source !== node.id)
					continue
				else
					edge.highlight = true
			}
			
			// var ref = new SERP()
			// SERP.forEach((f, k) => {
			// 	/* nodes are keyed by their graph ids, so lookup subfacet id */
			// 	if (facets[window.explore_conf.id_lookup(k)])
			// 		ref.set(f, k, true)
			// })

			// this.filter.nodesBy((n) => {
			// 	/* early bail for facets b/c we always want to show them */
			// 	if (n.category === CATEGORY_FACET) return true
			// 	if (node === n) return true

			// 	var rec = new SERP()
			// 	var has = this.sigma.graph.neighbors(n.id)

			// 	SERP.forEach((f, k) => {
			// 		if (has[window.explore_conf.id_lookup(k)])
			// 			rec.set(f, k, true)
			// 	})

			// 	var complete = ref.isCompleteMatch(rec)
			// 	if (complete)
			// 		return true

			// 	var incomplete = ref.isIncompleteMatch(rec)
			// 	if (incomplete) {
			// 		// TODO Make
			// 		if (!n._color)
			// 			n._color = n.color
			// 		n.color = '#AAA'
			// 		return true
			// 	}

			// 	return false
			// }, `node-${node.id}-filter`)
			
		}

		this.filter.apply()
		this._fire('select')
		this.sigma.refresh()
	}

	controls.prototype.bind = function(evt, handler) {
		this._listeners.push({
			on: evt,
			do: handler
		})
	}

	scope.controls = controls
})(window);