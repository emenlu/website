$(function () {
	var toProfilePage = () => window.location = "/profile.html"
	var collectionName;
	var friends =[]
	var userEmail = "undefined"

	// Only allow user to inspect specific collection
	if (window.location.hash.length === 0)
		toProfilePage()

	// http://serpconnect.cs.lth.se/collection.html#33
	var cID = window.location.hash.substring(1)

	function updateLink(el) {
		el.setAttribute('href', `${el.getAttribute('href')}#${cID}`)
	}

	['general', 'users','taxonomy-tab', 'entries'].forEach(id => updateLink(document.getElementById(id)))

	function refresh(){
		api.v1.collection.members(cID, "all")
            .done(setupMembers)
			.fail(toProfilePage)
	}

	refresh()

	function setupMembers(members) {
		$('#members')
			.empty()
			.append(members.map(member => {
				return $('<div>').addClass('')
					.data('user-email', member.email)
					.data('user-id', member.id)
					.append([
						$('<span>').addClass('').text(member.email),
				])
			}))
	}

   	function inviteUser(evt) {
   		window.components.inviteUserModal(cID, friends).then(refresh)
    }

	function kickUser(evt) {
		api.v1.collection.members(cID, "all")
			.then(members => members.map(user => user.email))
			.then(emails => emails.filter(email => email !== userEmail))
			.then(emails => {
				return window.components.fuzzyKickUserModal(cID, emails)
			}).then(what => what.then ? what.then(refresh) : refresh())
	}

    window.api.v1.account.self()
        .then(function (self) {
			userEmail = self.email
    		return window.api.v1.account.friends(self.email)
		}).then(function (myFriends) {
			friends = myFriends
			return window.api.v1.account.collections()
		}).then(function (collections) {
			collections.forEach(collection => {
				if (collection.id === Number(cID)){
					collectionName = collection.name
				}
			})
			return window.api.v1.collection.isOwner(cID)
		}).then(function (owner) {
			if (!owner)
				return
			$('.user-options').append(
				$('<button>').addClass('btn').text('kick user').click(kickUser)
			).append(
				$('<button>').addClass('btn').text('invite user').click(inviteUser)
			)
		})
        .fail(toProfilePage)

})