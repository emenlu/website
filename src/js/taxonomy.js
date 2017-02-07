(function () {
    function node(short, long, children) {
		return {
			short: short,
			long: long,
			tree: children
		}
	}

	function tree(children) {
		return node("root", "root", children)
	}

	var taxonomy = tree([
		node("effect", "Effect", [
			node("testing-adapt", "Adapt testing", [
                node("adapting", "Adapting for new tests", []),
                node("adaptation", "Adaption for other shit", [])
            ]),
			node("solving", "Solve new problem", []),
			node("assessing", "Assess new problem", []),
			node("improving", "Improve testing", [])
		]),
		node("scope", "Scope", [
			node("planning", "Test planning", []),
			node("design", "Test design", []),
			node("execution", "Test execution", []),
			node("analysis", "Test analysis", [])
		]),
		node("context", "Context", [
			node("people", "People related constraints", []),
			node("information", "Availability of information", []),
			node("sut", "Properties of SUT", []),
			node("other", "Other", [])
		]),
		node("intervention", "Intervention", [])
	])

	var reverse = {}
	var shorthand = {}

	function recursiveDescent(parent, current) {
		shorthand[current.short] = current.long
		reverse[current.short] = parent.short
		for (var i = 0; i < current.tree.length; i++) {
			recursiveDescent(current, current.tree[i])
		}
	}

	function mapTaxonomy(taxonomy) {
		for (var i = 0; i < taxonomy.tree.length; i++) {
			recursiveDescent(taxonomy, taxonomy.tree[i])
		}
	}

    function dfs(node, find) {
        if (node.short === find)
            return node
        
        for (var i = 0; i < node.tree.length; i++) {
            // Might have child leaves that aren't nodes themselves
            if (typeof node.tree[i] === "string")
                continue

            var probe = dfs(node.tree[i], find)
            if (probe)
                return probe
        }

        return undefined
    }

    mapTaxonomy(taxonomy)

    function insertClassificationIntoTree(classification) {
        // classification = {"SHORT": [ENTITY], "SHORT": [ENTITY]}
        var copy = JSON.parse(JSON.stringify(taxonomy))
        var list = Object.keys(classification)
        for (var i = 0; i < list.length; i++) {
            var key = list[i]
            var values = classification[key]
            var node = dfs(copy, key.toLowerCase())
            
            if (!node) {
                console.log("Couldn't find", key.toLowerCase(), "skipping", values)
                continue
            }
            node.tree = node.tree.concat(values)
        }
        return copy
    }

    function removeUnclassifiedTrees(root) {
        function shake(node) {
            if (typeof node === "string")
                return node

            for (var i = 0; i < node.tree.length; i++) {
                var keep = shake(node.tree[i])
                if (keep) continue
                console.log('shaking', node.tree[i].short, 'from', node.short)
                node.tree.splice(i, 1)
                i--
            }

            if (node.tree.length === 0)
                return undefined
            
            return node
        }

        return shake(root)
    }

    function mapTreeToHTML(tree) {
        function explore(node, depth) {
            if (typeof node === "string")
                return el("div.entity", [node])

            var children = node.tree.map((n, i) => explore(n, depth + 1))
            if (depth > 2)
                return children
            
            return el("div.sublevel.level-" + depth, [
                node.long,
                children
            ])
        }

        return el("div.root", [
            tree.map((n, i) => explore(n, 0))
        ])
    }

    window.tx = {
        treeMap: insertClassificationIntoTree,
        treeShake: removeUnclassifiedTrees,
        htmlMap: mapTreeToHTML
    }
})();