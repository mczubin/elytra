function append(item, calories, count = 1) {
    $(".entries > tbody").append(`
            <tr class='entry'>
            <td  style='width: 100px''>  
                <div class="input-group form-group-sm">
                   <button type="button" class="btn btn-dark btn-sm btn-sub">-</button>
                   <input value="${count}" type="number" style="text-align: center; " class="count form-control form-control-sm input-sm bg-dark text-light border-dark">
                   <button type="button" class="btn  btn-dark btn-sm btn-add">+</button>
                </div>
             </td>
             <td contenteditable='true' class='item'>${item}</td>
             <td contenteditable='true' class='calories'>${calories}</td>
            </tr>`);
}

function quick(item, calories, count = 1) {
    let lastEntry = $("tr.entry").last();
    if (lastEntry.length > 0 && hasWhiteSpace(lastEntry.find(".item").html())) {
        lastEntry.remove()
    }

    let foundItem = null;

    iterEntries(function ($this) {
        let candidate = $this.find(".item");

        if (candidate.html() === item) {
            foundItem = candidate;
        }
    });

    if (foundItem) {
        let counter = foundItem.siblings().find('.count');
        let val = counter.val();
        counter.val(++val);
        triggerChange();
    } else {
        append(item, calories, count);
    }
    triggerChange();
}

const entryPrefix = 'entries-';

function loadNotes() {
    if (localStorage.length !== 0) {
        var oldest = null;

        Object.keys(localStorage).filter(x => x.startsWith(entryPrefix)).forEach(function (key) {
            if (oldest == null)
                oldest = key

            // is newer
            if (new Date(key.substring(entryPrefix.length)) > new Date(oldest.substring(entryPrefix.length))) {
                oldest = key
            }
        });

        if (oldest != null) {
            let entries = localStorage.getItem(oldest);

            for (let entry of JSON.parse(entries)) {
                append(entry.item, entry.calories, entry.count);
            }
        }
    }
}

function hasWhiteSpace(s) {
    return s.replace("<br>", "").trim() === ""
}


function iterEntries(callback) {
    $("tr.entry").each(function () {
        callback($(this));
    });
}

function calcTotal() {
    let total = 0
    iterEntries(function ($this) {
        let item = $this.find(".item").html();
        let calories = $this.find(".calories").html();
        let count = $this.find(".count").val();

        if (!hasWhiteSpace(item)) {
            if (count > 0)
                total += parseInt(calories.replace(/[-]\D/g, ''), 10) * count;
        }
    });

    return total;
}

function triggerChange() {
    var entries = []

    let total = 0
    iterEntries(function ($this) {
        let item = $this.find(".item").html();
        let calories = $this.find(".calories").html();
        let count = $this.find(".count").val();

        if (!hasWhiteSpace(item)) {

            if (count > 0)
                total += parseInt(calories.replace(/[-]\D/g, ''), 10) * count;

            if (count >= 0) {
                $this.removeClass('table-warning');
            }
            if (count < 0) {
                $this.addClass('table-warning');
            }
            if (count < -1) {
                $this.remove();
            }

            var entry = {
                item: item,
                calories: calories,
                count: count
            }

            entries.push(entry);
        }
    });

    let key = entryPrefix + new Date().toISOString();
    localStorage.setItem(key, JSON.stringify(entries))

    $(".title-counter").text("Calories " + total);

    let lastEntry = $("tr.entry").last();
    if (lastEntry.length < 1 || !hasWhiteSpace(lastEntry.find(".item").html())) {
        append('', '');
    }
}

function clearEntryStorage() {
    Object.keys(localStorage).filter(x => x.startsWith(entryPrefix)).forEach(function (key) {
        localStorage.removeItem(key)
    });
}

$(window).on('load', function () {
    loadNotes();
    clearEntryStorage();
    triggerChange();

    $('.entries').on('input', (e) => {
        triggerChange();
    });

    $('.entries').on("click", ".btn-sub", function () {
        let val = $(this).siblings('.count').val();
        $(this).siblings('.count').val(--val);
        triggerChange();
    });

    $('.entries').on("click", ".btn-add", function () {
        let val = $(this).siblings('.count').val();
        $(this).siblings('.count').val(++val);
        triggerChange();
    });

    $($('#clear').click(function () {
        $(".entries > tbody").empty();
        clearEntryStorage();
        triggerChange();
    }));


    // load goal
    if (localStorage.getItem('goal'))
        $('.goal').text(localStorage.getItem('goal'));
    else
        $('.goal').text('0');
    $('.goal').on('input', (e) => {
        if (!$('.goal').text())
            $('.goal').text('0');

        localStorage.setItem('goal', $('.goal').text());
    });

    $($('#finish').click(function () {
        const dailyMax = $('.intake').text();
        let total = dailyMax - calcTotal();
        let updatedGoal = (parseInt($('.goal').text()) - total) + '';
        localStorage.setItem('goal', updatedGoal);
        $('.goal').text(updatedGoal);

        $(".entries > tbody").empty();
        clearEntryStorage();
        triggerChange();
    }));
});


