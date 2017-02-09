"use strict";
(function (win) {

    /* Data structure of the tree */
    function Node(short, long, children) {
        this.short = short
        this.long = long
        this.tree = children
    }
    Node.prototype.name = function() { return this.long }
    Node.prototype.id = function() { return this.short }
    /**
     * We have two types of leaf nodes:
     *   - nodes that have no children
     *   - nodes that are entities
     * Depending on what we do with the tree we want to interpret leaves
     * differently, e.g. tree shaking stops if it finds an entity leaf.
     */
    Node.prototype.isTreeLeaf = function () { return this.tree.length === 0 }
    Node.prototype.isEntityLeaf = function() { return this.id() === "leaf" }
    Node.prototype.isRoot = function() { return this.id() === "root" }
    Node.prototype.addChild = function(c) { this.tree.push(c) }
    Node.prototype.clone = function(deep) {
        var newNode = new Node(this.id(), this.name(), [])
        
        for (var i = 0; deep & i < this.tree.length; i++) {
            newNode.addChild(this.tree[i].clone(deep))
        }

        return newNode
    }

    /**
     * map is a bit special since it only maps children.
     * rationale is that you have the root object anyway
     * and it's easier this way to decide if you want it
     * in the new structure, or not.
     */
    Node.prototype.map = function(fn) { return this.tree.map(fn) }
    
    /**
     * Recursively remove nodes without any entity leaves.
     */
    Node.prototype.shake = function () {
        if (this.isEntityLeaf())
            return true

        for (var i = 0; i < this.tree.length; i++) {
            var keep = this.tree[i].shake()
            if (keep) continue
            this.tree.splice(i, 1)
            i--
        }

        if (this.isTreeLeaf())
            return undefined
        
        return this
    }

    /**
     * Depth-first search for node with id.
     */
    Node.prototype.dfs = function(id) {
        if (this.id() === id)
            return this
        
        for (var i = 0; i < this.tree.length; i++) {
            var probe = this.tree[i].dfs(id)
            if (probe)
                return probe
        }

        return undefined
    }

    /**
     * Mock taxonomy
     * 
     * tree = {
     *     long = short = "root",
     *     tree = [
     *         { long = short = "Effect", tree = [ ... ] },
     *         { long = short = "Scope", tree = [ ... ] },
     *         { long = short = "Context", tree = [ ... ] },
     *         { long = short = "Intervention", tree = [] }
     *     ]
     * }
     */
    // identifier, name, children
    var MOCK_TAXONOMY = new Node("root", "root", [
        new Node("effect", "Effect", [
            new Node("testing-adapt", "Adapt testing", [
                new Node("adapting", "Adapting for new tests", []),
                new Node("adaptation", "Adaption for other shit", [])
            ]),
            new Node("solving", "Solve new problem", []),
            new Node("assessing", "Assess new problem", []),
            new Node("improving", "Improve testing", [])
        ]),
        new Node("scope", "Scope", [
            new Node("planning", "Test planning", []),
            new Node("design", "Test design", []),
            new Node("execution", "Test execution", []),
            new Node("analysis", "Test analysis", [])
        ]),
        new Node("context", "Context", [
            new Node("people", "People related constraints", []),
            new Node("information", "Availability of information", []),
            new Node("sut", "Properties of SUT", []),
            new Node("other", "Other", [])
        ]),
        new Node("intervention", "Intervention", [])
    ])

    /**
     * A tree representation of a taxonomy.
     */
    function Taxonomy(backend_repr) {
        this.child2parent = {}
        this.short2long = {}

        // TODO: Generate root from backend_repr
        this.root = MOCK_TAXONOMY.clone(true)

        /* e.g. backend_repr is a flat list of the nodes:
          [ node, node, node, node ]
          where node = { short, long, parent }

          var root = node("root", "root", [])
          // extremely simple algo: build tree iteratively
          // if node has parent we add it, otherwise we add back
          while (backend_repr.length > 0) {
              var current = backend_repr.shift()
              var parent = dfs(root, current.parent)
              if (parent)
                  parent.tree.push(node(current.short, current.long, []))
              else
                  backend_repr.push(current)
          }
        */
    }

    /**
     * Update the root or get a copy of the tree.
     */
    Taxonomy.prototype.tree = function (new_root) {
        if (new_root)
            this.root = new_root
        else
            return this.root.clone(true)
    }

    /**
     * Inserts a classification into a new tree. 
     */
    Taxonomy.prototype.classify = function (classification) {
        var copy = this.tree()
        var list = Object.keys(classification)
        for (var i = 0; i < list.length; i++) {
            var key = list[i]
            var values = classification[key]
            var node = copy.dfs(key.toLowerCase())
            
            if (!node) continue
            for (var j = 0; j < values.length; j++) {
                var entity = values[j]
                node.addChild(new Node("leaf", entity, []))
            }
        }
        return copy
    }

    win.Taxonomy = Taxonomy
})(window);