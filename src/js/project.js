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
    var	currentFacetName = document.getElementById('facetName').innerText.toLowerCase()
	/* used to store order in which elements are added so user can reverse operations */
	var operations = []
	$('#project-taxonomy').text('extend base-taxonomy for project: ' + querystring.p)
	/* svg settings */
	var width = 500
	var height = 400
	var globalDepth = 1
	var currentDepth =1
	/* remove -10 to make svg fill the square from edge-to-edge */
	var radius = (420) -20

	/* colorScheme is defined in util/color.js */
	var color = window.util.colorScheme()

	//used to set text size depending on 'zoom' level
	var tier =0;
	
	/* x-axis should map to a full circle, otherwise strange chart */
	var x = d3.scale.linear().range([0, 2 * Math.PI])

	/* use pow scale to make root node radius smaller */
	var y = d3.scale.pow().exponent(1).range([0, radius]);

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
		var radius = Math.max(0, y(presetY(d) + 0.125 * 0.5) )
		return Math.cos(angle - 0.5 * Math.PI) * radius
	}

	/* sample y coord of arc for label positioning */
	function arcY(d) {
		if (d.name === 'root')
			return 0

		var angle = Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx * 0.5)))
		var radius = Math.max(0, y(presetY(d) + 0.125 * 0.5))
		return Math.sin(angle - 0.5 * Math.PI) * radius
	} //d.dy=0.125

	function computeTextRotation(d) {
		return (x(d.x + d.dx / 2) - Math.PI / 2) / Math.PI * 180;
	}
	/* Idea is to map the flat tree into an arc tree using the computed
	 * extents (d.dx, d.dy). A partition layout normally looks something
	 * like this: http://codepen.io/anon/pen/Bfpmg
	 * The y-axis is used to determine inner and outer radii, while
	 * the x-axis determines start and end angles for the arc.
	 */

	//keeps facets the same size for all depths of zoom
	function presetY(d){
		var rel = tier == 0 ? d.depth-tier:d.depth-tier+1
		if(rel<4){
			return rel *0.125
		}
		//default for hidden facets
		return 0.125
	}

	var arc = d3.svg.arc()
		.startAngle(d => Math.max(0, Math.min(2 * Math.PI, x(d.x))))
		.endAngle(d => Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))))
		.innerRadius(d => Math.max(0, y(presetY(d))) )
		.outerRadius(d => Math.max(0, y(presetY(d) + 0.125)))
	//d.dy =0.125
	
	$("#howToUse").click(evt => {
		window.components.projUIHelp()
    })

	project.renderGraph = function(nodeId, dataset, taxonomy,serp,taxonomyDataSet) {
		baseTaxonomyData=taxonomyDataSet[0]
		extendedTaxonomyData=taxonomyDataSet[1]

		var buttonEvents = [ ['submitBtn',submit], ['backBtn',undo], ['resetBtn', reset], ['saveBtn',save], ['removeBtn',remove] ]
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
			if(label == 'root'){
				return 'root'
			}
			else{
				var parent = serp.dfs(label).parentId().toLowerCase()
				if(parent =='root') parent='root'
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
		 		.attr('font-size', d=>labelScale(d)+ (relativeDepth(d)*2))
		}

		function mouseOut(d){
			if (d.depth === 0) return
		 	svg.select('#text'+d.name)
				.attr('font-size', d => labelScale(d))
				.style("text-shadow", "none")
		}

		function labelScale(d){
			if(d.name=='root'){
				return 12
			}
			else if(d.name==currentFacetName){
				return 16
			}
			else if(relativeDepth(d)==0){
				return 14
			}
			else if(relativeDepth(d)==1){
				return 12.5
			}
			else if(relativeDepth(d)==2){
				return 12
			}
			return 11
		}

    	function complain(where, what) {
    		$('.complaint').remove()
    	    where.appendChild(el("div#proj_ui_complaint.complaint.center", [what]));
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
	    //allows programatically to click a facet
	    jQuery.fn.d3Click = function () {
			  this.each(function (i, e) {
			    var evt = new MouseEvent("click")
			    e.dispatchEvent(evt)
			})
		}

	    function remove(){
	    	var head = serp.dfs(currentFacetName)
	    	if(head.parent=='root'){
				complain(errorDiv, "Cannot remove Base Taxonomy")
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
			$("#path"+head.parent).d3Click()
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
		   		location.reload();
		    }	
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
			currentFacetName = name = name.toLowerCase()
			if(name.length<20)
				document.getElementById('facetName').innerText = name	
			else
				document.getElementById('facetName').innerText = name.substring(0,12)+"...";
			svg.select("#text"+name)
				.style("fill", '#FFFB00')
		}
		function relativeDepth(d){
			return d.depth - tier
		}

      	function arcTween(d) {
		  	var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
		     	yd = d3.interpolate(y.domain(), [presetY(d), 1]),
		      	yr = d3.interpolate(y.range(), [presetY(d) ? 20 : 0, radius]);
			return function(d, i) {
		    	return i
		        ? function(t) { return arc(d); }
		        : function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return arc(d); };
		  };
		}

		function pathWindUp(d,delay){
			svg.selectAll('text').transition()
				.attr("opacity", 0)
				.attr('font-size', d => labelScale(d))
		  	svg.selectAll("path").transition()
		  		.duration(600 + delay)
		  		.attrTween("d",arcTween(d))
			    .each("end", function(e, i) {
		        	// check if the animated element's data e lies within the visible angle span given in d
		          	if (e.name!=='root' && e.x >= d.x && e.x < (d.x + d.dx)) {
			        // get a selection of the associated text element
		            var arcText = d3.select("#text"+e.name);
		            // fade in the text element and recalculate positions
		            arcText.transition().duration(400 + delay)
		              .attr("opacity", 1)
		              .attr("x", arcX)
		              .attr("y", arcY)
	        		}
	        		else{
			        	svg.select("#textroot")
			        		.attr('dx',"0")
			        		.attr("opacity", 1)
							.attr('text-anchor', 'middle')
							.attr('x', arcX)
							.attr('y', arcY)
			        }
		    	})
		}
		//use to isolate direction of taxonomy explorer
		function getActiveList(d, list,depth){
			if (depth==0){
				return
			}
			var children = d.children
			if (children && children.length > 0) {
				for (var i = 0; i < children.length; i++) {
					getActiveList(children[i], list,depth-1)
					list.push(children[i])
				}
			}
		}

		function getHiddenItems(reverseList, type){
			var list = svg.selectAll(type).filter(function(item){
  				return reverseList.indexOf(item) === -1;
			})
			return list
		}
		function getActiveItems (reverseList,type){
			var list = svg.selectAll(type).filter(function(item){
  				return reverseList.indexOf(item) != -1;
			})
			return list
		}

		function click(d){
			var rel = relativeDepth(d)
			if(rel !== 0){
				var delay = rel > 0 ? (rel*50) : 100
				// facetInfo(d, delay)
				toggleMouseEvents(d, true)
				new Promise(function (F, R) {
					zoom(d, delay)
					setTimeout(F, Math.max(1100, 700 + delay))
				}).then( function () {
					toggleMouseEvents(d, false)
				})
			}
			if(d.name=='root')
				return
			svg.selectAll("text")
				.style("stroke", 'none')
				.style("fill", 'black')
			//update ui-interphase
			$('.complaint').remove()
			updateName(d.name)
			currentDepth = d.depth+1	
		}

		function zoom(d, delay) {
			var activeList =[]
			tier = d.depth
			var depth =2
			getActiveList(d, activeList,depth)
			activeList.push(d)
			var hiddenText = getHiddenItems(activeList,'text')
			var activeText = getActiveItems(activeList,'text')
			//add BackButton
			svg.selectAll("path").filter( function(path){
				if(path.name==getParent(d.name)) {
				 	activeList.push(path)
				}
			})
			var hiddenFacets = getHiddenItems(activeList,'path')
			var activeFacets = getActiveItems(activeList,'path')
			activeText[0].forEach(active => {
				setTimeout(function(){
					active.classList.remove("hide")
				}, 300)
			})
			hiddenText[0].forEach(hidden => {
				hidden.classList.add("hide");
			})
			pathWindUp(d, delay)
			activeFacets[0].forEach(active => {
				active.classList.remove("disappear")
				active.classList.remove('hide')
			})
			hiddenFacets[0].forEach(hidden => {
			hidden.classList.add("disappear")
				setTimeout(function(){
					hidden.classList.add('hide')
				}, 1100)
			})
		}

		function submit(){
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
			var cNode = new window.FacetNode(inputs[0].value,inputs[1].value,[],currentFacetName, inputs[2].value)
			var x = serp.dfs(currentFacetName)
			x.addChild(cNode)
			/* deletes current svg */
			removeSvg()
			/* adds to list of operations so user can reverse step */
			operations.push(inputs[0].value)
			/* update scaling for new svg */
			if(currentDepth > globalDepth){
				globalDepth+=1
			}
			clearInputText()
			/* creates new svg with updates */
			project.renderGraph('#taxonomy', dataset, taxonomy, serp,[baseTaxonomyData, extendedTaxonomyData])
			//zooms into new facet
			$("#path"+cNode.short).d3Click()
		}

		function setDepth(d){
			if(d.depth>2){
				return true
			}
			return false
		}

		/* setup the main graph */
		svg.selectAll("path")
			.data(partition).enter()
			.append("path")
				.attr("d", arc)
				.attr("id", d=> 'path'+d.name)
				.style("fill", d => color(d.name)(relativeUse(d)))
				.style("stroke", d => '#f2f2f2')
				.classed('hide', d=> setDepth(d) )
				.classed('disappear', d=> setDepth(d) )
				.on("mousemove", mouseMove)
				.on("mouseout", mouseOut)
				.on("click", click)

		/* add labels positioned at area center */
		svg.selectAll("text")
			.data(partition).enter()
			.append('text')
			.attr("id", d => 'text'+d.name)
			.attr('font-family', 'Arial, sans-serif')
		    .attr('text-anchor', 'middle')
		    .attr("x", arcX)
		    .attr("y", arcY)
		    .attr('pointer-events', 'none')
			.attr('font-size', d=>labelScale(d))
		    .classed('hide', d=> setDepth(d) )
		    .text(function(d) { return d.name; })

			//can't extend from root node
			//sets initial colour to effect
			svg.select("#text"+currentFacetName)
				.style("fill", '#FFFB00')
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