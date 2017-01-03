$(function () {
	var toProfilePage = () => window.location = "/profile.html"

	// Only allow user to inspect specific collection
	if (window.location.hash.length === 0)
		toProfilePage()

	// http://serpconnect.cs.lth.se/collection.html#33
	var cID = window.location.hash.substring(1)

	function updateLink(el) {
		el.setAttribute('href', `${el.getAttribute('href')}#${cID}`)
	}

	['general', 'users', 'entries'].forEach(id => updateLink(document.getElementById(id)))

	function refresh() {
		window.api.ajax("GET", window.api.host + "/v1/collection/" + cID + "/entries")
			.done(setupEntries)
			.fail(toProfilePage)
	}

	refresh()

	function setupEntries(entries) {
		var elEntries = document.getElementById('collection-entries')

		while (elEntries.firstChild)
			elEntries.removeChild(elEntries.firstChild)

		entries.forEach(entry => {
			var elEntry = el('div.collection-option-li', {
				'data-entry-id': entry.id
			}, [entry.description || entry.reference || entry.DOI])

			elEntry.addEventListener('click', inspectEntry, false)

			elEntries.appendChild(elEntry)
		})
	}

	var reverseMap = {
    	"adapting": "Effect",
        "solving": "Effect",
        "assessing": "Effect",
        "improving": "Effect",
        "planning": "Scope",
        "design": "Scope",
        "execution": "Scope",
        "analysis": "Scope",
        "people": "Context",
        "information": "Context",
        "sut" : "Context",
        "other": "Context"
    }
    var shorthandMap = {
        "adapting": "Adapt testing",
        "solving": "Solve new problem",
        "assessing": "Assess testing",
        "improving": "Improve testing",
        "planning": "Test planning",
        "design": "Test design",
        "execution": "Test execution",
        "analysis": "Test analysis",
        "people": "People related constraints",
        "information": "Availability of information",
        "sut" : "Properties of SUT",
        "other": "Other"
    }

	function inspectEntry(evt) {
		var id = this.dataset.entryId

		window.api.ajax("GET", window.api.host + "/v1/entry/" + id).done(entry => {
			window.api.ajax("GET", window.api.host + "/v1/entry/" + id + "/taxonomy").done(taxonomy => {
				var close = el('div.close-btn')

				close.addEventListener('click', function (evt) {
					document.body.removeChild(close.parentNode.parentNode)
				}, false)

				var constructFacet = function(name) {
					var samples = Object.keys(taxonomy).filter(
						facet => reverseMap[facet.toLowerCase()] === name
					) || []

					if (!samples.length) return undefined

					return el("div.modal-header-title", [
						name,
						samples.map(facet => {
							var filtered = taxonomy[facet] || []
							return el('div.modal-sub-sub-item', [
								shorthandMap[facet.toLowerCase()],
								filtered.map(sample => (sample === "unspecified"
									? undefined : el('div.modal-sub-sub-item', [sample])))
							])
						})
					])
				}

				var extraInfo = []
				if (entry.type === "challenge") {
					extraInfo.push(
						el('div.modal-header-title', ['Description']),
						el('div.modal-sub-item', [entry.description]))
				} else {
					extraInfo.push(
						el('div.modal-header-title', ['References']),
						el('div.modal-sub-item', [entry.reference]),
						el('div.modal-header-title', ['DOI']),
						el('div.modal-sub-item', [entry.doi]))
				}

				var editBtn = el('button.edit-btn', ['edit'])
				var removeBtn = el('button.edit-btn', ['remove from collection'])

				editBtn.addEventListener('click', () => {
					toggleButtonState()
					window.location = "/submit.html?e=" + id
				}, false)

				removeBtn.addEventListener('click', () => {
					toggleButtonState()
					window.api.ajax("POST", window.api.host + "/v1/collection/" + cID + "/removeEntry", {
			    		entryId: id
			    	})
			    		.done(() => {
			    			document.body.removeChild(modal)
			    			refresh()
			    		})
			    		.fail(xhr => window.alert(JSON.stringify(xhr)))
    			}, false)

				var modal = el('div.modal', [el('div', [
					close, el("div.modal-entry-type", [entry.type]),
					el("div.modal-header-title", [`entry #${entry.id}`]),
					el("div.modal-divider"),
					constructFacet("Effect"),
					constructFacet("Scope"),
					constructFacet("Context"),
					el("div.modal-divider"),
					extraInfo,
					el("div.modal-divider"),
					removeBtn, editBtn
				])])

				document.body.appendChild(modal)
			})
		})
	}

	// Switch all buttons between disabled and enabled state
    function toggleButtonState() {
        var btns = document.querySelectorAll('.btn')
        for (var i = 0; i < btns.length; i++) {
            btns[i].classList.toggle('submit-disabled')
            if (btns[i].getAttribute('disabled'))
                btns[i].removeAttribute('disabled')
            else
                btns[i].setAttribute('disabled', true)

        }
    }

    document.addEventListener('keydown', function (evt) {
    	if (evt.keyCode === 27) {
    		var modal = document.querySelector('.modal')
    		if (!modal) return
    		document.body.removeChild(modal)
    	}
    })

    window.addEventListener('load', () => {
	    document.body.addEventListener('click', function (evt) {
	    	if (evt.target.className === "modal")
	    		document.body.removeChild(evt.target)
	    }, false)
	})


})
