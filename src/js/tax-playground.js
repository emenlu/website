
window.addEventListener('load', start)

function start() {
    document.getElementById('collection').addEventListener('change', select_collection, false)
    document.getElementById('entry').addEventListener('change', select_entry, false)

    load_collections()
}

function select_collection(evt) {
    load_entries(+this.value)
}

function select_entry(evt) {
    load_taxonomy(+this.value)
}

function load_collections() {
    api.v1.account.collections().then(function (collz) {
        var target = document.getElementById('collection')
        for (var i = 0; i < collz.length; i++) {
            var id = collz[i].id
            var name = collz[i].name
            target.appendChild(el('option', {value: id}, [`${name}/${id}`]))
        }
        load_entries(462)
    })
}

function load_entries(coll_id) {
    document.getElementById('collection').value = coll_id
    window.api.ajax("GET", window.api.host + "/v1/collection/" + coll_id + "/graph")
        .then(function (graph) {
            var target = document.getElementById('entry')
            while (target.lastChild)
                target.removeChild(target.lastChild)
            for (var i = 0; i < graph.nodes.length; i++) {
                target.appendChild(el('option', {value: graph.nodes[i].id}, [""+graph.nodes[i].id]))
            }
            load_taxonomy(313)
        })
}

function load_taxonomy(entry_id) {
    document.getElementById('entry').value = entry_id
    api.v1.entry.taxonomy(entry_id).then(function (taxonomy) {
        var target = document.getElementById('taxonomy')
        
        while (target.lastChild)
            target.removeChild(target.lastChild)
        
        var root = window.tx.treeMap(taxonomy)
        root = window.tx.treeShake(root)
        var html = window.tx.htmlMap(root.tree)
        target.appendChild(html)

        console.log(taxonomy)
        console.log(root)
        console.log(cut)
        console.log(html)
    })
}
