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
 	modals.confirmPopUp = function(desc, method){
 		var closeBtn = el('div.close-btn', [''])
 		var confirmBtn = el('button#confirm.btn', ['confirm'])
 		var cancel = el('button.btn', ['cancel'])

 		var modal = el('div.confirm', [el('div', [
	        	closeBtn,
	            el("div.confirm-header-title", [desc]),
	            //name of modal
	            el("div#bottom-divider.confirm-divider"),
	            confirmBtn, cancel
	        ]) ])

 			cancel.addEventListener('click', (evt) => {
	            document.body.removeChild(modal)
	        }, false)

	        confirmBtn.addEventListener('click', (evt) => {
		      	method.apply({modal} )
	        })

	        function destroy() {
				document.body.removeChild(modal)
			}

	       	closeBtn.addEventListener('click', destroy, false)

			// Remove active modal when pressing ESC
		    document.addEventListener('keydown', (evt) => {
		    	if (evt.keyCode === 27) {
		    		var modal = document.querySelector('.confirm')
		    		if (!modal) return
		    		document.body.removeChild(modal)
		    	}
		    }, false)

	        document.body.appendChild(modal)

	        if(modal.querySelector('input')){
	        	focus()
	        }
	 }

	 //adds entries to a modal and returns the id of the entry that got clicked
	 modals.listModal = function(obj, method) {

 	        var parameters =[]
 	        var options =[]
 	        var message = [el("div.modal-sub-item", [obj.message])]
 	        var closeBtn = el('div.close-btn', [''])
 	        // The X in the top-right corner

					var i=0;
					obj.input.forEach(entry => {;
							var elEntry = el('div.modal-option-li', {
								'data-entry-id': entry.id
							}, [entry.description || entry.reference || entry.DOI])

							elEntry.addEventListener('click', (evt) => {
									var args=[];
									args[0]=entry.id;
									document.body.removeChild(modal)
								method.apply({modal}, args)
		 	        });
							options[i]=elEntry;
							i++;
					});
 	        var cancel = el('button#cancel.btn', ['cancel'])
 	          //cancel button is a standard feature
 	        var modal = el('div.modal', [el('div', [
 	        	closeBtn,
 	            el("div.modal-header-title", [obj.desc]),
 	            //name of modal

 	            el("div.modal-divider"),
 	            message,
 		        options,

 	            el("div#bottom-divider.modal-divider"),
 	            cancel
 	        ]) ])
 	        cancel.addEventListener('click', (evt) => {
 	            document.body.removeChild(modal)
 	        }, false)
 	        function destroy() {
 				document.body.removeChild(modal)
 			}

 	       	closeBtn.addEventListener('click', destroy, false)

 			// Remove active modal when pressing ESC
 		    document.addEventListener('keydown', (evt) => {
 		    	if (evt.keyCode === 27) {
 		    		var modal = document.querySelector('.modal')
 		    		if (!modal) return
 		    		document.body.removeChild(modal)
 		    	}
 		    }, false)

 	        document.body.appendChild(modal)

 	        if(modal.querySelector('input')){
 	        	focus()
 	        }
 	 }

	modals.optionsModal = function(obj, method) {

	        var parameters =[]
	        var inputboxes =[]
	        var message = [el("div.modal-sub-item", [obj.message])]
	        var closeBtn = el('div.close-btn', [''])
	        // The X in the top-right corner

	        for(i=0;i<obj.input.length;i++){
	    			inputboxes[i] =
	    			[el("input#"+"input"+i+".modal-input-box", {
		                placeholder: obj.input[i][2],
		                type: obj.input[i][1],
		                name: obj.input[i][0]
	        		})]
	        		// parameters[i] = $('#input'+i)
	    		}
	    	// console.log(parameters)
	        var button1 = el('button.btn', [obj.btnText])
	        //creates optional button
	        var cancel = el('button#cancel.btn', ['cancel'])
	          //cancel button is a standard feature
	        var modal = el('div.modal', [el('div', [
	        	closeBtn,
	            el("div.modal-header-title", [obj.desc]),
	            //name of modal

	            el("div.modal-divider"),
	            message,
		        inputboxes,

	            el("div#bottom-divider.modal-divider"),
	            button1, cancel
	        ]) ])

	        cancel.addEventListener('click', (evt) => {
	            document.body.removeChild(modal)
	        }, false)

	        button1.addEventListener('click', (evt) => {
		      	var args = []
		      	for(i=0;i<obj.input.length;i++){
		    			args[i] = $('#input'+i)[0].value
		    		}
		    	//maybe apply toggleButtonState()??
		      	method.apply({modal}, args)
		      	//put parameters into method
	        })

	        function destroy() {
				document.body.removeChild(modal)
			}

	       	closeBtn.addEventListener('click', destroy, false)

			// Remove active modal when pressing ESC
		    document.addEventListener('keydown', (evt) => {
		    	if (evt.keyCode === 27) {
		    		var modal = document.querySelector('.modal')
		    		if (!modal) return
		    		document.body.removeChild(modal)
		    	}
		    }, false)

	        document.body.appendChild(modal)

	        if(modal.querySelector('input')){
	        	focus()
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
