(function(scope) {

	function getCollectionID(){
		return document.getElementById('dataset').value
	}

	function makeEntry(entry) {
		var entryId = String(entry.id)

		var color = 'chl'
		if (entry.type !== 'challenge')
			color = 'res'

		var div = el('div', {
			'data-id': entry.id,
		}, [
			el(`span.${color}`, [entryId]),
			': ' + (entry.description || entry.reference || "information n/a")
		])

		div.dataset.entryId = entry.id
		div.addEventListener('click', inspectEntry, false)

		return div
	}

	function inspectEntry(evt) {
		var id = this.dataset.entryId
		var options =[]
		var CID = getCollectionID()
		Promise.all([
			window.api.v1.entry.get(id),
			window.api.v1.entry.taxonomy(id)
		]).then(data => {
			var entry = data[0]
			var clazz = data[1]
			window.modals.entryModal(CID, entry, clazz)
		})
	}

	function Listing(div, instance, dataset) {
		this.div = div
		this.chl = dataset.challenges()
		this.res = dataset.research()

		this._instance = instance
		this.selected = -1
		this.facets = {}

		this.update()
	}

	Listing.prototype.onHover = function (entryId) {
		var nodes = this._instance.graph.nodes()
		var node
		for (var i = 0; i < nodes.length; i++) {
			if (nodes[i].label == entryId) {
				node = nodes[i]
				break
			}
		}
		
		if (!node) return
		
		var edges =  this._instance.graph.edges()
		for (var i = 0; i < edges.length; i++) {
			var edge = edges[i]
			if (edge.source === this.selected) continue
			if (edge.source === node.id && this.facets[edge.target])
				edge.highlight = true
			else
				edge.highlight = false
		}

		this._instance.render({ skipIndexation: true})
	}

	Listing.prototype.changeDataset = function (ds) {
		this.chl = ds.challenges()
		this.res = ds.research()
	}

	Listing.prototype.registerEvents = function(ctrl) {
		var _update = () => this.update()
		ctrl.bind('select', _update)
		ctrl.bind('deselect', _update)
		ctrl.bind('reset', _update)

		ctrl.bind('select', (node) => this.selectNode(node))
		ctrl.bind('deselect', (node) => this.deselectNode(node))
		ctrl.bind('reset', (full) => this.resetSelection(full))

		var self = this
		this.div.addEventListener('mouseover', function (evt) {
			var id = evt.target.dataset.id
			if (id)
				self.onHover(id)
		})
		this.div.addEventListener('mouseleave', function (evt) {
			var edges =  self._instance.graph.edges()
			for (var i = 0; i < edges.length; i++) {
				if (edges[i].source === self.selected) 
					continue
				else 
					edges[i].highlight = false
			}
			self._instance.render({ skipIndexation: true})
		})
	}

	Listing.prototype.selectNode = function (node) {
		if (node.category === CATEGORY_FACET) {
			this.facets[node.id] = (this.facets[node.id] || 0) + 1
			return
		}

		this.selected = node.id
		var edges = this._instance.graph.edges()
		for (var i = 0; i < edges.length; i++) {
			var edge = edges[i]
			if (edge.source !== node.id) continue
			this.facets[edge.target] = (this.facets[edge.target] || 0) + 1
		}
	}
	Listing.prototype.deselectNode = function (node) {
		if (node.category === CATEGORY_FACET) {
			this.facets[node.id] = (this.facets[node.id] || 0) - 1
			return
		}

		var edges = this._instance.graph.edges()
		this.selected = -1
		for (var i = 0; i < edges.length; i++) {
			var edge = edges[i]
			if (edge.source !== node.id) continue
			this.facets[edge.target] = (this.facets[edge.target] || 0) - 1
		}
	}
	Listing.prototype.resetSelection = function (fullReset) {
		if (fullReset)
			this.facets = {}
	}

	Listing.prototype.update = function() {
		// clear list b/c it's easier than merging two lists...
		while (this.div.firstChild)
			this.div.removeChild(this.div.firstChild)

		var self = this
		var visible = this._instance.graph.nodes()

		for (var i = 0; i < visible.length; i++) {
			var node = visible[i]
			if (node.hidden) continue
			if (node.category === CATEGORY_FACET) continue

			// id = '?XYZ' where XYZ is index in chl/res array
			var idx = node.revid.substr(1)
			var entry

			if (node.category === CATEGORY_CHALLENGE)
				entry = makeEntry(this.chl[idx])
			else
				entry = makeEntry(this.res[idx])

			this.div.appendChild(entry)
		}
	}

	scope.listing = Listing
})(window)
