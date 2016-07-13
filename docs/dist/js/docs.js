(function() {
  var exampleOne, exampleThree, exampleTwo;

  exampleOne = new DateJust("#example-one", {
    onDateSelected: function(date) {
      return console.log(date);
    },
    onDateRangeSelected: function(startDate, endDate) {
      return console.log(startDate + " – " + endDate);
    }
  });

  exampleTwo = new DateJust("#example-two", {
    minDate: new Date(2012, 11, 8),
    maxDate: new Date(2014, 11, 8),
    existingDate: new Date(2014, 11, 8),
    onDateSelected: function(date) {
      return console.log(date);
    },
    onDateRangeSelected: function(startDate, endDate) {
      return console.log(startDate + " – " + endDate);
    }
  });

  exampleThree = new DateJust("#example-three", {
    existingDateRange: [new Date(2016, 11, 8), new Date(2016, 11, 25)],
    onDateSelected: function(date) {
      return console.log(date);
    },
    onDateRangeSelected: function(startDate, endDate) {
      return console.log(startDate + " – " + endDate);
    }
  });

}).call(this);
