$(document).ready(function() {
    $("#search").addClass("current-view");
    // clear all checkboxes upon refreshing the page
    $('input:checkbox').removeAttr('checked');
    $("#sort-dropdown").val("collections");
    $("#collection-dropdown").val("all");

    // stores all the queued entries
    var dataset = [];
    var selectedEntries = []
    var loggedIn = false

    var currentClassification = {
        adapting: false,
        solving: false,
        assessing: false,
        improving: false,
        planning: false,
        design: false,
        execution:false,
        analysis:false,
        people: false,
        information: false,
        sut : false,
        other : false
    }

    function getCollectionFromPreviousPage() {
        var type = window.location.hash
        return type ? type.substring(1) : null
    }

    // When clicking on a table header in the inspection view, bring up all
    // entities (classified examples) and present them in a modal.
    $('th').click(evt => {
        if (!evt.target.classList.contains('clickable'))
            return

        var facet = evt.target.dataset.facet
        var entries = dataset.filter(entry => fitsCurrentClassification(entry))

        var done = function () {
            var remaining = entries.filter(entry => entry.taxonomy === undefined).length
            if (remaining !== 0) return

            var entities = entries.map(entry => entry.taxonomy[facet.toUpperCase()])
            var unique = []

            for (var i = entities.length - 1; i >= 0; i--) {
                var entity = entities[i]
                if (!entity) continue

                for (var j = entity.length - 1; j >= 0; j--) {
                    if (unique.indexOf(entity[j]) === -1)
                        unique.push(entity[j])
                }
            }

            var $modal = el("div").addClass("modal");
            var $close = el("div").addClass("close-btn");
            $close.on("click", function(evt) {
                $(".modal").remove();
            });

            // remove if the user clicks outside the inspection view
            $("body").on("click", function(evt) {
               if (evt.target.className === "modal") {
                    $(".modal").remove();
                }
            });

            // remove modal view if escape key is pressed
            $(document).keydown(function(e) {
                if (e.keyCode === 27) {
                    $(".modal").remove();
                }
            });

            var $content = el("div");
            $content.append($close);

            $content.append(el("div").addClass("modal-entry-type").text("inspecting entities"));
            $content.append(el("div").addClass("modal-entry-title").text(facet));
            $content.append(el("div").addClass("modal-divider"));

            for (var i = 0; i < unique.length; i++) {
                var entity = el('div').text('- ' + unique[i])
                $content.append(entity)
            }

            $content.append(el("div").addClass("modal-divider"));

            $modal.append($content);
            $("body").append($modal);
        }

        var update = function (entry) {
            window.api.ajax("GET", window.api.host + "/v1/entry/" + entry.id + "/taxonomy")
                .then(taxonomy => {
                    entry.taxonomy = taxonomy
                    done()
                })
        }

        for (var i = dataset.length - 1; i >= 0; i--) {
            var entry = dataset[i]

            if (entry.taxonomy && i === 0) {
                done()
            } else if (!entry.taxonomy) {
                update(entry)
            }
        }
    })

    // everything
    var mainDataset
    // entries partitioned/collection
    var collections = {}
    function processGraph(graph, collectionName) {
        var nodes = []
        var nodemap = {}

        graph.nodes.forEach(node => {
            node.serpClassification = {}
            node.entryType = node.type
            node.date = new Date(node.date);
            delete node.type
            if (collectionName)
                node.collection = collectionName

            nodes.push(node)
            nodemap[String(node.id)] = nodes.length - 1
        })

        // mark this facet as used, use /entry/{id}/taxonomy to get full tree
        graph.edges.forEach(edge => {
            var node = nodes[nodemap[String(edge.source)]]
            node.serpClassification[edge.type.toLowerCase()] = true
        })

        return nodes
    }
    function getCollection(id, cb) {
        if (collections[id].entries) {
            cb(collections[id].entries)
            return
        }

        window.api.ajax("GET", window.api.host + "/v1/collection/" + id + "/graph")
        .done(graph => {
            collections[id].entries = processGraph(graph, collections[id].name)
            cb(collections[id].entries)
        })
        .fail(reason => cb([]))
    }
    function updateDataset(toset) {
        dataset = toset
        updateViews()
    }
    function selectDataset(value) {
        if (value === "all") {
            // set dataset = all
            if (mainDataset) {
                updateDataset(mainDataset)
                return
            }

            window.api.ajax("GET", window.api.host + "/v1/entry")
                .done(graph => {
                    mainDataset = processGraph(graph)
                    updateDataset(mainDataset)
                })
                .fail((reason, err) => window.alert(err))
        } else if (value === "mine") {
            // get all collections user is part of
            updateDataset([])
            Object.keys(collections).forEach(id => {
                getCollection(id, entries => {
                    for (var i = 0; i < entries.length; i++) {
                        var exists = false
                        for (var j = 0; j < dataset.length; j++) {
                            if (dataset[j].id === entries[i].id) {
                                exists = true
                                break
                            }
                        }
                        if (!exists)
                            dataset.push(entries[i])
                    }
                    updateDataset(dataset)
                })
            })
        } else {
            // use specific collection
            getCollection(value, entries => updateDataset(entries))
        }
    }

    function selectAllEntries(){
    //  var length = $('.table-view-area tr').length-1;
      for (i = 0; i < dataset.length; i++) {
          var entry = dataset[i];
          if (selectedEntries.indexOf(entry.id) === -1){
                selectedEntries.push(entry.id);
          }
      }
      $('.table-view-area tr').find('input[type=checkbox]').prop('checked', true);
    }

    function exportEntries(){
        if (selectedEntries.length === 0) {
            return
        }

        function submitToCollection(cID) {
            var url = window.api.host + "/v1/collection/" + cID + "/addEntry"
            selectedEntries.forEach(eID => {
                window.api.ajax("POST", url, {
                    entryId: eID
                })
                $('input[type=checkbox]').prop('checked', false)
            })
            selectedEntries = []
            $modal.remove()
        }

        function newCollection() {
            window.api.ajax("POST", window.api.host + "/v1/collection/", {
                name: $('.large-input').val()
            }).done(res => {
                var collectionId = res.id
                submitToCollection(collectionId)
            })
        }

        function existingCollection() {
            submitToCollection($('#existing').val())
        }

        var $modal = el("div").addClass("modal")

        $("body").on("click", function(evt) {
           if (evt.target.className === "modal")
                $(".modal").remove()
        })

        // remove modal view if escape key is pressed
        // FIXME: This is registered globally, so they all accumulate
        $(document).keydown(function(e) {
            if (e.keyCode === 27) {
                $(".modal").remove()
            }
        })

        var $content = el("div")
            .append(el("div").addClass("close-btn").click(() => $(".modal").remove()))
            .append(el("div").addClass("modal-entry-type").text(`export entries (${selectedEntries.length})`))
            .append(el("modal-entry-title").text("select collection"))
            .append(el("div").addClass("modal-divider"))
            .append(el("input").attr("type", "text").attr("placeholder", "new collection name").addClass('large-input'))
            .append(el("button").addClass("edit-btn").text("create new").click(newCollection))
            .append(el("div").addClass("modal-divider"))
            .append(el("select").attr('id', 'existing').append(Object.keys(collections).map(
                coll => el("option").val(collections[coll].id).text(collections[coll].name)
            )))
            .append(el("button").addClass("edit-btn").text("use existing").click(existingCollection))

        $modal.append($content)
        $("body").append($modal)
    }


    // Append a select element if logged in so user can export to new/existing
    // collection/
    window.user.self().done(self => {
        $('tr').append(el('th').text("export"))

        $('.table-view-area')
        .append(el('button').addClass('edit-btn').text('export').click(exportEntries))
        .append(el('button').addClass('edit-btn').text('select all').click(selectAllEntries))


        loggedIn = true
    })

    window.user.collections().done(collz => {
        var selector = document.getElementById('collection-dropdown')
        var requested = getCollectionFromPreviousPage()

        var mine = document.createElement('option')
        mine.setAttribute('value', "mine")
        mine.text = "show mine"

        selector.appendChild(mine)
        if (!requested || requested === 'all')
            selector.value = "all"

        collz.forEach(coll => {
            var opt = document.createElement('option')
            opt.setAttribute('value', coll.id)
            opt.text = coll.name

            collections[coll.id] = coll

            selector.appendChild(opt)
            if (requested === String(coll.id))
                selector.value = coll.id
        })
    }).always(() => {
        var selector = document.getElementById('collection-dropdown')
        var requested = getCollectionFromPreviousPage()

        if (requested && selector.value !== requested
            && requested !== 'all' && requested !== 'mine') {
            collections[requested] = { id: requested }
            var opt = document.createElement('option')
            opt.setAttribute('value', requested)
            opt.text = '#' + requested
            selector.appendChild(opt)

            selector.value = requested
        }

        selectDataset(selector.value)
    })

    $("#collection-dropdown").change(function (evt) {
        selectDataset(this.value)
        window.location.hash = this.value
    })

    // classification took place
    $(".checkbox input").on("change", function(event) {
        var subfacet = $(this).attr("name");
        currentClassification[subfacet] = !currentClassification[subfacet];
        updateViews(dataset);
    });

    function updateViews(entries) {
        clearViews();
        var currentEntries = 0;
        for (var i = 0; i < dataset.length; i++) {
            var entry = dataset[i];
            if (fitsCurrentClassification(entry)) {
                currentEntries++;
                insertIntoTable(entry);
                insertIntoOverview(entry);
            }
        }
        updateResultsText(currentEntries, dataset.length);
    }

    function updateResultsText(currentAmount, totalAmount) {
        $("#search-results-text").text("showing " + currentAmount + "/" + totalAmount + " entries");
    }

    function filterIsDefined() {
        for (var subfacet in currentClassification) {
            if (currentClassification[subfacet]) {
                return true;
            }
        }
        return false;
    }

    function fitsCurrentClassification(entry) {
        // check if classification exists and then if entry isn't classified,
        // if that's the case: throw it from the list
        for (var subfacet in currentClassification) {
            if (currentClassification[subfacet] && !entry.serpClassification[subfacet]) {
                return false;
            }
        }
        return true;
    }

    function toggleTabs() {
        $(".view-area").toggleClass("overview-bg");
        $(".table-view-area").toggleClass("hidden");
        $(".overview-area").toggleClass("hidden");
        $("#overview-tab").toggleClass("active-tab").toggleClass("unactive-tab");
        $("#table-view-tab").toggleClass("active-tab").toggleClass("unactive-tab");
    }

    $(".view-area-tab").on("click", function(evt) {
        if ($(this).hasClass("unactive-tab")) {
            toggleTabs();
        }
    });

    $("#sort-dropdown").on("change", function(evt) {
        var sortingOption = $(this).val();
        if (sortingOption == "newest") {
            dataset.sort(newestComparator);
        } else if (sortingOption == "oldest") {
            dataset.sort(oldestComparator);
        } else if (sortingOption == "collections") {
            dataset.sort(alphabeticalComparator);
        }
        updateViews(dataset);
    });

    function getClassification(){
        var classification = {
                "intevention": null,
                "adapting": null,
                "solving": null,
                "assessing": null,
                "improving":null,
                "planning":null,
                "design": null,
                "execution":null,
                "analysis":null,
                "people": null,
                "information": null,
                "sut" : null,
                "other": null
        };

        // iterate over each checkbox that has been checked
        $(".checkbox input:checked").each(function() {
             var subfacet = $(this).attr("name");
             classification[subfacet] = [];
             var $parent = $(this).closest(".sub-facet");
        });
        return classification;
    }

    function clearViews() {
        $(".overview-area").children().empty();
        $(".overview-entry").remove();
        $("#table-body").children().empty();
    }

    function createOverviewTags(entry) {
        var $entryTags = el("div").addClass("entry-tags");

        if (filterIsDefined()) {
            for (var subfacet in currentClassification) {
                if (!currentClassification[subfacet] && entry.serpClassification[subfacet]) {
                    var $tag = el("div").addClass("entry-tag").text(subfacet);
                    $entryTags.append($tag);
                }
            }
        } else {
            for (var subfacet in entry.serpClassification) {
                if (entry.serpClassification[subfacet]) {
                    var $tag = el("div").addClass("entry-tag").text(subfacet);
                    $entryTags.append($tag);
                }
            }
        }
        return $entryTags;
    }

    function insertIntoOverview(entry) {
        var classification = entry["serpClassification"];

        // created the individual html elements
        var $overviewEntry = el("div").addClass("overview-entry");
        var $entryType = el("div").addClass("entry-type").text(entry["entryType"]);


        var entryTitleText = entry["description"] || entry["reference"] || entry["doi"];
        var $entryTitle = el("div").addClass("entry-title").text(entryTitleText);
        $entryTitle.data("entry-number", dataset.indexOf(entry));

        var $entryTags = createOverviewTags(entry);

        // append them to the parent element
        $overviewEntry.append($entryType);
        $overviewEntry.append($entryTitle);
        $overviewEntry.append($entryTags);
        // insert into the DOM
        $(".overview-area").append($overviewEntry);
        $(".entry-title").unbind("click").on("click", function(evt) {
            var entryNumber = $(this).data("entry-number");
            var entry = dataset[entryNumber];

            if (entry.taxonomy) {
                buildModalView(entry);
                return
            }

            window.api.ajax("GET", window.api.host + "/v1/entry/" + entry.id + "/taxonomy")
            .done(taxonomy => {
                console.log(entry)
                entry.taxonomy = taxonomy
                buildModalView(entry)
            })
            .fail(reason => window.alert(reason))
        });
    }

    // creates a table row with the data contained in entry
    function insertIntoTable(entry, position) {
        var classification = entry["serpClassification"];

        // let's build the table row for this entry
        var $row = el("tr");
        var maxLength = 35;
        // choose as the row descriptor either the project name, description
        // (for challenges), or the reference (for research results)
        var entryTitle = entry["projectName"]  || entry["description"] || entry["reference"];
        entryTitle = entryTitle.length > maxLength ?
            entryTitle.substring(0, maxLength - 3) + "..." :
            entryTitle.substring(0, maxLength);
        var titleCell = el("td").text(entryTitle || entry["description"] || entry["reference"]);
        titleCell.data("entry-number", dataset.indexOf(entry));

        $row.append(titleCell);

        createCell("intervention", true);

        // effect
        createCell("solving");
        createCell("adapting");
        createCell("assessing");
        createCell("improving");

        // scope
        createCell("planning", true);
        createCell("design", true);
        createCell("execution", true);
        createCell("analysis", true);

        // context
        createCell("people");
        createCell("information");
        createCell("sut");
        createCell("other");

        if (loggedIn) {
            var mark = el("input").attr("type", "checkbox").val(entry.id)

            if (selectedEntries.indexOf(entry.id) >= 0)
                mark.attr('checked', 'checked')

            mark.on('change', function (evt) {
                if (this.checked) {
                    if (selectedEntries.indexOf(entry.id) === -1)
                        selectedEntries.push(entry.id)
                } else {
                    selectedEntries.splice(selectedEntries.indexOf(entry.id), 1)
                }
            })

            $row.append(mark)
        }

        // insert the row into the specified position
        if (position) {
            $("#table-view tbody tr:nth-child(" + position + ")").replaceWith($row);
        } else {
            // append row to the end of the table
            $("#table-body").append($row);
        }

        // refresh on-click listeners for all entries in first column;
        // (a click initiates an entry inspection)
        $("td:first-child").unbind("click").on("click", function(evt) {
            var entryNumber = $(this).data("entry-number");
            var entry = dataset[entryNumber];
            if (entry.taxonomy) {
                buildModalView(entry);
                return
            }

            window.api.ajax("GET", window.api.host + "/v1/entry/" + entry.id + "/taxonomy")
            .done(taxonomy => {
                entry.taxonomy = taxonomy
                buildModalView(entry)
            })
            .fail(reason => window.alert(reason))
        });

        function createCell(subfacet, alternating) {
            var $td = el("td");
            classification[subfacet] ? $td.addClass("filled-cell") : "";
            alternating ? $td.addClass("alternating-group") : "";
            $row.append($td);
        }
    }

    // convenience function for capitalizing sentences
    // TODO: rip performance (don't extend prototype, use function instead)
    String.prototype.capitalize = function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    }

    function buildModalView(entry) {
        var $modal = el("div").addClass("modal");
        var $close = el("div").addClass("close-btn");
        $close.on("click", function(evt) {
            // remove the modal view
            $(".modal").remove();
        });

        // remove if the user clicks outside the inspection view
        $("body").on("click", function(evt) {
           if (evt.target.className === "modal") {
                $(".modal").remove();
            }
        });

        // remove modal view if escape key is pressed
        $(document).keydown(function(e) {
            if (e.keyCode === 27) {
                $(".modal").remove();
            }
        });

        var $content = el("div");
        // add close btn
        $content.append($close);

        // start filling the view with entry data
        $content.append(el("div").addClass("modal-entry-type").text(entry["entryType"]));
        var entryTitle = entry["collection"]  || entry["description"] || entry["references"];
        $content.append(el("div").addClass("modal-entry-title").text(entryTitle));
        $content.append(el("div").addClass("modal-divider"));

        // populate the classification data
        var classifications = entry.serpClassification;
        var scope = ["planning", "design", "execution", "analysis"];
        var effect = ["solving", "adapting", "assessing", "improving"];
        var context = ["sut", "information", "people", "other"];

        // map the data name shorthands to their actual names
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

        function handleFacetMatch(facetName, subfacet) {
            if (!classifiedItems[facetName]) {
                var $facet = el("div").addClass("modal-header-title").text(facetName.capitalize());
                classifiedItems[facetName] = $facet;
            }

            var $subfacet = shorthandMap[subfacet]
                ? el("div").addClass("modal-sub-sub-item").text(shorthandMap[subfacet])
                : classifiedItems[facetName]

            var subfacetList = entry.taxonomy[subfacet.toUpperCase()];
            for (var i = 0; i < subfacetList.length; i++ ) {
                var detailText = subfacetList[i]
                var $subfacetDetail = el("div").addClass("modal-sub-sub-item").text(detailText);
                $subfacet.append($subfacetDetail)
            }
            classifiedItems[facetName].append($subfacet);
        }

        var classifiedItems = {
            scope: null,
            effect: null,
            context: null,
            intervention: null
        };
        for (var subfacet in classifications) {
            if (classifications[subfacet]) {
                if (scope.indexOf(subfacet) >= 0) {
                    handleFacetMatch("scope", subfacet);
                } else if (effect.indexOf(subfacet) >= 0) {
                    handleFacetMatch("effect", subfacet);
                } else if (context.indexOf(subfacet) >= 0) {
                    handleFacetMatch("context", subfacet);
                } else if (subfacet === "intervention") {
                    handleFacetMatch("intervention", subfacet)
                } else {
                    console.log("this shouldn't ever happen; inside buildModalView() " + subfacet);
                }
            }
        }

        for (var facet in classifiedItems) {
            var $facet = classifiedItems[facet];
            if ($facet) {
                $content.append($facet);
            }
        }
        $content.append(el("div").addClass("modal-divider"));

        // deal with entry type specific information
        if (entry["entryType"] === "challenge") {
            $content.append(el("div").addClass("modal-header-title").text("Description"));
            $content.append(el("div").addClass("modal-sub-item").text(entry["description"]));
        } else {
            $content.append(el("div").addClass("modal-header-title").text("References"));
            $content.append(el("div").addClass("modal-sub-item").text(entry["reference"]));
            $content.append(el("div").addClass("modal-header-title").text("DOI"));
            $content.append(el("div").addClass("modal-sub-item").text(entry["doi"]));
        }

        var $editBtn = el("button").addClass("edit-btn").text("edit");
        $editBtn.on("click", function(evt) {
            $(".modal").remove();
            window.location = "/submit.html?e=" + entry.id;
        });
        $content.append($editBtn);

        $modal.append($content);
        $("body").append($modal);
    }
});

function newestComparator(a, b) {
    return b.date - a.date;
}

function oldestComparator(a, b) {
    return a.date - b.date;
}

function alphabeticalComparator(a, b) {
    return a.collection.localeCompare(b.collection);
}

// more efficient way of creating elements than purely using jquery;
// basically an alias for document.createElement - returns a jquery element
function el(elementType) {
    return $(document.createElement(elementType));
}
