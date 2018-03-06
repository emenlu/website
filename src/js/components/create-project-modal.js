(function (G) {

	function updateError(modal, error) {
		var existing = modal.querySelectorAll('.modal-complaint')
		for (var i = 0; i < existing.length; i++)
			existing[i].parentNode.removeChild(existing[i])

		var buttons = modal.querySelectorAll('button')
		var lastBtn = buttons[buttons.length - 1]

		var complaint = el('div.modal-complaint', [error])
		lastBtn.parentNode.insertBefore(complaint, lastBtn.nextSibling)
	}

	G.createProjectModal = function () {
		var create = el('button#confirm.btn', ['create'])
		var projectName = el('input.modal-input-box', {
			placeholder: 'serp'
		})

		var projectLink = el('input.modal-input-box', {
			placeholder: 'http://serpconnect.cs.lth.se'
		})

		var modal = el('div#modalConf.modal.confirm', [
			el('div', [
				window.modals.closeButton(),
				el("h1.text-title", ['Create new project']),
				el('div.modal-divider'),
				el('div', [
					el('label.w-3em', ['name']),
					projectName,
				]),
				el('div', [
					el('label.w-3em', ['link']),
					projectLink,
				]),
				el("div#bottom-divider.modal-divider"),
				create,
				window.modals.cancelButton()
			])
		])

		return new Promise(function (F, R) {
			create.addEventListener('click', evt => {
				if (!projectName.value) {
					updateError(modal, "Must provide a name")
					return
				}

				if (!projectLink.value) {
					updateError(modal, "Must provide a home page")
					return
				}

				window.modals.toggleButtonState()
				api.v1.project.create(projectName.value, projectLink.value)
                	.done(data => {
                		document.body.removeChild(modal)
                		F({
	                		link: projectLink.value,
	                		name: projectName.value
                		})
                	})
	                .fail(xhr => {
						updateError(modal, xhr.responseText)
					}).always(() => {
	                	window.modals.toggleButtonState()
	                })
			})

			document.body.appendChild(modal)
			window.modals.appear(modal)
		})
	}

})(window.components || (window.components = {}));