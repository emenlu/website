window.addEventListener('load', start)


function start() {
    document.getElementById('collection').addEventListener('change', select_collection, false)
    document.getElementById('entry').addEventListener('change', select_entry, false)

    window.TARGET = document.getElementById('taxonomy')
    load_collections()
}

function select_collection(evt) {
    load_entries(+this.value)
}

function select_entry(evt) {
    inspect_entry(+this.value)
}

function clear_target() {
    while (TARGET.lastChild)
        TARGET.removeChild(TARGET.lastChild)
}

function inspect_entry(entry_id) {
    clear_target()
    load_taxonomy(+this.value).then(inspect_classification)
}

function inspect_taxonomy(entry_id) {
    clear_target()
    dump_taxonomy(window.tx.treeMap({}))
}

function byNbrOfChildren(a, b) {
    return a.children.length - b.children.length
}

/* Generate a classification setup a la submit page */
function classification_remove_row(evt) {
    var sample = this.parentNode
    sample.parentNode.removeChild(sample)
}
/* when user clicks the [+] of a facet */
function classification_add_row(evt) {
    var remove = el("div.remove", ["✖"])
    remove.addEventListener('click', classification_remove_row) 
    this.parentNode.appendChild(el('div.entity-sample', [
        el("input"),
        remove
    ]))
}
/* when user changes the checkbox value of a facet */
function classification_checkbox_click(evt) {
    var header = this.parentNode

    if (!this.checked) {
        /* the [+] and inputs are siblings to the header */
        while (header.nextSibling)
            header.parentNode.removeChild(header.nextSibling)
    } else {
        // TODO: Load text from somewhere
        var add = el("div.additional-data", ["click to add description +"])
        add.addEventListener('click', classification_add_row, false)
        header.parentNode.insertBefore(add, header.nextSibling)
    }
}
function generate_checkbox() {
    var box = el("input", {type:"checkbox"})
    box.addEventListener('change', classification_checkbox_click, false)
    return box
}
function generate_submit_classification() {
    clear_target()

    var taxonomy = new Taxonomy({})
    console.log(taxonomy.tree())

    /**
     * div.classification
     *     div.node
     *         span "Effect"
     *         div.leaf
     *             div.header
     *                 label "Solve new problem"
     *                 input "[x]"
     *             div.additional-data "click to add description +"
     *             div.entity-sample
     *                 input
     *                 div.remove "x"
     */
    var cxx = el('div.classification', taxonomy.tree().map(
        function build(node, i) {
            if (node.isTreeLeaf()) {
                return el("div.leaf", [
                    el("div.header", [
                        el("label", [node.name()]),
                        generate_checkbox()
                    ])
                ])
            } else {
                return el("div.node", [
                    el("span", [node.name()]),
                    node.map(build).sort(byNbrOfChildren)
                ])
            }
        }).sort(byNbrOfChildren)
    )

    var divider = el("div.center", [
        el("div.classification-divider", [""]),
        el("div.divider-title", ["Classification"]),
        el("div.classification-divider", [""])
    ])

    TARGET.appendChild(el("div", [divider, cxx]))
}

console.log("collection", "462")
console.log("entry", "313")
console.log("inspect entry:", "load_taxonomy(eid).then(inspect_classification)")

/* misc */
function load_collections() {
    return api.v1.account.collections().then(function (collz) {
        var target = document.getElementById('collection')
        for (var i = 0; i < collz.length; i++) {
            var id = collz[i].id
            var name = collz[i].name
            target.appendChild(el('option', {value: id}, [`${name}/${id}`]))
        }
    })
}

function load_entries(coll_id) {
    document.getElementById('collection').value = coll_id
    return window.api.ajax("GET", window.api.host + "/v1/collection/" + coll_id + "/graph")
        .then(function (graph) {
            var target = document.getElementById('entry')
            while (target.lastChild)
                target.removeChild(target.lastChild)
            for (var i = 0; i < graph.nodes.length; i++) {
                target.appendChild(el('option', {value: graph.nodes[i].id}, [""+graph.nodes[i].id]))
            }
        })
}

function load_taxonomy(entry_id) {
    document.getElementById('entry').value = entry_id
    return api.v1.entry.taxonomy(entry_id).then(function (classification) {
        var taxonomy = new Taxonomy({})
        return taxonomy.classify(classification)
    })
}

function inspect_classification(root) {
    dump_taxonomy(root.shake())
}

function dump_taxonomy(root) {
    var target = document.getElementById('taxonomy')

    function explore(node, depth) {
        if (node.isEntityLeaf())
            return el("div.entity", [node.name()])

        var children = node.map((n, i) => explore(n, depth + 1))
        if (depth > 2)
            return children
        
        return el("div.sublevel.level-" + depth, [
            node.name(),
            children
        ])
    }

    var html = el("div.root", [
        root.map((n, i) => explore(n, 0))
    ])

    target.appendChild(html)
}