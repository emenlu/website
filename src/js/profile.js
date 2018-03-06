$(function() {
    //stores friends emails of the logged in user
    var friends = []
    var userData = undefined

    // Display a small banner if user has pending invitations.
    api.v1.account.invites().done(showInvites)
    function showInvites(invites) {
        if (invites.length > 0) {
            var div = el('div.invitationContainer', [
                el('div.newInvitation', {
                    href: '/invitations.html'
                }, [invites.length.toString()])
            ])
            document.querySelector("[href='/invitations.html']").appendChild(div)
         }
    }

    // Display a small banner if user has pending invitations.
    function showPendingEntries(entries) {
        if (entries.length > 0) {
            var div = el('div.invitationContainer', [
                el('div.newInvitation', {
                    href: '/entries.html'
                }, [entries.length.toString()])
            ])
            document.querySelector("[href='/entries.html']").appendChild(div)
         }
    }

    function reloadUser() {
        if (!userData) return
        loadUserData.done(data => update(data[0], data[1]))
    }

    // Let user confirm account deletion before commencing orbital strike
    $("#delete").click(evt => {
        window.components.deleteAccountModal(userData.email).then(ok => window.location = "/")
    })

    // Create a new collection
    $("#create").click(evt => {
        window.components.createCollectionModal().then(setupCollection)
    })

    $("#change").click(evt => {
        window.components.changePasswordModal()
    })

    function invite(evt) {
        var id = getId(this.parentNode)
        window.components.inviteUserModal(id, friends)
    }

    function kick(evt) {
        var id = getId(this.parentNode)

        api.v1.collection.members(id, "all")
            .then(data => {
                return data.map(u => u.email).filter(e => e != userData.email)
            }).then(emails => {
                return window.components.fuzzyKickUserModal(id, emails)
            }).then(what => what.then ? what.then(reloadUser) : reloadUser())
    }

    function submit(evt) {
        var id = getId(this.parentNode)
        window.location = window.location.origin + "/submit.html?c=" + id
    }

    function search(evt) {
        var id = getId(this.parentNode)
        window.location = window.location.origin + "/search.html#" + id
    }

    function explore(evt) {
          var id = getId(this.parentNode)
        window.location = window.location.origin + "/explore.html#" + id
    }

    function manage(evt) {
        var id = getId(this.parentNode)
        window.location = window.location.origin + "/collection.html#" + id
    }

    function getId(parent){
        while (parent.className !== 'collection-wrapper')
            parent = parent.parentNode
        return parent.dataset.collectionId
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

    function appendCollection(self, coll, isOwner) {
        var ownerActions = el('div.collection-row', [
             collectionOption('add user', invite),
             collectionOption('kick user', kick)
        ])
        var myActions = el('div.collection-row', [
            collectionOption('manage', manage),
            collectionOption('add entry', submit),
        ])

    	var obj = el('div.collection-wrapper', [
			el('div.collection-info', [
    			el('a.collection-title', {href: "/collection.html#" + coll.id}, [
                    el('span', [coll.name]),
                    el('span.collection-id', [" #" + coll.id]),
                    el('span.collection-owner',[isOwner ? " (owner)" : ""])
                ]),
    			el('div.collection-stats', [formatStats(coll.members, coll.entries)])
    		]),
            el('div.collection-options', [
                el('div.collection-row', [
                    collectionOption('search', search),
                    collectionOption('explore', explore),
                ]),
                myActions,
                isOwner ? ownerActions : undefined
            ])
		])
		  obj.dataset.collectionId = coll.id
      document.querySelector("div.my-collections-container").appendChild(obj)


    }

    function setupCollection(coll) {
        api.v1.collection.stats(coll.id).then(data => {
            coll.members = data.members
            coll.entries = data.entries
        }).then(function(){
            return api.v1.collection.isOwner(coll.id)
        }).then(owner => {
            appendCollection(userData, coll, owner)
        })
    }

    function update(self, collections) {
        userData = self
        userData.collections = collections
        
        $(".user-email").text(`${userData.email} (${userData.trust})`)

        $("div.collection-wrapper").remove()
        document.querySelector(".profile-content")
            .appendChild(el('div.my-collections-container'))

        userData.collections.forEach(setupCollection)
        api.v1.account.friends(userData.email).done(data => friends = data)
    }

    function setup(self, collections) {
        if (self.trust === "Admin") {
            var a = el('a.view-area-tab.unactive-tab', {href : "/users.html"}, ['users'])
            var b = el('a.view-area-tab.unactive-tab', {href : "/entries.html"}, ['pending entries'])
            var c = el('a.view-area-tab.unactive-tab', {href : "/collections.html"}, ['all collections'])
            var div = document.querySelector('.profile-area-wrapper')
            div.insertBefore(a, div.lastChild)
            div.insertBefore(b, div.lastChild)
            div.insertBefore(c, div.lastChild)
            api.v1.admin.pending().done(showPendingEntries)
        }
        update(self, collections)
    }

    function loadUserData() {
        return Promise.all([
            api.v1.account.self(),       /* fetches all collections */
            api.v1.account.collections() /* fetches collections for current project */
        ])
    }

    // Load logged in user and proceed to setup otherwise redirect to login
    loadUserData().then(data => {
        setup(data[0], data[1])
    }).catch(xhr => window.location = "/login.html")

    $("#profile").addClass("current-view");
})
