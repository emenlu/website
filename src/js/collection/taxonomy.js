$(function () {
	var isOwner;
	var toProfilePage = () => window.location = "/profile.html"

	// Only allow user to inspect specific collection
	if (window.location.hash.length === 0)
		toProfilePage()

	// http://serpconnect.cs.lth.se/collection.html#33 => 33
	var cID = window.location.hash.substring(1)

	function updateLink(el) {
		el.setAttribute('href', `${el.getAttribute('href')}#${cID}`)
	}

	['general', 'users','taxonomy-tab', 'entries'].forEach(id => updateLink(document.getElementById(id)))

	window.api.v1.account.collections()
		.then(collections => {
      		return collections.filter(collection => {
        		return collection.id === Number(cID)
      		}).pop()
    }).then(collection => {
		if (!collection) throw new Error("You are not a member of this collection")
		setupName(collection)
		$('#taxonomy-extension').text('extend taxonomy for collection: ' + collection.name)
		return api.v1.collection.isOwner(collection.id)
    }).then(owner =>{
		isOwner=owner;
		$('#owner').text(owner ? " (owner)" : "")
		$('#leave').text(owner ? "delete collection" : "leave collection")
    }).fail(reason => {
		window.alert(reason)
	})
    
	window.api.v1.collection.stats(cID)
		.done()
		.fail(toProfilePage)

	function setupName(collection) {
		$('#name').text(collection.name)
		$('#id').text(collection.id)
	}

	function getCollectionName(){
		return $('#name').innerText
	}

	$("#profile").addClass("current-view");
	Dataset.loadDefault(data => {
		if (!cID) return
		Promise.all([
			api.v1.taxonomy(),
			api.v1.collection.taxonomy(cID)	
		]).then(taxonomyData => {
			var serp = taxonomyData[0]
			var extension = taxonomyData[1]
			var taxonomy = new window.Taxonomy(serp.taxonomy)
 			taxonomy.extend(extension.taxonomy)
			window.project.renderGraph('#taxonomy', data, taxonomy, taxonomy.root, taxonomyData)
		})
	})
})
