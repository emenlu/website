$(function (){

	var modals = window.modals = {}

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
        if (node.classList.indexOf('modal') >= 0 || 
            node.classList.indexOf('confirm') >= 0)
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

    /* Create simple modal */
    modals.confirmPopUp = function(desc, method) {
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

        var modal = el('div.modal', [
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

        // Focus on first input element
        if (obj.input.length > 0) {
            inputboxes[0].focus()
        }
    }
})

// Remove active modal when clicking outside modal
window.addEventListener('load', () => {
	document.body.addEventListener('click', (evt) => {
		if (evt.target.className === "modal")
			document.body.removeChild(evt.target)
	})
}, false)

// Remove confirmation pop up when clicking outside box
window.addEventListener('load', () => {
	document.body.addEventListener('click', (evt) => {
		if (evt.target.className === "confirm")
			document.body.removeChild(evt.target)
	})
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