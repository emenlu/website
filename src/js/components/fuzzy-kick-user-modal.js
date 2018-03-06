(function (G) {
	//! child-components: kick-user-modal
	//! requires: Awesomplete, Fuse

	function filter(text, input) {
		return Awesomplete.FILTER_CONTAINS(text, input.match(/[^,]*$/)[0]);
	}
	function update(text) {
		var before = this.input.value.match(/^.+,\s*|/)[0];
		this.input.value = before + text;
	}

	function updateError(modal, error) {
		var existing = modal.querySelectorAll('.modal-complain')
		while (existing.length)
			modal.removeChild(existing.pop())

		var buttons = modal.querySelectorAll('button')
		var lastBtn = buttons[buttons.length - 1]

		var complaint = el('div.modal-complaint', [error])
		lastBtn.parentNode.insertBefore(complaint, lastBtn.nextSibling)
	}

	G.fuzzyKickUserModal = function (collectionId, emails) {
		// Filter the body of the modal (show matching emails)
		var fuzzyBody = new Fuse(emails, {
			threshold: 0.4
		})

		var search = el('input.modal-input-box', {
			type: "text",
			placeholder: "user@email.tld"
		})

		var items = emails.map(email => el('div.item', [email]))
		var container = el('div.items-container', items)
		var kickBtn = el('button#confirm.btn', ['kick'])

		var modal = el('div#modal.modal', [
			el('div', [
				window.modals.closeButton(),
				el("h1.text-title", [
					`Kick users from #${collectionId}`
				]),
				el("div.modal-divider"),
				search,
				el("div#search-divider.modal-divider"),
				items.length ? container : "You are the only member of this collection!",
				el("div#bottom-divider.modal-divider"),
				kickBtn, window.modals.cancelButton()
			])
		])

		new Awesomplete(search, {
			list: emails,
			filter: filter,
			replace: update
      	})

		// Click email to fill it
		items.forEach(item => item.addEventListener('click', fillEmail, false))
		function fillEmail(evt) {
			search.value = this.textContent
		}

		// Filter emails as-you-type
		search.addEventListener('input', function(e) {
			var input = this.value || ""

			while (container.firstChild)
				container.removeChild(container.firstChild)

			var results = fuzzyBody.search(input) || []
			for (var i = 0; i < items.length; i++) {
				if (results.indexOf(i) >= 0 || input === "")
					container.appendChild(items[i])
			}
		})

		return new Promise(function (F, R) {
			document.body.appendChild(modal)
			window.modals.appear(modal)
			kickBtn.addEventListener('click', evt => {
				var email = search.value
				window.modals.toggleButtonState()
				window.components.kickUserModal(collectionId, email)
					.then(ok => {
						document.body.removeChild(modal)
						F(email)
					}).catch(xhr => {
						window.modals.toggleButtonState()
						updateError(modal, xhr.responseText)
					})
			}, false)

		})
	}

})(window.components || (window.components = {}));

