$(function () {
    var project = 'serp';

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

    function json(method, url, data) {
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

    window.api = {
        host: "https://api.serpconnect.cs.lth.se",
        ajax: ajax,
        json: json
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
        admin: {},
        project: {}
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
        return ajax("GET", endpoint("/v1/account/collections"), { project: project })
    }

    v1.account.invites = function () {
        return ajax("GET", endpoint("/v1/account/invites"), { project: project })
    }

    v1.account.friends = function (email) {
        return ajax("GET", endpoint("/v1/account/friends"), {
            email: email
        })
    }

    v1.account.lookup = function (email) {
        return ajax("GET", endpoint("/v1/account/") + email)
    }

    v1.account.projects = function () {
        return ajax("GET", endpoint("/v1/account/projects"))
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

    v1.account.confirmNewPassword = function (passw) {
        return ajax("POST", endpoint("/v1/account/reset-password-confirm"), {
            passw: passw
        })
    }

    // Collection API
    v1.collection.create = function (name) {
        return ajax("POST", endpoint("/v1/collection/"), {
            name: name,
            project: project
        });
    }

    v1.collection.project = function (id) {
        return ajax("GET", endpoint("/v1/collection/" + id + "/project"))
    }

    v1.collection.invite = function (email, id) {
        return ajax("POST", endpoint("/v1/collection/" + id + "/invite"), {
            email: email
        });
    }

    v1.collection.kick = function(email, id){
        return ajax("POST", endpoint("/v1/collection/" + id + "/kick"), {
            email: email
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

    v1.collection.memberOf = function (id) {
        return ajax("GET", endpoint("/v1/collection/" + id + "/"))
    }

    v1.collection.url = function(cID){
        return endpoint("/v1/collection/" + cID + "/addEntry")
    }

    v1.collection.isOwner = function(cID){
        return ajax("GET", endpoint("/v1/collection/" + cID + "/is-owner"))
    }

    v1.collection.entries = function(cID){
        return ajax("GET", endpoint("/v1/collection/" + cID + "/entries"))
    }

    v1.collection.entities = function(cID){
        return ajax("GET", endpoint("/v1/collection/" + cID + "/entities"))
    }

    v1.collection.graph = function(cID){
        return ajax("GET", endpoint("/v1/collection/" + cID + "/graph"))
    }

    v1.collection.classification = function (cID) {
        return ajax("GET", endpoint("/v1/collection/" + cID + "/classification"))
    }

    v1.collection.taxonomy = function(cid, extension) {
        if (extension)
            return json("PUT", endpoint(`/v1/collection/${cid}/taxonomy`) , extension)
        else
            return ajax("GET", endpoint(`/v1/collection/${cid}/taxonomy`))
    }

    // Admin API
    v1.admin.acceptEntry = function (id) {
        return ajax("POST", endpoint('/v1/admin/accept-entry'), {
            entry : id
        })
    }

    v1.admin.rejectEntry = function (id) {
        return ajax("POST", endpoint('/v1/admin/reject-entry'), {
            entry: id
        })
    }

    v1.admin.collectionsOwnedBy = function (email) {
        return ajax("GET", endpoint('/v1/admin/collections-owned-by'), {
            email: email
        })
    }

    v1.admin.deleteUser = function (email) {
        return ajax("POST", endpoint('/v1/admin/delete-user'), {
            email: email
        })
    }

    v1.admin.deleteEntry = function (id) {
        return ajax("POST", endpoint('/v1/admin/delete-entry'), {
            entryId: id
        })
    }

    v1.admin.users = function () {
        return ajax("GET", endpoint('/v1/admin/users'))
    }

    v1.admin.pending = function () {
        return ajax("GET", endpoint("/v1/admin/pending"))
    }

    v1.admin.isCollectionOwner = function (cID){
        return ajax("GET", endpoint("/v1/admin/" + cID + "/is-collection-owner"))
    }

    v1.admin.deleteCollection = function (cID) {
        return ajax("POST", endpoint("/v1/admin/delete-collection"), {
            id: cID
        })
    }
    //
    v1.entry.all = function () {
        return ajax("GET", endpoint("/v1/entry"), { project: project })
    }

    v1.entry.get = function (id) {
        return ajax("GET", endpoint("/v1/entry/") + id)
    }

    v1.entry.taxonomy = function (id) {
        return ajax("GET", endpoint(`/v1/entry/${id}/taxonomy`))
    }

    v1.entry.collection = function (id) {
        return ajax("GET", endpoint(`/v1/entry/${id}/collection`))
    }

    // PROJECT API

    /** 
     * taxonomy()   --> current project taxonomy
     * taxonomy(p)  --> project taxonomy
     * taxonomy(p,t): update taxonomy
     */
    v1.project.taxonomy = v1.taxonomy = function(proj, taxonomy) {
        if (taxonomy)
            return json("PUT", endpoint(`/v1/project/${proj}/taxonomy`), taxonomy)
        else if (proj)
            return ajax("GET", endpoint(`/v1/project/${proj}/taxonomy`))
        else
            return ajax("GET", endpoint(`/v1/project/${project}/taxonomy`))
    }

    v1.project.create = function (name, link) {
        return ajax("POST", endpoint(`/v1/project`), { name: name, link: link })
    }

    v1.project.update = function (name, update) {
        return ajax("PUT", endpoint(`/v1/project/${name}`), update)
    }

    v1.project.delete = function (name) {
        return ajax("POST", endpoint(`/v1/project/${name}/delete`))
    }

    v1.project.get = function (name) {
        return ajax("GET", endpoint(`/v1/project/${name}`))
    }

    v1.project.all = function () {
        return ajax("GET", endpoint(`/v1/project`))
    }

    // Root API -- deprecated
    v1.getEntry = v1.entry.get
    v1.getTaxonomyEntry = v1.entry.taxonomy
})
