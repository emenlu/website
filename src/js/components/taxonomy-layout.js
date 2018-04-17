(function (G) {

	function updateError(modal, error) {
		var existing = modal.querySelectorAll('.modal-complain')
		while (existing.length)
			modal.removeChild(existing.pop())

		var buttons = modal.querySelectorAll('button')
		var lastBtn = buttons[buttons.length - 1]

		var complaint = el('div.modal-complaint', [error])
		lastBtn.parentNode.insertBefore(complaint, lastBtn.nextSibling)
	}

	G.taxonomyLayoutModal = function (dataset,taxonomy) {
		var serp = taxonomy.tree()
		var color = window.util.colorScheme(taxonomy)
		var usage = window.util.computeUsage(dataset, taxonomy)
		
		serp.map(function init(node) {
			node.usage = usage[node.id().toLowerCase()]
			node.map(init)
		})

		function relativeUse(d) {
		/* root node has no parent, but its usage is known (100%) */
		if (!d.parent)
			return 1.0
		var root = d.parent
		while (root.parent)
			root = root.parent
		return d.usage / Math.max(root.usage, 1)
		}

		function makeTree(d,div){
			d.tree.forEach(function(child){
					var containerDiv = el('div.modal-taxonomy-map-ul-head-container',[])
					div.appendChild( getActiveList(child, containerDiv,12,1,1) )
				})
			return div
		}

		function getActiveList(d, ul, font, sqr,depth){
			//used to shrink size of square beside text,font size and padding for Div
			sqr = sqr-0.065>0 ? sqr-0.065:sqr
			font = font-0.25>0 ? font-0.25:font
			var tree = d.tree
			var title = d.short.length<15? d.short: d.short.substring(0,13)+'...'
			var span = el('span.modal-flex-span', [title.toLowerCase()])
			span.style.fontSize = font +'px'
			var li = el('li',[span])
			//create squares
			var square = el('div.small-square',[li])
			square.style.background = color(d.id())(relativeUse(d))
			square.style.height=sqr +"em"
			square.style.width=sqr +"em"
			square.style.marginTop = depth <10? 8+(depth/2) + '%' : 11 + (depth/2) + '%' 
			//create outline grid
			var mark = depth >1? '¦':''
			var lines = mark + Array(depth).join('-')
			var lineSpan= el('span.modal-outline-span', [lines])	
			var lineLi = el('li',[lineSpan])
			var outlineDiv = el('div.modal-taxonomy-map-outLineContainer',[lineLi])
			
			var containerDiv = el('div.modal-taxonomy-map-ul-container',[square,li])
			var outerContainer = el('div.modal-taxonomy-map-ul-container',[outlineDiv,containerDiv])
			var ulTaxMap = el('ul.ul-taxonomy-map',[])
			ul.appendChild(outerContainer)
			if(typeof tree !== 'undefined' && tree.length >0){
				tree.forEach(function(child){
					ul.appendChild( getActiveList(child, ulTaxMap,font,sqr,depth+1) )
				})
			}
			return ul
		}

		var div = el('div.modal-flex',[])

		var modal = el('div.modal', [
			el('div', [
				window.modals.closeButton(),
				el("h1.text-title", ['Taxonomy Tree']),
				el("div.modal-divider"),
				makeTree(serp,div),
				window.modals.cancelButton()
			])
		])
		return new Promise(function (F, R) {
			
			document.body.appendChild(modal)
			window.modals.appear(modal)
		})
	}
})(window.components || (window.components = {}));