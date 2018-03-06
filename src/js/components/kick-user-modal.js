(function (G) {

	G.kickUserModal = function (collectionID, userEmail) {
		return new Promise(function (F, R) {
			var confirm = el('button#confirm.btn', ['confirm'])
			var modal = el('div#modalConf.modal.confirm', [
				el('div', [
					window.modals.closeButton(),
					el("h1.text-title", [
						`Are you sure you want to kick ${userEmail}?`
					]),
					el("div#bottom-divider.modal-divider"),
					confirm,
					window.modals.cancelButton()
				])
			])

			confirm.addEventListener('click', evt => {
				window.modals.toggleButtonState()

				api.v1.collection.kick(userEmail, collectionID)
					.done(F)
					.fail(xhr => R(xhr.responseText))
					.always(() => document.body.removeChild(modal))

			}, false)

			document.body.appendChild(modal)
			window.modals.appear(modal)
		})
	}

})(window.components || (window.components = {}));