(function (G) {

	G.leaveCollectionModal = function (collectionId, isOwner) {
		var action = isOwner ? 'Delete' : 'Leave'
		var confirm = el('button#confirm.btn', [action])

		var modal = el('div#modal.modal', [
            el('div', [
                window.modals.closeButton(),
                el("h1.text-title", [action + ' Collection ' + collectionId +'?']),
                //name of modal

                el("div.modal-divider"),
                el("div.modal-sub-item", [
					`${action} ?`//`${action} ${title}?`
				]),

                el("div#bottom-divider.modal-divider"),
                confirm, window.modals.cancelButton()
            ])
        ])

		return new Promise(function (F, R) {
			document.body.appendChild(modal)
			window.modals.appear(modal)
			confirm.addEventListener('click', evt => {
				window.modals.toggleButtonState()

				window.api.v1.collection.leave(collectionId)
					.then(F)
					.catch(xhr => R(xhr.responseText))
					.always(() => document.body.removeChild(modal))
			}, false)
		})
	}

})(window.components || (window.components = {}));