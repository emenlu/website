$(function () {
	/* returned data from project.taxonomy(p): taxonomy and version */
	var project = window.project = {}
	var baseTaxonomyData
	var extendedTaxonomyData
	var cID = window.location.hash.substring(1)
	var inputs = [
		document.getElementById('idInput'),
		document.getElementById('nameInput'),
		document.getElementById('descInput')
	]
	var errorDiv = document.getElementById('error-messages')
	var querystring = {}
    /* Naive querystring ?a=1&b=c --> {a:1, b:'c'} mapping */
    if (window.location.search) {
        var params = window.location.search.substring(1).split('&')
        for (var i = 0; i < params.length; i++) {
            var split = params[i].indexOf('=')
            var name = params[i].substring(0, split)
            var value = params[i].substring(split + 1)

            querystring[name] = value
        }
    }
    var	currentFacetName = document.getElementById('facetName').innerText
	/* used to store order in which elements are added so user can reverse operations */
	var operations = []
	$('#project-taxonomy').text('extend base-taxonomy for project: ' + querystring.p)
	/* svg settings */
	var width = 450
	var height = 450
	var globalDepth = 1
	var currentDepth =1
	/* remove -10 to make svg fill the square from edge-to-edge */
	var radius = (Math.min(width, height) / 2) - 10

	/* colorScheme is defined in util/color.js */
	var color = window.util.colorScheme()

	//used to set text size depending on 'zoom' level
	var tier =0;
	
	/* x-axis should map to a full circle, otherwise strange chart */
	var x = d3.scale.linear().range([0, 2 * Math.PI])

	var exp = 1.3
	/* use pow scale to make root node radius smaller */
	var y = d3.scale.pow().exponent(exp).range([0, radius]);

	/* compute relative to total number of entries, found in root */
	function relativeUse(d) {
		/* root node has no parent, but its usage is known (100%) */
		if (!d.parent)
			return 1.0
		var root = d.parent
		while (root.parent)
			root = root.parent
		return d.usage / Math.max(root.usage, 1)
	}
	
	function getStartAngle(d) {
		return Math.max(0, Math.min(2 * Math.PI, x(d.x)))
	}
	function getEndAngle(d) {
		return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx)))
	}

	/* sample x coord of arc for label positioning */
	function arcX(d) {
		var angle = Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx * 0.5)))
		var radius = Math.max(0, y(d.y + d.dy * 0.5))
		return Math.cos(angle - 0.5 * Math.PI) * radius
	}

	/* sample y coord of arc for label positioning */
	function arcY(d) {
		if (d.name === 'serp')
			return 0

		var angle = Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx * 0.5)))
		var radius = Math.max(0, y(d.y + d.dy * 0.5))
		return Math.sin(angle - 0.5 * Math.PI) * radius
	}

	function computeTextRotation(d) {
		return (x(d.x + d.dx / 2) - Math.PI / 2) / Math.PI * 180;
	}
	/* Idea is to map the flat tree into an arc tree using the computed
	 * extents (d.dx, d.dy). A partition layout normally looks something
	 * like this: http://codepen.io/anon/pen/Bfpmg
	 * The y-axis is used to determine inner and outer radii, while
	 * the x-axis determines start and end angles for the arc.
	 */
	var arc = d3.svg.arc()
		.startAngle(d => Math.max(0, Math.min(2 * Math.PI, x(d.x))))
		.endAngle(d => Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))))
		.innerRadius(d => Math.max(0, y(d.y)))
		.outerRadius(d => Math.max(0, y(d.y + d.dy)))
	
	project.renderGraph = function(nodeId, dataset, taxonomy,serp,taxonomyDataSet) {
		baseTaxonomyData=taxonomyDataSet[0]
		extendedTaxonomyData=taxonomyDataSet[1]

		buttonEvents = [ ['submitBtn',submit], ['backBtn',undo], ['resetBtn', reset], ['saveBtn',save], ['removeBtn',remove] ]
		addEvents()
		var usage = window.util.computeUsage(dataset, taxonomy)
		var color = window.util.colorScheme(taxonomy)
		var serp = serp
		function trimTaxonomy(d){
			var tree = d.tree
			if(typeof tree !== 'undefined' && tree.length >0){
				tree.forEach(function(child){
					var list = child.tree
					while(list !== 'undefined' && list.length >0){
						list.pop()
					}
				})
			}
		}

		Node = function(short,long,parent,tree,desc) {
            this.short = short
            this.long = long
            this.parent = parent
            this.tree = tree
            this.usage=0
            this.desc=desc
    	}

		/* Ensure that all facets and sub facets have an object that contains the
		 * 'usage' key, which is parsed during treeify and added to the new node.
		 */
		serp.map(function init(node) {
			node.usage = usage[node.id().toLowerCase()]
			node.map(init)
		})

		var partition = d3.layout.partition()
			.value(d => d.size)
			.nodes(window.util.treeify(serp, dataset.nodes().length))

		var svg = d3.select(nodeId)
			.append("svg")
				.attr("id","svgMain")
				.attr("width", width)
				.attr("height", height)
				.attr('overflow','visible')
			.append("g")
				.attr("id","g")
				.attr("transform", `translate(${width/2}, ${height/2})`)

       function getParent(label){
			if(label == 'serp'){
				return 'serp'
			}
			else{
				var parent = serp.dfs(label).parentId().toLowerCase()
				if(parent =='root') parent='serp'
				return parent
			}
		}

        //temporarily disables Mouse Events for a given time length 
        function toggleMouseEvents(d,on){
	     	if(on){
	     		mouseOut(d)
		     	svg.selectAll("path")
						.on("mousemove", null)
						.on("mouseout", null)
						.on("click",null)
			}else{
				svg.selectAll("path")
				.on("mousemove", mouseMove)
				.on("mouseout", mouseOut)
				.on("click",click)
			}
        }

		function labelScale(d){
			return 14
		}

		function putIntoTaxonomy(serp,node,d){
			serp.tree.forEach( child => {
				if(child.long.toLowerCase()==d.name.toLowerCase()){
					putIntoTaxonomy2(child,node)
				}
			})
		}

		function putIntoTaxonomy2(d,node){
			if(d.short.toLowerCase()==node.parent.toLowerCase()){
				d.tree.push(node)
				return
			}
			if(typeof d.tree !== 'undefined' && d.tree.length >0){
				d.tree.forEach(function(child){
					putIntoTaxonomy(child,node)
				})
			}
		}

		function newFacet(cNode,d,newD){
			var arcN = arc(newD)
			svg.append("path")
			.attr("d", arcN)
			.attr("id", 'path'+cNode.long)
			.style("fill", color(d.name)(relativeUse(d)))
			.style("stroke", '#f2f2f2')
			.on("click", click)
		}

		function addSubfacet(evt) {
            var facetId = this.parentNode.parentNode.dataset.facet
            var facetNode = subtree.dfs(facetId)

            modals.addTextBox(function (newid, newname) {
                newid = newid.toUpperCase()
                var idExists = subtree.id() === newid || !!subtree.dfs(newid)
                if (idExists) {
                    var existing = this.querySelector('div.complaint')
                    if (existing)
                        existing.parentNode.removeChild(existing)

                    document.getElementById("confirm").parentNode.appendChild(
                        el("div.complaint", ["That name already exists"])
                    )
                    return
                }

                entityClassificiation[newid] = []

                // facetNode.addChild(new FacetNode(newid, newname, [],  facetNode.id()))
                document.body.removeChild(this)

                rebuild()
            })
        }

	    function mouseMove(d) {
			if (d.depth === 0) return
			svg.select('#text'+d.name)
		 		.attr('font-size', 14)
		 		.attr("transform", function() {return "rotate(0)"  })
		 		.attr('text-anchor', 'middle')
				.attr('x', arcX)
				.attr('y', arcY)
				.attr('dx',"0")
		}

		function mouseOut(d){
			if (d.depth === 0) return
		 	svg.select('#text'+d.name)
				.attr('font-size', 12)
				.attr("x", function(d) { return y(d.y); })
		    	.attr("dx",function(d){return "6"}) 
		    	.attr("y", d.y)
		    	.attr("transform", function() {return "rotate(" + computeTextRotation(d) + ")"})
		    	.attr('text-anchor','none')
				.style("text-shadow", "none")
		}

    	function complain(where, what) {
    	    where.appendChild(el("div#complaint.complaint.center", [what]));
	    }

	    function validateId(id) {
			var regex = new RegExp('[^A-Za-z0-9_]');
			//to prevent issues with the db and d3 only allows a-z and _
	    	return regex.test(id)
    	}

	    function errorCheck(){
	    	return inputs.some( input => {
	    		return input.value == ""
	    	})
	    }

	    function clearInputText(){
	    	inputs.forEach( input =>{
    			input.value = ""	
	    	})
	    }
	    
	    function addEvents(){
	    	buttonEvents.forEach( button => {
	    		document.getElementById(button[0]).addEventListener('click', button[1], false)
	    	})
	    }

	    function removeEvents(){
			buttonEvents.forEach( button => {
	    		document.getElementById(button[0]).removeEventListener('click', button[1], false)
	    	})
	    }

	    function removeSvg(){
	    	document.getElementById('g').remove()
			document.getElementById('svgMain').remove()
	    }

	     function remove(){
	    	var head = serp.dfs(currentFacetName)
	    	if(head.parent=='root'){
	    		return
	    	}	
			var children = head.tree
			if ( children && children.length > 0 ) {
				while(children.length > 0){
					removeChildren(children[0])
					children.shift()
				}
			}
			//remove from taxonomy
			var parent = serp.dfs(head.parent)
			var y = parent.tree.indexOf(head)
			parent.tree.splice(y,1)
			removeFacet(currentFacetName)
			updateName(head.parent)
			clearInputText()
			//Clear operations list otherwise will give error. undo button works up until last remove sequence.
			operations = []
	    }

	    function removeChildren(x){
	    	var children = x.tree
			if (children && children.length > 0 ) {
				while(children.length > 0){
					removeChildren(children[0])
					children.shift()
				}
			}
			removeFacet(x.short)
		    return
	    }

	    function removeFacet(x){
	    	svg.select('#path'+x).remove()
		    svg.select('#text'+x).remove()
	    }

	    function save(){
	    	if(cID)
	    		saveCollection()
		    else
		    	saveProject()
	    }

	    function saveCollection(){
	    	//is collection
		    	//pop out all base taxonom
	    	var workingTaxonomy = serp.flatten()
	    	workingTaxonomy.splice(0, 1) // remove 'root' node
	    	var newTaxonomyExt = workingTaxonomy.filter(function(match) {
	    		var isExt=true
	    		baseTaxonomyData.taxonomy.forEach( current => {
	    			if(match.id.toLowerCase()==current.id.toLowerCase()){
	    				isExt=false
	    			}
	    		})
	    		if(isExt)
  				return match;
			})
	    	var taxonomyData = {
	    		taxonomy: newTaxonomyExt,
	    		version: extendedTaxonomyData.version + 1
	    	}
	    	extendedTaxonomyData = taxonomyData
	    	return api.v1.collection.taxonomy(cID, taxonomyData).then( () => {
	    		alert("taxonomy saved")
	    	}).fail(xhr => alert(xhr.responseText)) 
		}	
	   
	    function saveProject(){
	    	var taxonomyData = {
		    		taxonomy: serp.flatten(),
		    		version: baseTaxonomyData.version + 1
		    	}
		    	taxonomyData.taxonomy.splice(0, 1) // remove 'root' node
		    	baseTaxonomyData = taxonomyData

		    	return api.v1.project.taxonomy(querystring.p, taxonomyData).then(() => {
		    		alert("ok")
		    	}).fail(xhr => alert(xhr.responseText))
	    }

	    function reset() {
	    	//modal confirm
	    	window.modals.confirmPopUp('this will reset any unsaved changes, are you sure??', doIt)
		    function doIt(){
		    	//reset everything
		    	removeEvents()
				removeSvg()
				clearInputText()
				operations = []
				globalDepth =1
				currentDepth=1
				y = d3.scale.pow().exponent(1.3).range([0, radius])
				//load initial taxonomy
				if(cID)
					resetCollection()	
				else
					resetProject()	
		    }	
	    }
	    function resetProject(){
	    	Dataset.loadDefault(data => {
			    if (!querystring.p) return
				api.v1.project.taxonomy(querystring.p).then(serp => {
					baseTaxonomyData = serp
					var taxonomy = new window.Taxonomy(serp.taxonomy)
					project.renderGraph('#taxonomy', data, taxonomy, taxonomy.root,[baseTaxonomyData])
				})
			})
	    }

	    function resetCollection(){
	    	Dataset.loadDefault(data => {
					var baseSerp
					api.v1.taxonomy().then(serp => {
						baseTaxonomyData = serp
						baseSerp = serp
					})
					api.v1.collection.taxonomy(cID).then(serpExt => {
						extendedTaxonomyData = serpExt
						var taxonomy = new window.Taxonomy(baseSerp.taxonomy)
			 			taxonomy.extend(serpExt.taxonomy)
						project.renderGraph('#taxonomy', data, taxonomy, taxonomy.root,[baseTaxonomyData,extendedTaxonomyData])
					})
				})
	    }



		function undo(){
			var current = operations.pop()
			if(current){
				document.getElementById('path'+current).remove()
				document.getElementById('text'+current).remove()
				var x = serp.dfs(current)
				var y = serp.dfs(x.parent.toLowerCase())
				y.tree.pop()
			}
			//get depth level via operations
		}

		function updateName(name){
			name = name.toLowerCase()
			if(name.length<20)
				document.getElementById('facetName').innerText = name	
			else
				document.getElementById('facetName').innerText = name.substring(1,12)+"...";
		}

		function click(d){
			$('.complaint').remove()
			currentFacetName = d.name
			updateName(d.name)
			currentDepth = d.depth+1
			svg.selectAll("path")
				.style("stroke", '#f2f2f2')
			svg.select("#path"+d.name)
				.style("stroke", '#000')
		}

		function submit(){
			$('.complaint').remove()
			var	currentName = document.getElementById('facetName').innerText
			let idExists = serp.dfs(inputs[0].value)
			if(idExists){
				complain(errorDiv, "Short Name is already in use")
				return
			}
			if(validateId(inputs[0].value)){
				complain(errorDiv, "Short Name input error: only letters A-Z and _ allowed")
				return
			}

			if(errorCheck()){
				complain(errorDiv, "text field empty: enter a short name, long name & description")
				return
			}
			/* removes events from current svg, otherwise these will still be called after current svg is removed */
			removeEvents()
			/* create new node and update taxonomy */
			var cNode = new window.FacetNode(inputs[0].value,inputs[1].value,[],currentName, inputs[2].value)
			var x = serp.dfs(currentName)
			x.addChild(cNode)
			/* deletes current svg */
			removeSvg()
			/* adds to list of operations so user can reverse step */
			operations.push(inputs[0].value)
			/* update scaling for new svg */
			if(currentDepth > globalDepth){
				globalDepth+=1
				exp = exp-0.15
				y = d3.scale.pow().exponent(exp).range([0, radius]);
			}
			clearInputText()
			/* creates new svg with updates */
			project.renderGraph('#taxonomy', dataset, taxonomy, serp,[baseTaxonomyData, extendedTaxonomyData])
		}

		/* setup the main graph */
		svg.selectAll("path")
			.data(partition).enter()
			.append("path")
				.attr("d", arc)
				.attr("id", d=> 'path'+d.name)
				.style("fill", d => color(d.name)(relativeUse(d)))
				.style("stroke", d => '#f2f2f2')
				.on("mousemove", mouseMove)
				.on("mouseout", mouseOut)
				.on("click", click)

		/* add labels positioned at area center */
		svg.selectAll("text")
			.data(partition).enter()
			.append('text')
			.attr("id", d => 'text'+d.name)
			.attr('font-family', 'Arial, sans-serif')
			.attr("transform", function(d) { if(d.name!='serp')return "rotate(" + computeTextRotation(d) + ")"  })
		    .attr("x", function(d) { return y(d.y); })
		    .attr("dx",function(d){ if(d.name!='serp') return "6"}) // margin
		    .attr("dy", ".35em") // vertical-align
		    .text(function(d) { return d.name; })
			.attr('pointer-events', 'none')
			.attr('font-size', 12)
			.append('tspan')
				.on("click", click)
		svg.select("#textroot")
			.attr('text-anchor', 'middle')
			.attr('x', arcX)
			.attr('y', arcY)
			//can't extend from root node
			svg.select('#pathroot').on('click',null);
			svg.select('#textroot').on('click',null);
			//sets initial colour to effect
			var activeName = document.getElementById('facetName').innerText
			svg.select("#path"+document.getElementById('facetName').activeName)
				.style("stroke", '#000')
	}

})
// // only works on live
// Dataset.loadDefault(data => {
// 		Promise.all([
// 			api.v1.taxonomy(),
// 			api.v1.collection.taxonomy(682)
// 		]).then(taxonomies => {
// 			var taxonomy = new window.Taxonomy(taxonomies[0].taxonomy)
// 			taxonomy.extend(taxonomies[1].taxonomy)
// 			//taxonomy.extend(taxonomies[1].taxonomy)
// 			renderGraph('#taxonomy', data, taxonomy)
// 		})
// 	})
// })