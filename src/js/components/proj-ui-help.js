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

    G.projUIHelp = function() {
        var p = "Click on the facets of the wheel on the right and extend the taxonomy out from the selected facet. You need to input a unique short name,a long name and description. \n "
     
        var modal = el('div#modalHelp.modal.confirm', [
            el('div', [
                window.modals.closeButton(),
                el("h1.text-title", ['How To Use']),
                el('div.modal-divider'),
                p,
                el("div#bottom-divider.modal-divider"),
                window.modals.cancelButton()
            ])
        ])

        return new Promise(function (F, R) {
            document.body.appendChild(modal)
            window.modals.appear(modal)
        })
    }
})(window.components || (window.components = {}));