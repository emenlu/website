(function (G) {

	//Simple modal, with a title, some text and a button to close 
	//the modal which can be assigned a function too
	G.noticeModal = function(title, desc) {
		var continueBtn = el('button#continue.btn', ['continue'])
		var modal = el('div.modal.notice', [
			el('div', [
				el("h1.text-title", [title]),
				el("div#bottom-divider.modal-divider"),
				el("div", [desc]),
				continueBtn
			])
		])

		return new Promise(function (F, R) {
			document.body.appendChild(modal)
			window.modals.appear(modal)
			continueBtn.addEventListener('click', (evt) => {
				document.body.removeChild(modal)
				F()
			}, false)
		})
	}

})(window.components || (window.components = {}));