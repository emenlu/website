(function() {
	function $$(id) {
		return document.querySelector(id)
	}

	function toggleDiv(sel) {
		var e = $$(sel)
		 return function() {
			if (e.style.display === 'block')
				e.style.display = 'none'
			else
				e.style.display = 'block'

			this.classList.toggle('down')
		}
	}

	function resetAll(div, btn){
		var e = $$(div)
		var button = $$(btn)
		if (e.style.display === 'block'){
			button.click()
		}
	}

	var instance = undefined,
		ctrl = undefined,
		list = undefined

	function explore(dataset, into) {
		var graph = window.graph(dataset, window.explore_conf)
		if (instance) {
			list.changeDataset(dataset)
			instance.graph.clear()
			instance.graph.read(graph)
			ctrl.reset()
			instance.refresh()
		} else {
			instance = new sigma({
				renderer: {
					container: into,
					type: 'canvas'
				},
				graph: graph,
				settings: {
					// edge color = facet color
					edgeColor: 'target',
					// no scroll zoom, breaks zoomTo
					zoomingRatio: 1.0,
					// disable double-click-to-zoom
					doubleClickEnabled: false
				}
			})

			ctrl = new window.controls(instance)
			list = new window.listing($$('#listing'), instance, dataset)
			list.registerEvents(ctrl)

			ctrl.bind('reset', function(){
				resetAll('#listing','#matches')
				resetAll('#helpbox', '#help')
			})//resets other buttons if active.

			$$('#matches').addEventListener('click', () => {
				var showView = $$('#matches').classList.contains('down')
				instance.graph.nodes().forEach(n => {
					if (n.category !== CATEGORY_FACET)
						n.showLabel = showView
				})
				if (showView)
					into.style.width = '75%'
				else
					into.style.width = '100%'
				instance.renderers[0].resize()
				instance.refresh()
			}, false)
		}
	}

	function exploreSet(set) {
		explore(set, $$('#graph'))
	}

	window.onload = function() {
		$$('#explore').classList.add('current-view')
		$$('#help').addEventListener('click', toggleDiv('#helpbox'), false)
		$$('#matches').addEventListener('click', toggleDiv('#listing'), false)
		var hasCollection = window.location.hash.length > 0
		var collectionId = hasCollection ? window.location.hash.substring(1) : ""
		var found = false
		window.user.collections()
			.done(collz => {
				var selector = $$('#dataset')

				collz.forEach(coll => {
					var opt = document.createElement('option')
					opt.setAttribute('value', coll.id)
					opt.text = coll.name
					selector.appendChild(opt)
					if (coll.id === Number(collectionId))
						found = true
				})

			})
			.always(xhr => {
				if (!found && hasCollection) {
					var opt = document.createElement('option')
					opt.setAttribute('value', collectionId)
					opt.text = "#" + collectionId
					$$('#dataset').appendChild(opt)
				}

				if (hasCollection) {
					$$('#dataset').value = collectionId
					Dataset.loadCollection(collectionId, exploreSet)
				} else
					Dataset.loadDefault(exploreSet)
			})

		$$('#dataset').addEventListener('change', function (evt) {
	        window.location.hash = '#' + this.value
			if (this.value === "main")
				Dataset.loadDefault(exploreSet)
			else
				Dataset.loadCollection(this.value, exploreSet)
		})

		// Some browsers do not support the css calc(), or it doesn't work.
		// Detect failure and do what css should've done, 2em = 32px
		var computedHeight = window.getComputedStyle($$('#graph')).height
		if (computedHeight === '0px') {
			var height = `${window.innerHeight - 87 - 35 - 15 - 32}px`
			$$('#graph').style.height = height
			$$('#listing').style.height = height
		}

		// automatically display matches when loading the page
		$(function () {
			$('#matches').click();
		});

	}

})();
