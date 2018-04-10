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
        var title = el("h3", ["Taxonomy Legend"])
        var baseLegend = el("a#baseLegend.proj-ui-taxonomy-ext-legend", [])
        var a_baseLegend = el("a", ["Base Taxonomy"])
        var extLegend = el("a#extendedLegend.proj-ui-taxonomy-ext-legend", [])
        var a_extLegend =el("a", ["Extended Taxonomy"])
        var div1 = el("div.divider-wrapper", [ baseLegend,a_baseLegend])
        var div2 = el("div.divider-wrapper", [extLegend,a_extLegend])
        var ovContainer  = el("div.ov-tax-container", [title,div1,div2])
        var mainContainer = el("div.collections-taxonomy-ext-legend-container", [ovContainer])

        var modal = el('div#modalHelp.modal.confirm', [
            el('div', [
                window.modals.closeButton(),
                el("h1.text-title", ['How To Use']),
                el('div.modal-divider'),
                p,
                mainContainer,
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