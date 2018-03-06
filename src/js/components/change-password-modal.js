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

	G.changePasswordModal = function (email) {
		var changeBtn = el('button#confirm.btn', ['change'])

		var oldEl = el('input.modal-input-box', {
			type: "password",
			placeholder: "old password"
		})

		var newEl = el('input.modal-input-box', {
			type: "password",
			placeholder: "new password"
		})

		var modal = el('div#modalConf.modal', [
			el('div', [
				window.modals.closeButton(),
				el("h1.text-title", ['Change password']),
				el("div.modal-divider"),
				el("div.modal-container", [
					el('div', [oldEl]),
					el('div', [newEl])
				]),
				el("div#bottom-divider.modal-divider"),
				changeBtn,
				window.modals.cancelButton()
			])
		])

		return new Promise(function (F, R) {
			changeBtn.addEventListener('click', evt => {
				window.modals.toggleButtonState()

				api.v1.account.changePassword(oldEl.value, newEl.value)
                    .done(ok => {
                    	document.body.removeChild(modal)
                    	F()
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