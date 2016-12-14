$(document).ready(function() {

	var modals = window.modals = {}
	var modalAnimation = 121

// Modal Template
	// var modalObject = {  
 //            desc: "create new collection",
 //            message: "",
 //            //single string message that goes above input boxes
 //            input: [['input0','text','e.g new password'],['input0','text','e.g old password']],
 //            //[textbox names, types, placeholder] //else put '[]'
 //            //automatically takes input[0] as first parameter for method passed in.. etc
 //            btnText: "Create"
 //            //text on button
 //        };
 //        // Create a new collection

    function findModal(node) {
        if (node.classList.contains('modal') || 
            node.classList.contains('confirm'))
            return node
        else
            return findModal(node.parentNode)
    }
    
    function removeModal(evt) {
        // Close button is located in: div > div > closeBtn
        // but we cannot be sure of this, so loop upwards
        // until we find parent that is a modal.

        var modal = findModal(this.parentNode)
        document.body.removeChild(modal)
    }

    function closeButton() {
        var btn = el('div.close-btn', [''])
        btn.addEventListener('click', removeModal, false)
        return btn
    }

    function cancelButton() {
        var btn = el('button.btn', ['cancel'])
        btn.addEventListener('click', removeModal, false)
        return btn
    }

	modals.exportModal = function(selectedEntries, collections) {
       	var options = []
       	var index = Object.keys(collections)
       	var editBtn = el('div.edit-btn', ['use existing'])
       	var createBtn = el('div.edit-btn', ['create new'])
       	var input = el("input#exportInput.large-input", {
			placeholder: 'new collection name',
			type: 'text',
			name: 'input'
		})

       	var select = el("select#exportSelect", [
			index.map(idx => el("option", {
				value: collections[idx].id,
				name: collections[idx].name,
				text: collections[idx].name
			}))
		])

		var modal = el('div#modal.modal', [
			el('div', [
				el('div.modal-entry-type', ['export entries (' + selectedEntries.length + ')']),
				closeButton(),
				el('div.modal-header-title', ['select collection']),
				el("div.modal-divider"),
				input,
				createBtn,
				el("div.modal-divider"),
				select, editBtn
			])	
		])

		function submitToCollection(cID) {
            var url = window.user.collectionUrl(cID)
            selectedEntries.forEach(eID => {
            	window.user.putIntoCollection(url, eID)
            })
            document.body.removeChild(modal)
        }

		createBtn.addEventListener('click', (evt) => {
		  	window.user.createCollection($('#exportInput').val())
               .done(cID => {
                submitToCollection(cID.id)
            })
	    })

		editBtn.addEventListener('click', (evt) => {
		    submitToCollection($('#exportSelect').val())
	    })
		
		setTimeout(function(){
			document.getElementById('modal').classList.add('appear');
		}, modalAnimation)
        document.body.appendChild(modal)
	}

	/* Inspect facets modal */
	modals.infoModal = function(facet, unique) {
		var facets = unique.map(uniq => el("li.modal-li", [uniq]))

		var modal = el('div#modal.modal', [
			el('div', [
				el('div.modal-entry-type', ['inspecting entities']),
				closeButton(),
				el('div.modal-header-title', [facet]),
				el("div.modal-divider"),
				el('ul.modal-ul'),
				facets,
				el('ul.modal-ul')
			])	
		])

        document.body.appendChild(modal)
        setTimeout(function(){
			document.getElementById('modal').classList.add('appear');
		}, modalAnimation)
	 }

	/* Create a modal that displays contents of an entry & an edit button */
	modals.entryModal = function(entry, taxonomy) {
       	var editBtn = el('button#editBtn.edit-btn', ['edit'])
		var modal = el('div#modal.modal', [
			el('div',[
				el('div.modal-entry-type', [entry.type]),
				closeButton(),
				el('div.modal-header-title', [`entry #${entry.id}`]),
				el("div.modal-divider"),
				window.central.constructFacet(taxonomy, "Intervention"),
				window.central.constructFacet(taxonomy, "Effect"),
				window.central.constructFacet(taxonomy, "Scope"),
				window.central.constructFacet(taxonomy, "Context"),
				el("div.modal-divider"),
				entry.type === "challenge" ? [
					el('div.modal-header-title', ['Description']),
					el('div.modal-sub-item', [entry.description]),
					el("div.modal-divider")
				] : [
					el('div.modal-header-title', ['References']),
					el('div.modal-sub-item', [entry.reference]),
					el('div.modal-header-title', ['DOI']),
					el('div.modal-sub-item', [entry.doi]),
					el("div.modal-divider")
				],
				editBtn
			])	
		])

		editBtn.addEventListener("click", function(evt) {
            $(".modal").remove();
            window.location = `/submit.html?e=${entry.id}`;
        });
	    
	    document.body.appendChild(modal)
        setTimeout(function(){
			document.getElementById('modal').classList.add('appear');
		}, modalAnimation)
	 }

	/* Create simple modal */
    modals.confirmPopUp = function(desc, method) {
 		var closeBtn = el('div.close-btn', [''])
 		var confirmBtn = el('button#confirm.btn', ['confirm'])
 		
 		var modal = el('div.confirm', [
            el('div', [
                closeButton(),
	            el("div.confirm-header-title", [desc]),
	            //name of modal
	            el("div#bottom-divider.confirm-divider"),
	            confirmBtn, cancelButton()
	        ]) 
        ])

        confirmBtn.addEventListener('click', (evt) => {
            method.apply({modal})
        })

        document.body.appendChild(modal)	
	 }

    /**
     * Create configurable modal.
     *
     * obj = {
     *     desc   : 'description',
     *     message: 'message',
     *     input  : [inputConf, ..., inputConf],
     *     btnText: 'ok button text'
     * }
     * 
     * inputConf = [input-name, input-type, input-placeholder]
     * 
     * Method is called when ok button is clicked. It is called
     * with modal as context and input values are arguments.
     * 
     **/     
    modals.optionsModal = function(obj, method) {
        var message = [el("div.modal-sub-item", [obj.message])]

        var inputboxes = obj.input.map((conf, i) => {
            return el(`input#input${i}.modal-input-box`, {
                name: conf[0],
                type: conf[1],
                placeholder: conf[2]
            })
        })

        //creates optional button
        var button1 = el('button.btn', [obj.btnText])

        var modal = el('div#modal.modal', [
            el('div', [
                closeButton(),
                el("div.modal-header-title", [obj.desc]),
                //name of modal

                el("div.modal-divider"),
                message,
                inputboxes,
                
                el("div#bottom-divider.modal-divider"),
                button1, cancelButton()
            ]) 
        ])

        button1.addEventListener('click', (evt) => {
            //maybe apply toggleButtonState() ??
            var args = inputboxes.map(input => input.value)
            method.apply({modal}, args)
        })

        document.body.appendChild(modal)
		setTimeout(function() {
			document.getElementById('modal').classList.add('appear');
		}, modalAnimation)

        // Focus on first input element
        if (obj.input.length > 0) {
            inputboxes[0].focus()
        }
    }
})

// Remove active modal when clicking outside modal
window.addEventListener('load', () => {
	document.body.addEventListener('click', (evt) => {
		var remove = evt.target.classList.contains('modal') || 
					 evt.target.classList.contains('confirm')
		if (remove)
			document.body.removeChild(evt.target)
	}, false)

	// Remove active modals when pressing ESC
	document.addEventListener('keydown', (evt) => {
		if (evt.keyCode !== 27)
			return

		var modal = document.querySelector('.modal')
		if (modal)
			modal.parentNode.removeChild(modal)

		var confirm = document.querySelector('.confirm')
		if (confirm)
			confirm.parentNode.removeChild(confirm)
	}, false)
}, false)

