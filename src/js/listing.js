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

    var reverseMap = {
    	"adapting": "Effect",
        "solving": "Effect",
        "assessing": "Effect",
        "improving": "Effect",
        "planning": "Scope",
        "design": "Scope",
        "execution": "Scope",
        "analysis": "Scope",
        "people": "Context",
        "information": "Context",
        "sut" : "Context",
        "other": "Context",
        "intervention": "Intervention"
    }
    var shorthandMap = {
        "adapting": "Adapt testing",
        "solving": "Solve new problem",
        "assessing": "Assess testing",
        "improving": "Improve testing",
        "planning": "Test planning",
        "design": "Test design",
        "execution": "Test execution",
        "analysis": "Test analysis",
        "people": "People related constraints",
        "information": "Availability of information",
        "sut" : "Properties of SUT",
        "other": "Other"
    }


	function constructEntities(taxonomy, facet) {
		var filtered = taxonomy[facet] || []

		return filtered.map(sample => (
			sample === "unspecified" ?
				undefined : el('div.modal-sub-sub-item', [sample]))
		)
	}

	function constructSubfacet(taxonomy, facet) {
		if (shorthandMap[facet.toLowerCase()])
			return el('div.modal-sub-sub-item', [
				shorthandMap[facet.toLowerCase()],
				constructEntities(taxonomy, facet)
			])
		else
			return constructEntities(taxonomy, facet)
	}

	function constructFacet(taxonomy, name) {
		var samples = Object.keys(taxonomy).filter(
			facet => reverseMap[facet.toLowerCase()] === name
		) || []

		if (!samples.length) return undefined

		return el("div.modal-header-title", [
			name,
			samples.map(facet => constructSubfacet(taxonomy, facet))
		])
	}

	function inspectEntry(evt) {
		var id = this.dataset.entryId

		window.api.ajax("GET", window.api.host + "/v1/entry/" + id).done(entry => {
			window.api.ajax("GET", window.api.host + "/v1/entry/" + id + "/taxonomy").done(taxonomy => {
				var inspectModal = new window.modal(
					[
						el('div.modal-entry-type', [entry.type]),
						el('div.modal-header-title', [`entry #${entry.id}`])
					], [
						constructFacet(taxonomy, "Intervention"),
						constructFacet(taxonomy, "Effect"),
						constructFacet(taxonomy, "Scope"),
						constructFacet(taxonomy, "Context"),
						el("div.modal-divider"),
						entry.type === "challenge" ? [
							el('div.modal-header-title', ['Description']),
							el('div.modal-sub-item', [entry.description])
						] : [
							el('div.modal-header-title', ['References']),
							el('div.modal-sub-item', [entry.reference]),
							el('div.modal-header-title', ['DOI']),
							el('div.modal-sub-item', [entry.doi])
						]
					]
				)
				inspectModal.show()
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

		for (var i = 0; i < visible.length; i++) {
			var node = visible[i]

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
