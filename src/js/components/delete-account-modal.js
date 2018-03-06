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

	G.deleteAccountModal = function (email) {
		var confirm = el('button#confirm.btn', ['confirm'])
		var deleteEl = el('input.modal-input-box', {
			placeholder: "your-email@something.com"
		})
		var modal = el('div#modalConf.modal.confirm', [
			el('div', [
				window.modals.closeButton(),
				el("h1.text-title", ['Delete account']),
				el("div.modal-divider"),
				el('div', [
					'Type your email and click confirm to delete your account.',
					'This will also delete any collection that you are solve member of.'
				]),
				el("div.modal-divider"),
				deleteEl,
				el("div#bottom-divider.modal-divider"),
				confirm,
				window.modals.cancelButton()
			])
		])

		return new Promise(function (F, R) {
			confirm.addEventListener('click', evt => {
				if (deleteEl.value !== email) return

				window.modals.toggleButtonState()

				window.user.delete()
                    .done(F)
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