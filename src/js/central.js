$(document).ready(function() {

	var central = window.central = {}
	
	var reverseMap = {
    	"adapting": "Effect",
        "solving": "Effect",
        "assessing": "Effect",
        "improving": "Effect",
        "planning": "Scope",
        "design": "Scope",
        "execution": "Scope",
        "analysis": "Scope",
        "people": "Context",
        "information": "Context",
        "sut" : "Context",
        "other": "Context",
        "intervention": "Intervention"
    }
    var shorthandMap = {
        "adapting": "Adapt testing",
        "solving": "Solve new problem",
        "assessing": "Assess testing",
        "improving": "Improve testing",
        "planning": "Test planning",
        "design": "Test design",
        "execution": "Test execution",
        "analysis": "Test analysis",
        "people": "People related constraints",
        "information": "Availability of information",
        "sut" : "Properties of SUT",
        "other": "Other"
    }


	central.constructEntities= function(taxonomy, facet) {
		var filtered = taxonomy[facet] || []

		return filtered.map(sample => (
			sample === "unspecified" ?
				undefined : el('div.modal-sub-sub-item', [sample]))
		)
	}

	central.constructSubfacet = function(taxonomy, facet) {
		if (shorthandMap[facet.toLowerCase()])
			return el('div.modal-sub-sub-item', [
				shorthandMap[facet.toLowerCase()],
				central.constructEntities(taxonomy, facet)
			])
		else
			return central.constructEntities(taxonomy, facet)
	}

	central.constructFacet = function(taxonomy, name) {
		var samples = Object.keys(taxonomy).filter(
			facet => reverseMap[facet.toLowerCase()] === name
		) || []

		if (!samples.length) return undefined

		return el("div.modal-header-title", [
			name,
			samples.map(facet => central.constructSubfacet(taxonomy, facet))
		])
	}
})