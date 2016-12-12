$(function() {
    // Load logged in user and proceed to setup otherwise redirect to login
    window.user.self().done(setup).fail(toLogin)
    //stores friends emails of the logged in user
    var friends = [];
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

    // Easy { 'ok?', 'cancel' } type of popup
    function confirmModal(title, desc, btnText, callb) {
        var confirm = el('button.btn', [btnText])
        var cancel = el('button.btn', ['cancel'])

        var modal = el('div.modal', [el('div', [
            el("div.modal-header-title", [title]),
            el("div.modal-divider"),
            el("div.modal-sub-item", [desc]),
            el("div.modal-divider"),
            confirm, cancel
        ])])

        cancel.addEventListener('click', (evt) => {
            document.body.removeChild(modal)
        }, false)

        confirm.addEventListener('click', (evt) => {
            toggleButtonState()
            callb()
        })

        document.body.appendChild(modal)
    }

    // We are on profile page (#login is a sham)
   // $("#login").addClass("current-view")

    // Logout user when logout button was clicked
    //old logout button
    //$("#logout").click(evt => window.user.logout().done(toLogin))

    // Let user confirm account deletion before commencing orbital strike
    $("#delete").click(evt => {
		var warning = "This will delete your account, but your collections and entries will remain. Are you sure?"

		var deleteModal = new window.modal(
			[el('div.modal-header-title', ['delete account'])],
			[el('div.modal-sub-item', [warning])]
		)

		deleteModal.confirm("delete", () => {
			deleteModal.toggleButtonState()
			window.user.delete().done(toLogin)
		})
		deleteModal.cancel("cancel").show()
    })

    // Create a new collection
    $("#create").click(evt => {
        var create = el('button.btn', ['create'])
        var cancel = el('button.btn', ['cancel'])

        var modal = el('div.modal', [el('div', [
            el("div.modal-header-title", ["create new collection"]),
            el("div.modal-divider"),
            el('input#name.submit-input-box', {
                placeholder: 'collection name',
                type: 'text',
                name: 'name'
            }),
            el("div.modal-divider"),
            create, cancel
        ])])

		var createCollection = new window.modal(
			el('div.modal-header-title', ["create new collection"]),
            el('input#name.submit-input-box', {
                placeholder: 'collection name',
                type: 'text',
                name: 'name'
            })
		)
		createCollection.cancel("cancel")
		createCollection.confirm('create', (evt) => {
			createCollection.toggleButtonState()

            window.api.ajax("POST", window.api.host + "/v1/collection/", {
                name: document.getElementById('name').value
            })
                .done(ok => {
                    document.body.removeChild(modal)
                    window.user.self().done(update)
                })
                .fail(xhr => {
                    $('.complaint').remove()
                    var old = document.getElementById('name')
                    old.parentNode.insertBefore(el('div.complaint', [
                        xhr.responseText
                    ]), old.nextSibling)
                    modal.toggleButtonState()
                })
		})
		createCollection.show()
        document.getElementById('name').focus()
    })

    // Change password dialog, must submit current and new passwords to api
    $("#change").click(evt => {
        var save = el('button.btn', ['save'])
        var cancel = el('button.btn', ['cancel'])

        var modal = el('div.modal', [el('div', [
            el("div.modal-header-title", ["change password"]),
            el("div.modal-divider"),
            el('input#old.submit-input-box', {
                placeholder: 'old',
                type: 'password',
                name: 'old',
            }),
            el('input#new.submit-input-box', {
                placeholder: 'new',
                type: 'password',
                name: 'new'
            }),
            el("div.modal-divider"),
            save, cancel
        ])])

        cancel.addEventListener('click', (evt) => {
            document.body.removeChild(modal)
        }, false)

        save.addEventListener('click', (evt) => {
            toggleButtonState()
            window.api.ajax("POST", window.api.host + "/v1/account/change-password", {
                old: $('#old').val(),
                new: $('#new').val()
            }).done(ok => document.body.removeChild(modal))
            .fail(xhr => {
                $('.complaint').remove()
                var old = document.getElementById('old')
                old.parentNode.insertBefore(el('div.complaint', [xhr.responseText]), old.nextSibling)
                toggleButtonState()
            })
        }, false)
        document.body.appendChild(modal)
        modal.querySelector('input').focus()
    })

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

    function toLogin() {
    	window.location = "/login.html"
    }

    function invite(evt) {
        var parent = this.parentNode.parentNode.parentNode
        var id = parent.dataset.collectionId
        var name = parent.querySelector('.collection-title').textContent
      //  alert("this is right button");
        var send = el('button.btn', ['send'])

        var cancel = el('button.btn', ['cancel'])
        var modal = el('div.modal', [el('div#modal', [
            el("div.modal-entry-type", [String(name)]),
            el("div.modal-header-title", ["send invite"]),
            //el("class","ui-front"),
            el("div.modal-divider"),
            el('input#email.submit-input-box', {
                placeholder : 'user email',
                type : 'email',
                name : 'email'
              //  id: "test"
            }),
            el("div.modal-divider"),
            send, cancel
        ])])

        cancel.addEventListener('click', (evt) => {
            document.body.removeChild(modal)
        }, false)

        send.addEventListener('click', (evt) => {
            toggleButtonState()

            window.api.ajax("POST", window.api.host + "/v1/collection/" + id + "/invite", {
                email: $('#email').val(),
            })
                .done(ok => {
                    document.body.removeChild(modal)
                    window.user.self().done(update)
                })
                .fail(xhr => {
                    $('.complaint').remove()
                    var div = document.getElementById('name')
                    div.parentNode.insertBefore(el('div.complaint', [
                        xhr.responseText
                    ]), div.nextSibling)
                    toggleButtonState()
                })
        }, false)

        document.body.appendChild(modal)
        $("#email").autocomplete({
          source: friends,
          appendTo: "#modal"
        });
        modal.querySelector('input').focus()
    }

    function submit(evt) {
        var id = this.parentNode.parentNode.parentNode.dataset.collectionId
        window.location = window.location.origin + "/submit.html?c=" + id
    }

    function search(evt) {
        var id = this.parentNode.parentNode.parentNode.dataset.collectionId
        window.location = window.location.origin + "/search.html#" + id
    }

    function explore(evt) {
        var id = this.parentNode.parentNode.parentNode.dataset.collectionId
        window.location = window.location.origin + "/explore.html#" + id
    }

    function manage(evt) {
        var id = this.parentNode.parentNode.parentNode.dataset.collectionId
        window.location = window.location.origin + "/collection.html#" + id
    }

    function appendCollection(self, coll) {
    	var addUser = el('div.collection-option', ['add user'])
        var addEntry = el('div.collection-option', ['add entry'])
        var manageCollection = el('div.collection-option', ['manage'])
        var showCollection = el('div.collection-option', ['search'])
    	var exploreCollection = el('div.collection-option', ['explore'])

        addUser.addEventListener('click', invite, false)
        addEntry.addEventListener('click', submit, false)
    	manageCollection.addEventListener('click', manage, false)
        showCollection.addEventListener('click', search, false)
    	exploreCollection.addEventListener('click', explore, false)

    	var obj = el('div.collection-wrapper', [
			el('div.collection-info', [
    			el('div.collection-title', [coll.name]),
    			el('div.collection-stats', [
                    `${coll.members} user${coll.members === 1 ? '' : 's'}, ${coll.entries} entr${coll.entries === 1 ? 'y' : 'ies'}`
                ])
    		]),
            el('div.collection-options', [
                el('div.collection-row', [
                    showCollection,
                    exploreCollection,
                    manageCollection
                ]),
                el('div.collection-row', [
                    addUser,
                    addEntry
                ])
            ])
		])
		obj.dataset.collectionId = coll.id

    	$(".profile-content").append(obj)
    }

    function update(self) {
        $(".user-email").text(self.email + " (" + self.trust + ")")
        $("div.collection-wrapper").remove()
        self.collections.forEach(coll => {
            window.api.ajax("GET", window.api.host + `/v1/collection/${coll.id}/stats`)
                .then(data => {
                    coll.members = data.members
                    coll.entries = data.entries
                    appendCollection(self, coll)
                })
        })
    }

    function setup(self) {
        update(self)
        if (self.trust === "Admin") {
            var a = el('a.view-area-tab.unactive-tab', {href : "/users.html"}, ['users'])
            var b = el('a.view-area-tab.unactive-tab', {href : "/entries.html"}, ['pending entries'])
            var div = document.querySelector('.profile-area-wrapper')
            div.insertBefore(a, div.lastChild)
            div.insertBefore(b, div.lastChild)
        }
        window.user.friends(self.email).done(data =>{
          friends = data;
        })
    }

})
