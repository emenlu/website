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

	G.createCollectionModal = function () {
		var create = el('button#confirm.btn', ['create'])
		var collectionName = el('input.modal-input-box', {
			placeholder: 'collection name'
		})
		var modal = el('div#modalConf.modal.confirm', [
			el('div', [
				window.modals.closeButton(),
				el("h1.text-title", ['Create new collection']),
				el('div.modal-divider'),
				collectionName,
				el("div#bottom-divider.modal-divider"),
				create,
				window.modals.cancelButton()
			])
		])

		return new Promise(function (F, R) {
			create.addEventListener('click', evt => {
				if (!collectionName.value) {
					updateError(modal, "Must provide a name")
					return
				}

				window.modals.toggleButtonState()
				api.v1.collection.create(collectionName.value)
                	.done(data => {
                		document.body.removeChild(modal)
                		F({
	                		id: data.id,
	                		name: collectionName.value
                		})
                	})
	                .fail(xhr => {
	                	window.modals.toggleButtonState()
						updateError(modal, xhr.responseText)
					})
			})

			document.body.appendChild(modal)
			window.modals.appear(modal)
		})
	}
})(window.components || (window.components = {}));