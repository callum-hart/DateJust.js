# Example One

exampleOne = new DateJust "#example-one",
  onDateSelected: (date) ->
    console.log date
  onDateRangeSelected: (startDate, endDate) ->
    console.log "#{startDate} – #{endDate}"

# Example Two

exampleTwo = new DateJust "#example-two",
  minDate: new Date(2012, 11, 8)
  maxDate: new Date(2014, 11, 8)
  existingDate: new Date(2014, 11, 8)
  onDateSelected: (date) ->
    console.log date
  onDateRangeSelected: (startDate, endDate) ->
    console.log "#{startDate} – #{endDate}"

# Example Three

exampleThree = new DateJust "#example-three",
  existingDateRange: [new Date(2016, 11, 8), new Date(2016, 11, 25)]
  onDateSelected: (date) ->
    console.log date
  onDateRangeSelected: (startDate, endDate) ->
    console.log "#{startDate} – #{endDate}"