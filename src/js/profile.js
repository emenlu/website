$(function() {
    //stores friends emails of the logged in user
    var friends = [];
    var useremail;
    /* Add red text after the cancel button on a modal */
    function complain(text) {
        $('.modal-complaint').remove()
        var modal = document.querySelector(".modal") || document.querySelector(".confirm")
        var errors = modal.querySelectorAll('button')
        var error = errors[errors.length - 1]
        var complaint = el('div.modal-complaint', [text])
        error.parentNode.insertBefore(complaint, error.nextSibling)
    }

    function cleanup(modal) {
        modals.clearAll()
        api.v1.account.self().done(update)
    }

    var deleteAccountModal = {
        desc: "Delete Account",
        message: "This will delete your account, but your collections and entries will remain. Are you sure?",
        input: [],
        btnText: "Delete"
    };

    // Let user confirm account deletion before commencing orbital strike
    $("#delete").click(evt => {
        window.modals.optionsModal(deleteAccountModal, function () {
            //A secondary box pops up to imply importance of the decision
            var message = "Delete Account - Are You Sure"
            window.modals.confirmPopUp(message, function ok() {
                window.user.delete()
                    .done(ok => window.location = "/")
                    .fail(xhr => complain(xhr.responseText))
            })
        })
    })

    var newCollectionModal = {
        desc: "create new collection",
        message: "",
        input: [['input0','text','collection name']],
        btnText: "Create"
    };

    // Create a new collection
    $("#create").click(evt => {
        window.modals.optionsModal(newCollectionModal, function (name) {
            api.v1.collection.create(name)
                .done(ok => cleanup(this.modal))
                .fail(xhr => complain(xhr.responseText))
        })
    })

    // Change password dialog, must submit current and new passwords to api
    var newPasswordModal = {
        desc: "Change your password",
        message: "",
        input: [['input0','password','old password'], ['input1','password','new password']],
        btnText: "Save"
    };

    $("#change").click(evt => {
        window.modals.optionsModal(newPasswordModal,function (oldpw, newpw) {
            api.v1.account.changePassword(oldpw, newpw)
                .done(ok => cleanup(this.modal))
                .fail(xhr => complain(xhr.responseText))
        })
    })

    function invite(evt) {
        var parent = this.parentNode.parentNode.parentNode
        var id = parent.dataset.collectionId
        var name = parent.querySelector('.collection-title').textContent

        var inviteUserModal = {
            desc: "Invite User to " + name,
            message: "",
            input: [['input0','email','user email']],
            btnText: "Invite"
        }

        window.modals.optionsModal(inviteUserModal,function (email) {
          api.v1.collection.invite(email, id,useremail)
              .done(ok => cleanup(this.modal))
              .fail(xhr => complain(xhr.responseText))

        })

        new Awesomplete('#input0', { 
                        list: friends, 
                        filter: ausomplete.autocompleteFilter, 
                        replace: ausomplete.autocompleteUpdate
                })
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

    function collectionOption(name, callback) {
        var option = el('div.collection-option', [name])
        option.addEventListener('click', callback, false)
        return option
    }

    /* X member(s), Y entr(y|ies) */
    function formatStats(members, entries) {
        var mems = members === 1 ? "member" : "members"
        var entr = entries === 1 ? "entry" : "entries"

        return `${members} ${mems}, ${entries} ${entr}`
    }

    function appendCollection(self, coll) {
    	var obj = el('div.collection-wrapper', [
			el('div.collection-info', [
    			el('a.collection-title', {href: "/collection.html#" + coll.id}, [
                    el('span', [coll.name]),
                    el('span.collection-id', [" #" + coll.id])
                ]),
    			el('div.collection-stats', [formatStats(coll.members, coll.entries)])
    		]),
            el('div.collection-options', [
                el('div.collection-row', [
                    collectionOption('search', search),
                    collectionOption('explore', explore),
                    collectionOption('manage', manage)
                ]),
                el('div.collection-row', [
                    collectionOption('add user', invite),
                    collectionOption('add entry', submit)
                ])
            ])
		])

		obj.dataset.collectionId = coll.id
    	document.querySelector(".profile-content").appendChild(obj)
    }

    function update(self) {
        useremail = self.email;
        $(".user-email").text(`${self.email} (${self.trust})`)
        $("div.collection-wrapper").remove()

        self.collections.forEach(coll => {
            api.v1.collection.stats(coll.id).then(data => {
                coll.members = data.members
                coll.entries = data.entries
                appendCollection(self, coll)
            })
        })

        api.v1.account.friends(self.email).done(data => friends = data)
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
    }

    // Load logged in user and proceed to setup otherwise redirect to login
    api.v1.account.self()
        .done(setup)
        .fail(xhr => window.location = "/login.html")

    $("#profile").addClass("current-view");
})
