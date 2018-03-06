(function (G) {

	G.deleteCollectionModal = function (collectionId) {
		return new Promise(function (F, R) {
			var confirm = el('button#confirm.btn', ['confirm'])
			var modal = el('div#modalConf.modal.confirm', [
				el('div', [
					window.modals.closeButton(),
					el("h1.text-title", [
						`Delete collection #${collectionId}?`
					]),
					el("div#bottom-divider.modal-divider"),
					confirm,
					window.modals.cancelButton()
				])
			])

			confirm.addEventListener('click', evt => {
				window.modals.toggleButtonState()

				api.v1.admin.deleteCollection(collectionId)
					.then(ok => {
						document.body.removeChild(modal)
						F()
					})
					.catch(xhr => R(xhr.responseText))
			})

			document.body.appendChild(modal)
		})
	}

})(window.components || (window.components = {}));