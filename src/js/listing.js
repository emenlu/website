(function(scope) {


	function makeEntry(entry) {
		var entryId = String(entry.id)

		var color = 'chl'
		if (entry.type !== 'challenge')
			color = 'res'

		var div = el('div', [
			el(`span.${color}`, [entryId]),
			': ' + (entry.description || entry.reference || "information n/a")
		])

		div.dataset.entryId = entry.id
		div.addEventListener('click', inspectEntry, false)

		return div
	}

	function inspectEntry(evt) {
		var id = this.dataset.entryId
		window.user.getEntry(id).done(entry => {
			window.user.getTaxonomyEntry(id).done(taxonomy => {
				window.modals.entryModal(entry, taxonomy),function () {

					}
			})
		})
	}

	function Listing(div, instance, dataset) {
		this.div = div
		this.chl = dataset.challenges()
		this.res = dataset.research()

		this._instance = instance

		this.update()
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
	}

	Listing.prototype.update = function() {
		// clear list b/c it's easier than merging two lists...
		while (this.div.firstChild)
			this.div.removeChild(this.div.firstChild)

		var visible = this._instance.graph.nodes()
			.filter(n => !n.hidden)
			.filter(n => n.category !== CATEGORY_FACET)

		while (visible.length) {
			var node = visible.shift()

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
