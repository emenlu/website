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
	['general', 'users','taxonomy-tab', 'entries'].forEach(id => updateLink(document.getElementById(id)))

	document.getElementById('new-entry').addEventListener('click', evt => {
		window.location = "/submit.html?c=" + cID
	})

	function refresh() {
		Promise.all([
			window.api.v1.taxonomy(),
			window.api.v1.collection.taxonomy(cID),
			window.api.v1.collection.entries(cID)
		]).then(data => {
			var taxonomy = new Taxonomy(data[0].taxonomy)
			taxonomy.extend(data[1].taxonomy)
			var entries = data[2]

			setupEntries(entries, taxonomy)
		}).catch(toProfilePage)
	}

	refresh()

	function setupEntries(entries, taxonomy) {
		document.getElementById('num-entries').textContent = entries.length.toString()
		var elEntries = document.getElementById('collection-entries')

		while (elEntries.firstChild)
			elEntries.removeChild(elEntries.firstChild)

		entries.forEach(entry => {
			window.api.v1.entry.taxonomy(entry.id).then(classification => {
				var elEntry = el('div.overview-entry', {
					'data-entry-id': entry.id
				}, [
					el('div.entry-type', [entry.type]),
					el('div.entry-title', [`(#${entry.id}) ` +
						(entry.description || entry.reference || entry.DOI)]),
					el('div.entry-tags', 
						Object.keys(classification).map(facet => 
							el('div.entry-tag', [taxonomy.root.dfs(facet).name()])))
				])
	
				elEntry.addEventListener('click', inspectEntry, false)
	
				elEntries.appendChild(elEntry)
			})
		})
	}

	function inspectEntry(evt) {
		var id = this.dataset.entryId

		function removeFromCollection() {
            toggleButtonState()
			window.api.ajax("POST", window.api.host + "/v1/collection/" + cID + "/removeEntry", {
				entryId: id
			})
				.done(() => {
					document.body.removeChild(modal)
					refresh()
				})
				.fail(xhr => alert(xhr.responseText))
		}

        var removeBtn = el("button.btn", ["remove from collection"])
        removeBtn.addEventListener('click', removeFromCollection, false)

		window.api.ajax("GET", window.api.host + "/v1/entry/" + id).done(entry => {
			window.api.ajax("GET", window.api.host + "/v1/entry/" + id + "/taxonomy").done(taxonomy => {
				modals.entryModal(cID,entry, taxonomy, {
                    button: [removeBtn]
				})
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
