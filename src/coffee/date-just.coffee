###
The MIT License (MIT)

Copyright (c) 2016 Callum Hart

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
###

noop = ->

class DateJust
  defaultOptions:
    dragSelection: yes
    scrollControl: yes
    minDate: new Date(new Date().getFullYear() - 10, 0, 1) # January 10 years in the past
    maxDate: new Date(new Date().getFullYear() + 10, 11, 31) # December 10 years in the future
    onDateSelected: noop # External hook
    onDateRangeSelected: noop # External hook

  today: new Date()
  version: "0.1.0"

  constructor: (selector, options) ->
    @handleElm selector

    if @elm
      @options = Utils.extend {}, @defaultOptions, options
      @options = Utils.extend {}, @options, @ # Check this is best practise for callbacks, look into only making some methods public.
      @activeDate = @options.existingDate or @options.existingDateRange?[0] or @today
      @handleMinsAndMaxs()
      @handleTemplate()
      @bindPersistentEvents()
      @handleExistingDate() if @options.existingDate
      @handleExistingDateRange() if @options.existingDateRange
    else
      console.warn "DateJust couldn't initialize #{selector} as it's not in the DOM"

  # You can initialize DateJust with a class/id selector or with an actual DOM element.
  handleElm: (selector) ->
    if typeof selector is "string"
      @elm = document.querySelector selector
    else if typeof selector is "object"
      # Check that object is an actual dom element.
      if selector.nodeName
        @elm = selector

  handleMinsAndMaxs: ->
    @minMonth = @options.minDate.getMonth()
    @minYear = @options.minDate.getFullYear()
    @maxMonth = @options.maxDate.getMonth()
    @maxYear = @options.maxDate.getFullYear()

  # ************************************************************
  # Events
  # ************************************************************

  bindPersistentEvents: -> # Events that listen even when DateJust isn't being used.
    @monthSelect.addEventListener "change", @selectMonth
    @yearSelect.addEventListener "change", @selectYear
    @previousMonth.addEventListener "click", @goBackMonth
    @nextMonth.addEventListener "click", @goForwardMonth
    @days.addEventListener "click", @selectDay

    if @options.dragSelection
      @days.addEventListener "mousedown", @onMouseDown
      @days.addEventListener "mousemove", @handleDateRange
      @days.addEventListener "mouseup", @onMouseUp
      @days.addEventListener "mouseleave", @onMouseLeave

    if @options.scrollControl
      @days.addEventListener "wheel", Utils.throttle(@onWheel, 200)

  # ************************************************************
  # Actions
  # ************************************************************

  selectDay: (e) =>
    e.preventDefault()
    @removeDateRangeHighlight()

    if e.target.tagName is "A"
      # Remove highlight from previous active day, if there is one.
      @removeActiveDay() if @activeDay
      @activeDay = e.target

      if @activeDay.classList.contains "in-previous-month"
        @goBackMonth()
        @activeDay = @days.querySelector("a.in-this-month[data-date='#{@activeDay.dataset.date}']")
      else if @activeDay.classList.contains "in-next-month"
        @goForwardMonth()
        @activeDay = @days.querySelector("a.in-this-month[data-date='#{@activeDay.dataset.date}']")
      else
        @activeDate = new Date(@activeDay.dataset.date)

      Utils.addClass "active-day", @activeDay
      @options.onDateSelected @activeDate

  removeActiveDay: ->
    Utils.removeClass "active-day", @activeDay

  onMouseDown: (e) =>
    @mouseDown = yes
    @resetDateRangeIndexes()
    @startIndex = parseInt e.target.dataset.index

  handleDateRange: (e) =>
    e.preventDefault()

    if @mouseDown
      @selectDateRange e

  onMouseUp: (e) =>
    @mouseDown = no

    # endIndex only exists when selecting a date range.
    if @endIndex
      startDate = new Date(@days.querySelector("a[data-index='#{@startIndex}']").dataset.date)
      endDate = new Date(@days.querySelector("a[data-index='#{@endIndex}']").dataset.date)
      @options.onDateRangeSelected startDate, endDate

  onMouseLeave: =>
    @mouseDown = no

  onWheel: (e) =>
    unless @mouseDown
      wheelDistance = Utils.wheelDistance e

      if wheelDistance isnt 0
        directionIsDown = Utils.wheelDirection e
        if directionIsDown then @goForwardMonth() else @goBackMonth()

  selectDateRange: (e) =>
    if e.target.tagName is "A"

      unless @endIndex is parseInt e.target.dataset.index
        @endIndex = parseInt e.target.dataset.index
        # Remove highlight from previous active day, if there is one.
        @removeActiveDay() if @activeDay
        @removeDateRangeHighlight()
        @highlightDateRange()

  removeDateRangeHighlight: ->
    days = @days.querySelectorAll "a"

    i = 0
    while i < days.length
      Utils.removeClass "day-in-range", days[i]
      i++

  highlightDateRange: ->
    days = @days.querySelectorAll "a"

    i = 0
    while i < days.length
      dayIndex = parseInt days[i].dataset.index

      if dayIndex >= @startIndex and dayIndex <= @endIndex
        Utils.addClass "day-in-range", days[i]

      if dayIndex <= @startIndex and dayIndex >= @endIndex
        Utils.addClass "day-in-range", days[i]
      i++

  handleExistingDate: ->
    @activeDay = @days.querySelector("a[data-date='#{@activeDate}']")
    Utils.addClass "active-day", @activeDay

  handleExistingDateRange: ->
    @startIndex = parseInt @days.querySelector("a[data-date='#{@options.existingDateRange[0]}']").dataset.index
    @endIndex = parseInt @days.querySelector("a[data-date='#{@options.existingDateRange[1]}']").dataset.index
    @highlightDateRange()

  resetDateRangeIndexes: ->
    @startIndex = null
    @endIndex = null

  selectMonth: (e) =>
    month  = parseInt e.target.value

    if month < @activeDate.getMonth()
      while month < @activeDate.getMonth()
        @goBackMonth()
    else
      while month > @activeDate.getMonth()
        @goForwardMonth()

  selectYear: (e) =>
    newDate = new Date(parseInt(e.target.value), @activeDate.getMonth(), 1)

    if newDate < @options.minDate
      newDate.setMonth @minMonth
    else if newDate > @options.maxDate
      newDate.setMonth @maxMonth

    @activeDate = newDate
    @drawDate @activeDate
    @render @monthSelect, @generateMonthOptions()
    @setMonthSelect()

  reset: ->
    @activeDate = @options.existingDate or @options.existingDateRange?[0] or @today
    @drawDate @activeDate

  # ************************************************************
  # Helpers
  # ************************************************************

  getDayName: (dayInt) ->
    switch dayInt
      when 0 then dayName = "Sunday"
      when 1 then dayName = "Monday"
      when 2 then dayName = "Tuesday"
      when 3 then dayName = "Wednesday"
      when 4 then dayName = "Thursday"
      when 5 then dayName = "Friday"
      when 6 then dayName = "Saturday"

    dayName

  getMonthName: (monthInt) ->
    switch monthInt
      when 0 then monthName = "January"
      when 1 then monthName = "February"
      when 2 then monthName = "March"
      when 3 then monthName = "April"
      when 4 then monthName = "May"
      when 5 then monthName = "June"
      when 6 then monthName = "July"
      when 7 then monthName = "August"
      when 8 then monthName = "September"
      when 9 then monthName = "October"
      when 10 then monthName = "November"
      when 11 then monthName = "December"

    monthName

  getDaysInMonth: (month, year) ->
    # From: http://www.w3resource.com/javascript-exercises/javascript-date-exercise-3.php#
    new Date(year, month + 1, 0).getDate()

  getPreviousMonth: (date) ->
    ###
      Set date to the 1st of previous month. Prevents issues when going back from a day that
      doesn't exist in the previous month.

      i.e Fixes issue of:
      31st March to Febuary results in March 2nd (as theres only 29 days in Febuary)
    ###
    new Date(date.getFullYear(), date.getMonth() - 1, 1)

  getNextMonth: (date) ->
    ###
      Set date to the 1st of next month. Prevents issues when going forward from a day that
      doesn't exist in the next month.

      i.e Fixes issue of:
      31st January to Febuary results in March 2nd (as theres only 29 days in Febuary)
    ###
    new Date(date.getFullYear(), date.getMonth() + 1, 1)

  makeNewDate: (date) ->
    month = date.getMonth()
    year = date.getFullYear()
    day = date.getDate()
    new Date year, month, day

  # ************************************************************
  # External methods
  # ************************************************************

  setDate: (date) ->
    if date < @options.minDate
      console.warn "DateJust has a minimum date of: #{@options.minDate}"
    else if date > @options.maxDate
      console.warn "DateJust has a maximum date of: #{@options.maxDate}"
    else
      @activeDate = date
      @drawDate @activeDate
      # Remove highlight from previous active day, if there is one.
      @removeActiveDay() if @activeDay
      @activeDay = @days.querySelector("a[data-date='#{@activeDate}']")
      Utils.addClass "active-day", @activeDay
      @options.onDateSelected @activeDate

  goBackMonth: (e) =>
    e?.preventDefault()
    previousMonth = @getPreviousMonth @activeDate
    # Normalize minDate to match day in previousMonth
    minDate = new Date(@makeNewDate(@options.minDate).setDate(@activeDate.getDate()))

    unless previousMonth < minDate
      @activeDate = previousMonth
      @drawDate @activeDate
    else
      console.warn "DateJust has a minimum date of: #{@options.minDate}"

  goForwardMonth: (e) =>
    e?.preventDefault()
    nextMonth = @getNextMonth @activeDate
    # Normalize maxDate to match day in nextMonth
    maxDate = new Date(@makeNewDate(@options.maxDate).setDate(@activeDate.getDate()))

    unless nextMonth > maxDate
      @activeDate = nextMonth
      @drawDate @activeDate
    else
      console.warn "DateJust has a maximum date of: #{@options.maxDate}"

  # ************************************************************
  # Templating
  # ************************************************************

  render: (elm, template) ->
    elm.innerHTML = template

  handleTemplate: ->
    @template = """
                <div class="dj-header">
                  <div class="dj-month">
                    <span class="dj-month-name"></span>
                    <select class="dj-month-select">
                      {{monthOptions}}
                    </select>
                  </div>

                  <div class="dj-year">
                    <span class="dj-year-name"></span>
                    <select class="dj-year-select">
                      {{yearOptions}}
                    </select>
                  </div>

                  <a href="" class="previous-month">&#9654;</a>
                  <a href="" class="next-month">&#9654;</a>
                </div>

                <ul class="day-names">
                  <li>M</li>
                  <li>T</li>
                  <li>W</li>
                  <li>T</li>
                  <li>F</li>
                  <li>S</li>
                  <li>S</li>
                </ul>

                <ul class="days"></ul>
                """

    @template = @template.replace "{{monthOptions}}", @generateMonthOptions()
    @template = @template.replace "{{yearOptions}}", @generateYearOptions()
    @render @elm, @template

    # Now that DateJust is rendered we can do DOM related things.
    @monthName = @elm.querySelector ".dj-month-name"
    @yearName = @elm.querySelector ".dj-year-name"
    @monthSelect = @elm.querySelector ".dj-month-select"
    @yearSelect = @elm.querySelector ".dj-year-select"
    @previousMonth = @elm.querySelector ".previous-month"
    @nextMonth = @elm.querySelector ".next-month"
    @days = @elm.querySelector ".days"
    Utils.addClass "dj-container", @elm

    @drawDate @activeDate

  drawDate: (date) ->
    @handleMonthControls date
    @drawHeaderDate date
    @drawDays date
    @setMonthSelect()
    @setYearSelect()
    @

  handleMonthControls: (date) ->
    if @minYear is date.getFullYear() and @minMonth is date.getMonth()
      Utils.addClass "hidden", @previousMonth
    else if @maxYear is date.getFullYear() and @maxMonth is date.getMonth()
      Utils.addClass "hidden", @nextMonth
    else
      if Utils.hasClass "hidden", @previousMonth
        Utils.removeClass "hidden", @previousMonth
      if Utils.hasClass "hidden", @nextMonth
        Utils.removeClass "hidden", @nextMonth

  drawHeaderDate: (date) ->
    year = date.getFullYear()
    month = @getMonthName date.getMonth()
    @render @monthName, month
    @render @yearName, year

  drawDays: (date) ->
    daysInMonth = @getDaysInMonth date.getMonth(), date.getFullYear()
    startingDayName = @getDayName(new Date(@makeNewDate(date).setDate(1)).getDay())
    endingDayName = @getDayName(new Date(@makeNewDate(date).setDate(daysInMonth)).getDay())
    previousMonth = @getPreviousMonth date
    nextMonth = @getNextMonth date
    daysInPreviousMonth = @getDaysInMonth previousMonth.getMonth(), previousMonth.getFullYear()
    daysSnippet = ""

    dayNameToDayIndexForPreviousMonth =
      "Sunday" : 6
      "Monday" : 0
      "Tuesday" : 1
      "Wednesday" : 2
      "Thursday" : 3
      "Friday" : 4
      "Saturday" : 5

    dayNameToDayIndexForNextMonth =
      "Sunday" : 0
      "Monday" : 6
      "Tuesday" : 5
      "Wednesday" : 4
      "Thursday" : 3
      "Friday" : 2
      "Saturday" : 1

    daysInWeekOfPreviousMonth = dayNameToDayIndexForPreviousMonth[startingDayName]
    dayIndex = 0

    # Add in days from the previous month
    i = 1
    while i <= daysInWeekOfPreviousMonth
      day = daysInPreviousMonth - daysInWeekOfPreviousMonth + i
      dayDate = new Date(@makeNewDate(previousMonth).setDate(day))
      conditionalClass = @isDateInBounds dayDate
      daysSnippet += """
                     <li>
                       <a href="" class="in-previous-month#{conditionalClass}" data-index="#{dayIndex}" data-date="#{dayDate}">
                        #{day}
                       </a>
                     </li>
                     """
      dayIndex++
      i++

    # Add in days for active month
    i = 1
    while i <= daysInMonth
      dayDate = new Date(@makeNewDate(date).setDate(i))
      conditionalClass = @isDateInBounds dayDate
      daysSnippet += """
                     <li>
                       <a href="" class="in-this-month#{conditionalClass}" data-index="#{dayIndex}" data-date="#{dayDate}">
                        #{i}
                       </a>
                     </li>
                     """
      dayIndex++
      i++

    # Add in days from next month
    i = 1
    while i <= dayNameToDayIndexForNextMonth[endingDayName]
      dayDate = new Date(@makeNewDate(nextMonth).setDate(i))
      conditionalClass = @isDateInBounds dayDate
      daysSnippet += """
                     <li>
                       <a href="" class="in-next-month#{conditionalClass}" data-index="#{dayIndex}" data-date="#{dayDate}">
                        #{i}
                       </a>
                     </li>
                     """
      dayIndex++
      i++

    @render @days, daysSnippet

    # Handle active state on today
    if date.getFullYear() is @today.getFullYear() and date.getMonth() is @today.getMonth()
      dateForSelector = new Date(@makeNewDate(@today).setHours(0,0,0))
      todayElm = @days.querySelector("a[data-date='#{dateForSelector}']")
      Utils.addClass "todays-date", todayElm

  isDateInBounds: (date) ->
    if @options.minDate and date < @options.minDate
      " disabled-date"
    else if @options.maxDate and date > @options.maxDate
      " disabled-date"
    else
      " "

  setMonthSelect: ->
    @monthSelect.value = @activeDate.getMonth()

  setYearSelect: ->
    @yearSelect.value = @activeDate.getFullYear()

  generateMonthOptions: ->
    selectOptions = ""
    i = 0
    x = 11

    if @minYear is @activeDate.getFullYear()
      i = @minMonth

    if @maxYear is @activeDate.getFullYear()
      x = @maxMonth

    while i <= x
      monthName = @getMonthName i
      selectOptions += "<option value='#{i}'>#{monthName}</option>"
      i++

    selectOptions

  generateYearOptions: ->
    selectOptions = ""
    i = @minYear

    while i <= @maxYear
      selectOptions += "<option value='#{i}'>#{i}</option>"
      i++

    selectOptions

window.DateJust = DateJust

Utils =
  extend: (target, objects...) ->
    for object in objects
      target[key] = val for key, val of object

    target

  addClass: (className, elm) ->
    elm.classList.add className

  removeClass: (className, elm) ->
    elm.classList.remove className

  hasClass: (className, elm) ->
    elm.classList.contains className

  # From: http://stackoverflow.com/questions/27078285/simple-throttle-in-js
  throttle: (func, wait, options) ->
    context = undefined
    args = undefined
    result = undefined
    timeout = null
    previous = 0
    if !options
      options = {}

    later = ->
      previous = if options.leading == false then 0 else Date.now()
      timeout = null
      result = func.apply(context, args)
      if !timeout
        context = args = null
      return

    ->
      now = Date.now()
      if !previous and options.leading == false
        previous = now
      remaining = wait - (now - previous)
      context = this
      args = arguments
      if remaining <= 0 or remaining > wait
        if timeout
          clearTimeout timeout
          timeout = null
        previous = now
        result = func.apply(context, args)
        if !timeout
          context = args = null
      else if !timeout and options.trailing != false
        timeout = setTimeout(later, remaining)
      result

  # From: http://phrogz.net/js/wheeldelta.html
  wheelDistance: (e) ->
    w = e.wheelDelta
    d = e.detail
    if d
      if w
        # Opera
        if w / d / 40 * d > 0 then 1 else -1
      else
        # Firefox; TODO: do not /3 for OS X
        -d / 3
    else
      # IE/Safari/Chrome TODO: /3 for Chrome OS X
      w / 120

  # From: http://phrogz.net/js/wheeldelta.html
  wheelDirection: (e) ->
    if e.detail < 0 then yes else if e.wheelDelta > 0 then yes else no
