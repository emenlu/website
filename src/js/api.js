$(function () {

	function ajax(method, url, data) {
		return $.ajax(url, {
			method: method,
			data: data,
			xhrFields: {
				withCredentials: true
			},
			crossDomain: true
		})
	}

	window.api = {
		host: "https://api.serpconnect.cs.lth.se",
		ajax: ajax,
		json: function (method, url, data) {
			return $.ajax(url, {
				method: method,
				data: JSON.stringify(data),
				contentType: "application/json",
				xhrFields: {
					withCredentials: true
				},
				crossDomain: true
			})
		}
	}

	function endpoint(route) {
		return window.api.host + route
	}

	//================================================================
	// API v1
	var v1 = window.api.v1 = {
		account: {},
		entry: {},
		collection: {},
		admin: {}
	}

	// Account API
	v1.account.resetPassword = function (email) {
		return ajax("POST", endpoint("/v1/account/reset-password"), {
			email: email
		})
	}

	// requires logged in, both passwords should be in plaintext
	v1.account.changePassword = function (oldpw, newpw) {
		return ajax("POST", endpoint("/v1/account/change-password"), {
			old: oldpw,
			new: newpw
		})
	}

	v1.account.self = function () {
		return ajax("GET", endpoint("/v1/account/self"))
	}

	v1.account.loggedIn = function () {
		return ajax("GET", endpoint("/v1/account/login"))
	}

	v1.account.collections = function () {
		return ajax("GET", endpoint("/v1/account/collections"))
	}

	v1.account.invites = function () {
		return ajax("GET", endpoint("/v1/account/invites"))
	}

	v1.account.friends = function(email) {
		return ajax("GET", endpoint("/v1/account/friends"), {
			email: email
		})
	}

	v1.account.lookup = function (email) {
		return ajax("GET", endpoint("/v1/account/") + email)
	}

	v1.account.register = function (email, passw) {
		return ajax("POST", endpoint("/v1/account/register"), {
			email: email,
			passw: passw
		})
	}

	v1.account.delete = function () {
		return ajax("POST", endpoint("/v1/account/delete"))
	}

	v1.account.logout = function () {
		return ajax("POST", endpoint("/v1/account/logout"))
	}

	v1.account.login = function (email, passw) {
		return ajax("POST", endpoint("/v1/account/login"), {
			email: email,
			passw: passw
		})
	}

	v1.account.confirmNewPassword = function(passw){
		return ajax("POST", endpoint("/v1/account/reset-password-confirm"), {
			passw: passw
		})
	}

	// Collection API
	v1.collection.create = function (name) {
        return ajax("POST", endpoint("/v1/collection/"), {
            name: name
		});
	}

	v1.collection.invite = function(email, id,emailofinviter){
	    return ajax("POST", endpoint("/v1/collection/" + id + "/invite"), {
            email: email,
						inviterEmail: emailofinviter

		});
	}

	v1.collection.leave = function(cID) {
		return ajax("POST", endpoint("/v1/collection/" + cID + "/leave"))
	}

	v1.collection.addEntry = function(cid, eid){
		return ajax("POST", endpoint("/v1/collection/" + cid + "/addEntry"), {
			entryId: eid
		})
	}

	v1.collection.stats = function(id){
		return ajax("GET", endpoint("/v1/collection/" + id + "/stats"))
	}

	v1.collection.members = function (id, q) {
		return ajax("GET", endpoint("/v1/collection/" + id + "/members"), {q:q})
	}

	v1.collection.url = function(cID){
		return endpoint("/v1/collection/" + cID + "/addEntry")
	}

	// Admin API
	v1.admin.acceptEntry = function (id) {
		return ajax("POST", endpoint('/v1/admin/accept-entry'), {
            entry : id
        })
	}

    v1.admin.rejectEntry = function (id) {
		return ajax("POST", endpoint('/v1/admin/reject-entry'), {
            entry : id
        })
	}

    v1.admin.pending = function () {
        return ajax("GET", endpoint("/v1/admin/pending"))
    }

    //
    v1.entry.taxonomy = function (id) {
        return ajax("GET", endpoint(`/v1/entry/${id}/taxonomy`))
    }

	// Root API
	v1.getEntry = function (id){
		return ajax("GET", endpoint("/v1/entry/") + id)
	}

	v1.getTaxonomyEntry = function (id){
		return ajax("GET", endpoint("/v1/entry/" + id + "/taxonomy"))
	}

})
