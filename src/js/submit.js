$(document).ready(function() {

    window.addEventListener("beforeunload", function (e) {
      if(queuedEntries.length > 0){
         var message = "You have unsaved entries queued.\n\n"
            + "Do you still want to leave?";
         e.returnValue = message;
         return message;
      }
    });

    var querystring = {}
    // find a more permanent fix for this
    // without setTimeout the additional-data elements don't appear in firefox,
    if (window.location.search) {
        var params = window.location.search.substring(1).split('&')
        for (var i = 0; i < params.length; i++) {
            var split = params[i].indexOf('=')
            var name = params[i].substring(0, split)
            var value = params[i].substring(split + 1)

            querystring[name] = value
        }
    }

    // set the little white line underneath the submit title
    $("#submit").addClass("current-view");

    function updateCollectionList() {
        return window.user.collections().done(collz => {
            var def = 0
            $("#collection")
                .empty()
                .append(collz.map(coll => {
                    if (coll.name === "default")
                        def = coll.id
                    return jqEl("option")
                        .text(coll.name)
                        .attr("value", coll.id)
                    })
                ).val(querystring.c || def)
        })
    }
    updateCollectionList()

    //booleans to limit number of error messages
    var researchComplaint=false;
    var challengeComplaint=false;

    // load the requested entry if we have one
    var currentEntry = undefined
    if (querystring.e) {
        var eurl = window.api.host + "/v1/entry/" + querystring.e
        window.api.ajax("GET", eurl)
            .done(entry => {
                window.api.ajax("GET", eurl + "/taxonomy").done(taxonomy => {
                    currentEntry = entry

                    entry.serpClassification = taxonomy
                    entry.entryType = entry.type

                    fillAccordingToEntry(entry, true)
                })
            })
    }

    // clear all checkboxes upon refreshing the page
    $('input:checkbox').removeAttr('checked');

    // clear any cached data in the new collection field
    $("#new-collection").val("");

    // stores all the queued entries
    var queuedEntries = [];

    // fill each key with an array of strings for which to autocomplete on
    // current data is for illustration purposes
    var autocompleteMap = {
        "intervention": [],
        "adapting": [],
        "solving": [],
        "assessing": [],
        "improving": [],
        "planning": [],
        "design":  [],
        "execution": [],
        "analysis": [],
        "people":  [],
        "information": [],
        "sut" : [],
        "other": []
    };

    // load taxonomy for autocomplete purposes only
    window.api.ajax("GET", window.api.host + "/v1/entry/taxonomy").done(taxonomy => {
        for (var i = 0; i < taxonomy.length; i++) {
            var facet = taxonomy[i]
            autocompleteMap[facet.facet.toLowerCase()] = facet.text
        }
    })

    // the various categories that make up the effect facet
    var effectSubfacets = ["solving", "adapting", "assessing", "improving"];

    // show the corresponding input boxes depending on the previously set entry type
    var currentType = $(".circular-checkbox input:checked").val();
    if (currentType === "research") {
        $("#description-area").hide();

    } else if (currentType === "challenge") {
        $("#reference-area").hide();
        $("#doi-area").hide();
    }



    function submitEntry(entry) {
        var id = entry.id

        if (!id)
            return window.api.json("POST", window.api.host + "/v1/entry/new", entry)

        delete entry.id
        return window.api.json("PUT", window.api.host + "/v1/entry/" + id, entry)
    }

    function getClassification() {
        var classification = {
                "intervention": null,
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

        $(".checkbox input:checked").each(function() {
            var subfacet = $(this).attr("name");
            classification[subfacet] = [];
            var $parent = $(this).closest(".sub-facet");
            var $additionalData = $parent.find(".additional-data-wrapper input");
            $additionalData.each(function() {
                // save the additional data for this subfacet
                classification[subfacet].push($(this).val());
            })
            // if entry was selected but not examplified, tell backend it is unspecified
            if (!classification[subfacet].length)
                classification[subfacet].push("unspecified")
        });

        return classification;
    }

    function clearPageState() {
        clearInputBoxes();
        clearCheckboxes();
        enableEffectFacet();
    }

    function clearCheckboxes() {
        // iterate over each checkbox that has been checked
        $(".checkbox input:checked").each(function() {
            var $parent = $(this).closest(".sub-facet");
            // remove the checks from checkboxes and its associated divs
            $(this).attr("checked", false);
            $parent.find(".additional-data").remove();
            $parent.find(".additional-data-wrapper").remove();
        });
    }

    // clear input boxes (but leave collection selection intact for workflow reasons)
    function clearInputBoxes() {
        $("#doi").val("");
        $("#reference").val("");
        $("#description").val("");
    }

    function enableEffectFacet() {
        for (var i = 0; i < effectSubfacets.length; i++) {
            var subfacet = effectSubfacets[i];
            var $input = $("#" + subfacet + "-box");
            // enable all of the subfacets once again
            $input.removeAttr("disabled");
            $input.closest("label.sub-facet").removeClass("disabled-subfacet");
        }
    }

    function disableEffectFacet(name) {
        for (var i = 0; i < effectSubfacets.length; i++) {
            var subfacet = effectSubfacets[i];
            if (subfacet !== name) {
                var $input = $("#" + subfacet + "-box");
                $input.attr("disabled", "true");
                $input.closest("label.sub-facet").addClass("disabled-subfacet");
            } else {
            }
        }
    }

    // creates a table row with the data contained in entry
    function insertIntoTable(entry, position) {
        var classification = entry["serpClassification"];

        // let's build the table row for this entry
        var $row = jqEl("tr");
        var maxLength = 35;

        // choose as the row descriptor either the description (for challenges)
        if (entry.entryType === "challenge") {
            var entryTitle = entry["description"];
        // or the reference (for research results)
        } else {
            var entryTitle = entry["reference"];
        }
        entryTitle = entryTitle.length > maxLength ?
            entryTitle.substring(0, maxLength - 3) + "..." :
            entryTitle.substring(0, maxLength);
        var entryNumber = position ? position : queuedEntries.length - 1;
        var titleCell = jqEl("td").text(entryTitle || entry["description"] || entry["reference"]);
        titleCell.data("entry-number", entryNumber);

        $row.append(titleCell);

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

        // position + 2 rationale: nth-child(1) === table head
        // => we need to offset with 1
        // insert the updated row
        if (position!=null) {
            $("#queue-table tr:nth-child(" + (position + 2 /* to account for table header */) + ")").replaceWith($row);
        } else {
            // append row to the end of the table
            $("#queue-table tr:last").after($row);
        }

        // refresh on click listeners for all entries in first column;
        // this click initiates an inspection and possibly change of the entry
        // contents
        $("td:first-child").on("click", function(evt) {
            $("td:first-child").removeClass("selected-entry-in-queue");
            var entryNumber = $(this).data("entry-number");
            $("#submit-btn").data("currentEntry", entryNumber);
            var entry = queuedEntries[entryNumber];
            $(this).addClass("selected-entry-in-queue");
            discardEntryChanges();
            fillAccordingToEntry(entry);
        });

        function createCell(subfacet, alternating) {
            var $td = jqEl("td");
            classification[subfacet] ? $td.addClass("filled-cell") : "";
            alternating ? $td.addClass("alternating-group") : "";
            $row.append($td);
        }
    }

    function getEntry() {
        if ($("#collection").attr("disabled") === "disabled") {
            // if dropdown is disabled => use input for new collection name
            var collection = $("#new-collection").val();
            // add the new collection name to the dropdown
            var $option = jqEl("option").attr("value", collection).text(collection);
            $("#collection").append($option);
        } else {
            // otherwise, use selected option in dropdown
            var collection = $("#collection").val();
        }

        var entry = {
            entryType: $(".circular-checkbox input:checked").val(),
            collection: collection,
            reference: $("#reference").val(),
            description: $("#description").val(),
            doi: $("#doi").val(),
            date: new Date(),
            serpClassification: getClassification(),
            id: currentEntry && currentEntry.id,
            contact: currentEntry && currentEntry.contact
        };
        currentEntry = undefined

        return entry;
    }

    function entryIsValid(entry) {
        if (entry.entryType == "research") {
            return entry.reference.length > 0;
        } else if (entry.entryType == "challenge") {
            return entry.description.length > 0;
        }
        return true;
    }

    function complain(entry) {
        if (entry.entryType == "research") {
            if (researchComplaint==false && entry.reference.length < 1) {
                researchComplaint=true;
                $("#reference-area").append(jqEl("div").addClass("complaint").text("please supply information"));
            }
        } else if (entry.entryType == "challenge") {
            if (challengeComplaint==false && entry.description.length < 1) {
                challengeComplaint=true;
                $("#description-area").append(jqEl("div").addClass("complaint").text("please supply information"));
            }
        }
    }

    //removes all error messages
    function clearComplaints() {
        $(".complaint").remove();
        researchComplaint=false;
        challengeComplaint=false;
    }

    function fillAccordingToEntry(entry, noswap) {
        // fill in the input fields
        for (var key in entry) {
            $("#" + key).val(entry[key]);
        }

        // toggle the correct radio button
        $("#" + entry["entryType"] + "-button").trigger("click");
        var classifications = entry["serpClassification"];

        // fill in the correct checkboxes
        for (var key in classifications) {
            var subfacet = key.toLowerCase()
            if (classifications[key]) {
                var $subfacetInput = $("#" + subfacet + "-box");
                $subfacetInput.trigger("click");

                var subfacetData = classifications[key];
                if (subfacetData[0] === "unspecified")
                    continue
                // fill in the additional data that's been specified for the checkboxes
                for (var i = 0; i < subfacetData.length; i++) {
                    var datum = subfacetData[i];
                    var $additionalData = createAdditionalInput(subfacet, $subfacetInput.closest(".sub-facet"));
                    $additionalData.val(datum);
                }
            }
        }
        if (!noswap)
            swapButtons();
    }

    function swapButtons() {
        $("#queue-btn").text("cancel");
        $("#submit-btn").text("save");
        $("#remove-btn").show();
    }

    function restoreButtons() {
        $("#queue-btn").text("queue");
        $("#submit-btn").text("submit");
        $("#remove-btn").hide();
    }

    function saveEntryChanges(entryNumber) {
        var editedEntry = getEntry();
        queuedEntries[entryNumber] = editedEntry;
        insertIntoTable(editedEntry, entryNumber);
    }

    function removeEntry(entryNumber) {
        // remove the entry from the table
        var position = entryNumber + 2;
        $("#queue-table tr:nth-child(" + position + ")").remove();
        // remove from our internal array
        queuedEntries.splice(entryNumber, 1);
        // update data attribute of the table cells after the removed entry
        var $cells = $("td:first-child");
        $cells.splice(0, entryNumber);
        $cells.each(function(cell) {
            var $cell = $($cells[cell]);
            var oldEntryNumber = $cell.data("entryNumber");
            $cell.data("entryNumber", oldEntryNumber - 1);
        });
        // clear the input boxes
        discardEntryChanges();
    }

      function discardEntryChanges() {
        clearPageState();
        // clear data on submit-btn
        jQuery.removeData($("#submit-btn"), "currentEntry");

        // clear checkbox related stuff
        $('input:checkbox').removeAttr('checked');
        $(".additional-data").remove();
        $(".additional-data-wrapper").remove();

        // clear stuff related to creating a new collection
        $("#collection").removeAttr("disabled");
        $("#collection").removeClass("disabled-dropdown");
        $("#submit-create-collection").text("create a new collection");
        var $newCollection = $("#new-collection");
        $newCollection.slideUp();
        if ($newCollection.val().length > 0) {
            $("#collection").val($newCollection.val());
        }
        $newCollection.val("");
    }

    /* Wrapper for toggling buttons */
    function disableButton(el) {
        el.prop("disabled", true).addClass("submit-disabled")
    }
    function enableButton(el) {
        el.prop("disabled", false).removeClass("submit-disabled")
    }

    /* Placeholder for something more legit */
    function flashErrorMessage(msg) {
        window.alert(`Error: ${msg}`)
    }

    /**
     * Goes through the queued entries and posts them to backend, disabling
     * the button while submitting to prevent multiple submissions. Will stop
     * when any entry didn't succeed, or when all entries were posted.
     */
    $("#submit-queue-btn").on("click", function(evt) {
        var $this = $(this)
        disableButton($this)

        var submit = () => {
            if (queuedEntries.length === 0) {
                enableButton($this)
                return
            }

            // Post entries in the same order as the table
            var entry = queuedEntries[0]
            removeEntry(0)

            submitEntry(entry)
            .fail(xhr => {
                // Stop queue submission on failure and re-add the failed entry
                // to allow quick-fixes and prevent ppl from losing work.
                queuedEntries.unshift(entry)
                insertIntoTable(entry, 0)
                flashErrorMessage(xhr.responseText)
                enableButton($this)
            })
            .done(() => setTimeout(submit, 0))
        }

        submit()
    });

    $("#submit-create-collection").on("click", function(evt) {
        var create = new window.modal(
		    el('div.modal-header-title', ['create collection']),
            el('input.submit-input-box', {placeholder: 'my best entries'}, [])
        );

        create.
		    confirm('create', (evt) => {
			    create.toggleButtonState()

                window.api.ajax("POST", window.api.host + "/v1/collection/", {
                    name: create.div.querySelector('input').value
                })
                    .done(ok => {
                        document.body.removeChild(create.div)

                        // Use internal qs to avoid messing up user
                        querystring.c = ok.id
                        updateCollectionList()
                    })
                    .fail(xhr => {
                        window.alert(xhr.responseText)
                        modal.toggleButtonState()
                    })
            }).
            cancel('cancel').
            show();
    });

    $("#submit-btn").on("click", function(evt) {
        var $thisEl = $(this);
        if ($thisEl.text() === "submit") {
            var entry = getEntry();
            if (entryIsValid(entry)) {
                submitEntry(entry)
                    .done(ok => clearPageState())
                    .fail((xhr, err, aa) => {
                        window.alert(`Submit failed: ${xhr.responseText}`)
                    })
                    .always(() => {
                        enableButton($thisEl)
                    })
            } else {
                complain(entry);
            }
        // acts as save button
        } else {
            var entryNumber = $thisEl.data("currentEntry");
            saveEntryChanges(entryNumber);
            clearPageState();
            restoreButtons();
            discardEntryChanges();
        }
    });

    $("#load-btn").on("click", function(evt) {
        var test = window.user.self().done(ok=>{
            var deleteAccountModal = {
                desc: "Load an entry",
                input: ok.entries
            };
            window.modals.listModal(deleteAccountModal,function (args) {
                window.api.ajax("GET", window.api.host + "/v1/entry/"+args).done(ok=>{
                      $("#" + ok.type + "-button").trigger("click");
                      fillAccordingToEntry(ok,true);
                })
            })
        })
    });

    $("#queue-btn").on("click", function(evt) {
        var $thisEl = $(this);
        clearComplaints();
        // used as the queue button
        if ($thisEl.text() === "queue") {
            pushEntry(getEntry());
        // used as the cancel button
        } else {
            $("td:first-child").removeClass("selected-entry-in-queue");
            restoreButtons();
            discardEntryChanges();
        }
    });

    function pushEntry(entry){
        if (entryIsValid(entry)) {
          clearPageState();
          queuedEntries.push(entry);
          insertIntoTable(entry);
          discardEntryChanges();
        } else {
            complain(entry);
        }
    }

    $("#import-json-btn").on("click", function(evt) {
        window.import.fromFile(pushEntry);
    });

    $("#remove-btn").on("click", function(evt) {
        // data's stored in the submit button
        var entryNumber = $("#submit-btn").data("currentEntry");
        removeEntry(entryNumber);
        restoreButtons();
    });

    $("#toggle-queue").on("click", function(evt) {
        $("#queue-table").toggle();

        if ($("#toggle-queue").text().indexOf("hide") > -1) {
            $("#toggle-queue").text("show table");
            $("#toggle-chevron").removeClass("hide-chevron");
            $("#toggle-chevron").addClass("show-chevron");
        } else {
            $("#toggle-queue").text("hide table");
            $("#toggle-chevron").removeClass("show-chevron");
            $("#toggle-chevron").addClass("hide-chevron");
        }
    });

    // an entry type was chosen
    $(".circular-checkbox input").on("change", function(evt) {
        $("#reference-area").slideToggle();
        $("#description-area").slideToggle();
        $("#doi-area").slideToggle();
        clearComplaints();
        updateCheckboxText();
    });

  // event handler for classifying submissions
    $(".checkbox input").on("click", function(evt) {
        var thisEl = $(this);
        var name = thisEl.attr("name");


        // if the input box has been checked
        if (thisEl.is(":checked")) {
            // create the additional info text snippet
            var descriptor = getAdditionalDataDescriptor(name);
            var $infoText = jqEl("div").addClass("additional-data").text("click to add " + descriptor + " +");

            // create an event handler for when the text snippet is clicked on
            $infoText.on("click", function(evt) {
                createAdditionalInput(name, $(this).parent());
            });

            thisEl.closest("label.sub-facet").append($infoText)

            // check to see if the checkbox that was clicked was part of the
            // effect facet
            if (effectSubfacets.indexOf(name) > -1) {
                disableEffectFacet(name);
            }
        } else {
            // check to see if an effect subfacet was unchecked
            if (effectSubfacets.indexOf(name) > -1) {
                enableEffectFacet();
            }
            thisEl.closest("label.sub-facet").find(".additional-data-wrapper").remove();
            thisEl.closest("label.sub-facet").find(".additional-data").remove();
        }
    });


    var additionalDataDescriptors = {
        // format is the following:
        // subfacet:
        //    [challenge text, research text]

        // Intervention facet
        "intervention":
            ["an intervention under study", "an intervention under study"],

        // Effect facet
        "adapting":
            ["description of test context challenge", "targeted test context"],
        "solving":
            ["a problem description", "a problem description"],
        "assessing":
            ["assessment target", "observed effect on test assessment"],
        "improving":
            ["improvement target", "observed improvement"],

        // Scope facet
        "planning":
            ["a task-description", "a task-description"],
        "design":
            ["a task-description", "a task-description"],
        "execution" :
            ["a task-description", "a task-description"],
        "analysis":
            ["a task-description", "a task-description"],

        // Context facet
        "people":
            ["description of a delimiting factor", "description of a delimiting factor"],
        "information":
            ["description of a delimiting factor", "description of a delimiting factor"],
        "sut" :
            ["description of a delimiting factor", "description of a delimiting factor"],
        "other":
            ["description of a delimiting factor", "description of a delimiting factor"]
    }

    function getAdditionalDataDescriptor(subfacet) {
        var isChallenge = $(".circular-checkbox input:checked").val() === "challenge";
        var descriptor = isChallenge ? additionalDataDescriptors[subfacet][0] : additionalDataDescriptors[subfacet][1];
        return descriptor;
    }

    function updateCheckboxText() {
        for (var subfacet in additionalDataDescriptors) {
            var descriptor = getAdditionalDataDescriptor(subfacet);
            $("#" + subfacet + "-box").parent().siblings(".additional-data").text("click to add " + descriptor + " +");
        }
    }

    // factory function to create and insert the input element for supplying the additional data
    function createAdditionalInput(text, element) {
        var $inputParent = jqEl("div").addClass("additional-data-wrapper").addClass("ui-widget");
        var $input = jqEl("input").attr("placeholder", "enter additional data for " + text).attr("name", text);
        $input.addClass("facet-additional-input");

        // we need an id for jquery ui's autocomplete to work
        // idName e.g. "analysis" from "analysis-box" etc
        var idName = element.children().children().attr("id").split("-")[0];
        var idAttr = idName + $(".facet-additional-input").length;
        $input.attr("id", idAttr);

        var $removeBtn = jqEl("div");
        $removeBtn.addClass("remove-additional-data");
        $removeBtn.on("click", function(evt) {
            $(this).parent().remove();
        });

        $inputParent.append($input);
        $inputParent.append($removeBtn);
        element.append($inputParent);

        // need an id for jquery ui's autocomplete to work
        $("#" + idAttr).autocomplete({source: autocompleteMap[idName]});
        return $input;
    }

    // more efficient way of creating elements than purely using jquery;
    // basically an alias for document.createElement - returns a jquery element
    function jqEl(elementType) {
        return $(document.createElement(elementType));
    }
});
