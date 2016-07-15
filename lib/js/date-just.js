
/*
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
 */

(function() {
  var DateJust, Utils, noop,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    slice = [].slice;

  noop = function() {};

  DateJust = (function() {
    DateJust.prototype.defaultOptions = {
      dragSelection: true,
      scrollControl: true,
      minDate: new Date(new Date().getFullYear() - 10, 0, 1),
      maxDate: new Date(new Date().getFullYear() + 10, 11, 31),
      onDateSelected: noop,
      onDateRangeSelected: noop
    };

    DateJust.prototype.today = new Date();

    DateJust.prototype.version = "0.1.1";

    function DateJust(selector, options) {
      this.goForwardMonth = bind(this.goForwardMonth, this);
      this.goBackMonth = bind(this.goBackMonth, this);
      this.selectYear = bind(this.selectYear, this);
      this.selectMonth = bind(this.selectMonth, this);
      this.selectDateRange = bind(this.selectDateRange, this);
      this.onWheel = bind(this.onWheel, this);
      this.onMouseLeave = bind(this.onMouseLeave, this);
      this.onMouseUp = bind(this.onMouseUp, this);
      this.handleDateRange = bind(this.handleDateRange, this);
      this.onMouseDown = bind(this.onMouseDown, this);
      this.selectDay = bind(this.selectDay, this);
      var ref;
      this.handleElm(selector);
      if (this.elm) {
        this.options = Utils.extend({}, this.defaultOptions, options);
        this.activeDate = this.options.existingDate || ((ref = this.options.existingDateRange) != null ? ref[0] : void 0) || this.today;
        this.handleMinsAndMaxs();
        this.handleTemplate();
        this.bindPersistentEvents();
        if (this.options.existingDate) {
          this.handleExistingDate();
        }
        if (this.options.existingDateRange) {
          this.handleExistingDateRange();
        }
      } else {
        console.warn("DateJust couldn't initialize " + selector + " as it's not in the DOM");
      }
    }

    DateJust.prototype.handleElm = function(selector) {
      if (typeof selector === "string") {
        return this.elm = document.querySelector(selector);
      } else if (typeof selector === "object") {
        if (selector.nodeName) {
          return this.elm = selector;
        }
      }
    };

    DateJust.prototype.handleMinsAndMaxs = function() {
      this.minMonth = this.options.minDate.getMonth();
      this.minYear = this.options.minDate.getFullYear();
      this.maxMonth = this.options.maxDate.getMonth();
      return this.maxYear = this.options.maxDate.getFullYear();
    };

    DateJust.prototype.bindPersistentEvents = function() {
      this.monthSelect.addEventListener("change", this.selectMonth);
      this.yearSelect.addEventListener("change", this.selectYear);
      this.previousMonth.addEventListener("click", this.goBackMonth);
      this.nextMonth.addEventListener("click", this.goForwardMonth);
      this.days.addEventListener("click", this.selectDay);
      if (this.options.dragSelection) {
        this.days.addEventListener("mousedown", this.onMouseDown);
        this.days.addEventListener("mousemove", this.handleDateRange);
        this.days.addEventListener("mouseup", this.onMouseUp);
        this.days.addEventListener("mouseleave", this.onMouseLeave);
      }
      if (this.options.scrollControl) {
        return this.days.addEventListener("wheel", Utils.throttle(this.onWheel, 200));
      }
    };

    DateJust.prototype.selectDay = function(e) {
      e.preventDefault();
      this.removeDateRangeHighlight();
      if (e.target.tagName === "A") {
        if (this.activeDay) {
          this.removeActiveDay();
        }
        this.activeDay = e.target;
        if (this.activeDay.classList.contains("in-previous-month")) {
          this.goBackMonth();
          this.activeDay = this.days.querySelector("a.in-this-month[data-date='" + this.activeDay.dataset.date + "']");
        } else if (this.activeDay.classList.contains("in-next-month")) {
          this.goForwardMonth();
          this.activeDay = this.days.querySelector("a.in-this-month[data-date='" + this.activeDay.dataset.date + "']");
        }
        this.activeDate = new Date(this.activeDay.dataset.date);
        Utils.addClass("active-day", this.activeDay);
        return this.options.onDateSelected(this.activeDate);
      }
    };

    DateJust.prototype.removeActiveDay = function() {
      return Utils.removeClass("active-day", this.activeDay);
    };

    DateJust.prototype.onMouseDown = function(e) {
      this.mouseDown = true;
      this.resetDateRangeIndexes();
      return this.startIndex = parseInt(e.target.dataset.index);
    };

    DateJust.prototype.handleDateRange = function(e) {
      e.preventDefault();
      if (this.mouseDown) {
        return this.selectDateRange(e);
      }
    };

    DateJust.prototype.onMouseUp = function(e) {
      var endDate, startDate;
      this.mouseDown = false;
      if (this.endIndex) {
        startDate = new Date(this.days.querySelector("a[data-index='" + this.startIndex + "']").dataset.date);
        endDate = new Date(this.days.querySelector("a[data-index='" + this.endIndex + "']").dataset.date);
        return this.options.onDateRangeSelected(startDate, endDate);
      }
    };

    DateJust.prototype.onMouseLeave = function() {
      return this.mouseDown = false;
    };

    DateJust.prototype.onWheel = function(e) {
      var directionIsDown, wheelDistance;
      if (!this.mouseDown) {
        wheelDistance = Utils.wheelDistance(e);
        if (wheelDistance !== 0) {
          directionIsDown = Utils.wheelDirection(e);
          if (directionIsDown) {
            return this.goForwardMonth();
          } else {
            return this.goBackMonth();
          }
        }
      }
    };

    DateJust.prototype.selectDateRange = function(e) {
      if (e.target.tagName === "A") {
        if (this.endIndex !== parseInt(e.target.dataset.index)) {
          this.endIndex = parseInt(e.target.dataset.index);
          if (this.activeDay) {
            this.removeActiveDay();
          }
          this.removeDateRangeHighlight();
          return this.highlightDateRange();
        }
      }
    };

    DateJust.prototype.removeDateRangeHighlight = function() {
      var days, i, results;
      days = this.days.querySelectorAll("a");
      i = 0;
      results = [];
      while (i < days.length) {
        Utils.removeClass("day-in-range", days[i]);
        results.push(i++);
      }
      return results;
    };

    DateJust.prototype.highlightDateRange = function() {
      var dayIndex, days, i, results;
      days = this.days.querySelectorAll("a");
      i = 0;
      results = [];
      while (i < days.length) {
        dayIndex = parseInt(days[i].dataset.index);
        if (dayIndex >= this.startIndex && dayIndex <= this.endIndex) {
          Utils.addClass("day-in-range", days[i]);
        }
        if (dayIndex <= this.startIndex && dayIndex >= this.endIndex) {
          Utils.addClass("day-in-range", days[i]);
        }
        results.push(i++);
      }
      return results;
    };

    DateJust.prototype.handleExistingDate = function() {
      this.activeDay = this.days.querySelector("a[data-date='" + this.activeDate + "']");
      return Utils.addClass("active-day", this.activeDay);
    };

    DateJust.prototype.handleExistingDateRange = function() {
      this.startIndex = parseInt(this.days.querySelector("a[data-date='" + this.options.existingDateRange[0] + "']").dataset.index);
      this.endIndex = parseInt(this.days.querySelector("a[data-date='" + this.options.existingDateRange[1] + "']").dataset.index);
      return this.highlightDateRange();
    };

    DateJust.prototype.resetDateRangeIndexes = function() {
      this.startIndex = null;
      return this.endIndex = null;
    };

    DateJust.prototype.selectMonth = function(e) {
      var month, results, results1;
      month = parseInt(e.target.value);
      if (month < this.activeDate.getMonth()) {
        results = [];
        while (month < this.activeDate.getMonth()) {
          results.push(this.goBackMonth());
        }
        return results;
      } else {
        results1 = [];
        while (month > this.activeDate.getMonth()) {
          results1.push(this.goForwardMonth());
        }
        return results1;
      }
    };

    DateJust.prototype.selectYear = function(e) {
      var newDate;
      newDate = new Date(parseInt(e.target.value), this.activeDate.getMonth(), 1);
      if (newDate < this.options.minDate) {
        newDate.setMonth(this.minMonth);
      } else if (newDate > this.options.maxDate) {
        newDate.setMonth(this.maxMonth);
      }
      this.activeDate = newDate;
      this.drawDate(this.activeDate);
      this.render(this.monthSelect, this.generateMonthOptions());
      return this.setMonthSelect();
    };

    DateJust.prototype.reset = function() {
      var ref;
      this.activeDate = this.options.existingDate || ((ref = this.options.existingDateRange) != null ? ref[0] : void 0) || this.today;
      return this.drawDate(this.activeDate);
    };

    DateJust.prototype.getDayName = function(dayInt) {
      var dayName;
      switch (dayInt) {
        case 0:
          dayName = "Sunday";
          break;
        case 1:
          dayName = "Monday";
          break;
        case 2:
          dayName = "Tuesday";
          break;
        case 3:
          dayName = "Wednesday";
          break;
        case 4:
          dayName = "Thursday";
          break;
        case 5:
          dayName = "Friday";
          break;
        case 6:
          dayName = "Saturday";
      }
      return dayName;
    };

    DateJust.prototype.getMonthName = function(monthInt) {
      var monthName;
      switch (monthInt) {
        case 0:
          monthName = "January";
          break;
        case 1:
          monthName = "February";
          break;
        case 2:
          monthName = "March";
          break;
        case 3:
          monthName = "April";
          break;
        case 4:
          monthName = "May";
          break;
        case 5:
          monthName = "June";
          break;
        case 6:
          monthName = "July";
          break;
        case 7:
          monthName = "August";
          break;
        case 8:
          monthName = "September";
          break;
        case 9:
          monthName = "October";
          break;
        case 10:
          monthName = "November";
          break;
        case 11:
          monthName = "December";
      }
      return monthName;
    };

    DateJust.prototype.getDaysInMonth = function(month, year) {
      return new Date(year, month + 1, 0).getDate();
    };

    DateJust.prototype.getPreviousMonth = function(date) {

      /*
        Set date to the 1st of previous month. Prevents issues when going back from a day that
        doesn't exist in the previous month.
      
        i.e Fixes issue of:
        31st March to Febuary results in March 2nd (as theres only 29 days in Febuary)
       */
      return new Date(date.getFullYear(), date.getMonth() - 1, 1);
    };

    DateJust.prototype.getNextMonth = function(date) {

      /*
        Set date to the 1st of next month. Prevents issues when going forward from a day that
        doesn't exist in the next month.
      
        i.e Fixes issue of:
        31st January to Febuary results in March 2nd (as theres only 29 days in Febuary)
       */
      return new Date(date.getFullYear(), date.getMonth() + 1, 1);
    };

    DateJust.prototype.makeNewDate = function(date) {
      var day, month, year;
      month = date.getMonth();
      year = date.getFullYear();
      day = date.getDate();
      return new Date(year, month, day);
    };

    DateJust.prototype.setDate = function(date) {
      if (date < this.options.minDate) {
        return console.warn("DateJust has a minimum date of: " + this.options.minDate);
      } else if (date > this.options.maxDate) {
        return console.warn("DateJust has a maximum date of: " + this.options.maxDate);
      } else {
        this.activeDate = date;
        this.drawDate(this.activeDate);
        if (this.activeDay) {
          this.removeActiveDay();
        }
        this.activeDay = this.days.querySelector("a[data-date='" + this.activeDate + "']");
        Utils.addClass("active-day", this.activeDay);
        return this.options.onDateSelected(this.activeDate);
      }
    };

    DateJust.prototype.goBackMonth = function(e) {
      var minDate, previousMonth;
      if (e != null) {
        e.preventDefault();
      }
      previousMonth = this.getPreviousMonth(this.activeDate);
      minDate = new Date(this.makeNewDate(this.options.minDate).setDate(this.activeDate.getDate()));
      if (!(previousMonth < minDate)) {
        this.activeDate = previousMonth;
        return this.drawDate(this.activeDate);
      } else {
        return console.warn("DateJust has a minimum date of: " + this.options.minDate);
      }
    };

    DateJust.prototype.goForwardMonth = function(e) {
      var maxDate, nextMonth;
      if (e != null) {
        e.preventDefault();
      }
      nextMonth = this.getNextMonth(this.activeDate);
      maxDate = new Date(this.makeNewDate(this.options.maxDate).setDate(this.activeDate.getDate()));
      if (!(nextMonth > maxDate)) {
        this.activeDate = nextMonth;
        return this.drawDate(this.activeDate);
      } else {
        return console.warn("DateJust has a maximum date of: " + this.options.maxDate);
      }
    };

    DateJust.prototype.render = function(elm, template) {
      return elm.innerHTML = template;
    };

    DateJust.prototype.handleTemplate = function() {
      this.template = "<div class=\"dj-header\">\n  <div class=\"dj-month\">\n    <span class=\"dj-month-name\"></span>\n    <select class=\"dj-month-select\">\n      {{monthOptions}}\n    </select>\n  </div>\n\n  <div class=\"dj-year\">\n    <span class=\"dj-year-name\"></span>\n    <select class=\"dj-year-select\">\n      {{yearOptions}}\n    </select>\n  </div>\n\n  <a href=\"\" class=\"previous-month\">&#9654;</a>\n  <a href=\"\" class=\"next-month\">&#9654;</a>\n</div>\n\n<ul class=\"day-names\">\n  <li>M</li>\n  <li>T</li>\n  <li>W</li>\n  <li>T</li>\n  <li>F</li>\n  <li>S</li>\n  <li>S</li>\n</ul>\n\n<ul class=\"days\"></ul>";
      this.template = this.template.replace("{{monthOptions}}", this.generateMonthOptions());
      this.template = this.template.replace("{{yearOptions}}", this.generateYearOptions());
      this.render(this.elm, this.template);
      this.monthName = this.elm.querySelector(".dj-month-name");
      this.yearName = this.elm.querySelector(".dj-year-name");
      this.monthSelect = this.elm.querySelector(".dj-month-select");
      this.yearSelect = this.elm.querySelector(".dj-year-select");
      this.previousMonth = this.elm.querySelector(".previous-month");
      this.nextMonth = this.elm.querySelector(".next-month");
      this.days = this.elm.querySelector(".days");
      Utils.addClass("dj-container", this.elm);
      return this.drawDate(this.activeDate);
    };

    DateJust.prototype.drawDate = function(date) {
      this.handleMonthControls(date);
      this.drawHeaderDate(date);
      this.drawDays(date);
      this.setMonthSelect();
      this.setYearSelect();
      return this;
    };

    DateJust.prototype.handleMonthControls = function(date) {
      if (this.minYear === date.getFullYear() && this.minMonth === date.getMonth()) {
        return Utils.addClass("hidden", this.previousMonth);
      } else if (this.maxYear === date.getFullYear() && this.maxMonth === date.getMonth()) {
        return Utils.addClass("hidden", this.nextMonth);
      } else {
        if (Utils.hasClass("hidden", this.previousMonth)) {
          Utils.removeClass("hidden", this.previousMonth);
        }
        if (Utils.hasClass("hidden", this.nextMonth)) {
          return Utils.removeClass("hidden", this.nextMonth);
        }
      }
    };

    DateJust.prototype.drawHeaderDate = function(date) {
      var month, year;
      year = date.getFullYear();
      month = this.getMonthName(date.getMonth());
      this.render(this.monthName, month);
      return this.render(this.yearName, year);
    };

    DateJust.prototype.drawDays = function(date) {
      var conditionalClass, dateForSelector, day, dayDate, dayIndex, dayNameToDayIndexForNextMonth, dayNameToDayIndexForPreviousMonth, daysInMonth, daysInPreviousMonth, daysInWeekOfPreviousMonth, daysSnippet, endingDayName, i, nextMonth, previousMonth, startingDayName, todayElm;
      daysInMonth = this.getDaysInMonth(date.getMonth(), date.getFullYear());
      startingDayName = this.getDayName(new Date(this.makeNewDate(date).setDate(1)).getDay());
      endingDayName = this.getDayName(new Date(this.makeNewDate(date).setDate(daysInMonth)).getDay());
      previousMonth = this.getPreviousMonth(date);
      nextMonth = this.getNextMonth(date);
      daysInPreviousMonth = this.getDaysInMonth(previousMonth.getMonth(), previousMonth.getFullYear());
      daysSnippet = "";
      dayNameToDayIndexForPreviousMonth = {
        "Sunday": 6,
        "Monday": 0,
        "Tuesday": 1,
        "Wednesday": 2,
        "Thursday": 3,
        "Friday": 4,
        "Saturday": 5
      };
      dayNameToDayIndexForNextMonth = {
        "Sunday": 0,
        "Monday": 6,
        "Tuesday": 5,
        "Wednesday": 4,
        "Thursday": 3,
        "Friday": 2,
        "Saturday": 1
      };
      daysInWeekOfPreviousMonth = dayNameToDayIndexForPreviousMonth[startingDayName];
      dayIndex = 0;
      i = 1;
      while (i <= daysInWeekOfPreviousMonth) {
        day = daysInPreviousMonth - daysInWeekOfPreviousMonth + i;
        dayDate = new Date(this.makeNewDate(previousMonth).setDate(day));
        conditionalClass = this.isDateInBounds(dayDate);
        daysSnippet += "<li>\n  <a href=\"\" class=\"in-previous-month" + conditionalClass + "\" data-index=\"" + dayIndex + "\" data-date=\"" + dayDate + "\">\n   " + day + "\n  </a>\n</li>";
        dayIndex++;
        i++;
      }
      i = 1;
      while (i <= daysInMonth) {
        dayDate = new Date(this.makeNewDate(date).setDate(i));
        conditionalClass = this.isDateInBounds(dayDate);
        daysSnippet += "<li>\n  <a href=\"\" class=\"in-this-month" + conditionalClass + "\" data-index=\"" + dayIndex + "\" data-date=\"" + dayDate + "\">\n   " + i + "\n  </a>\n</li>";
        dayIndex++;
        i++;
      }
      i = 1;
      while (i <= dayNameToDayIndexForNextMonth[endingDayName]) {
        dayDate = new Date(this.makeNewDate(nextMonth).setDate(i));
        conditionalClass = this.isDateInBounds(dayDate);
        daysSnippet += "<li>\n  <a href=\"\" class=\"in-next-month" + conditionalClass + "\" data-index=\"" + dayIndex + "\" data-date=\"" + dayDate + "\">\n   " + i + "\n  </a>\n</li>";
        dayIndex++;
        i++;
      }
      this.render(this.days, daysSnippet);
      if (date.getFullYear() === this.today.getFullYear() && date.getMonth() === this.today.getMonth()) {
        dateForSelector = new Date(this.makeNewDate(this.today).setHours(0, 0, 0));
        todayElm = this.days.querySelector("a[data-date='" + dateForSelector + "']");
        return Utils.addClass("todays-date", todayElm);
      }
    };

    DateJust.prototype.isDateInBounds = function(date) {
      if (this.options.minDate && date < this.options.minDate) {
        return " disabled-date";
      } else if (this.options.maxDate && date > this.options.maxDate) {
        return " disabled-date";
      } else {
        return " ";
      }
    };

    DateJust.prototype.setMonthSelect = function() {
      return this.monthSelect.value = this.activeDate.getMonth();
    };

    DateJust.prototype.setYearSelect = function() {
      return this.yearSelect.value = this.activeDate.getFullYear();
    };

    DateJust.prototype.generateMonthOptions = function() {
      var i, monthName, selectOptions, x;
      selectOptions = "";
      i = 0;
      x = 11;
      if (this.minYear === this.activeDate.getFullYear()) {
        i = this.minMonth;
      }
      if (this.maxYear === this.activeDate.getFullYear()) {
        x = this.maxMonth;
      }
      while (i <= x) {
        monthName = this.getMonthName(i);
        selectOptions += "<option value='" + i + "'>" + monthName + "</option>";
        i++;
      }
      return selectOptions;
    };

    DateJust.prototype.generateYearOptions = function() {
      var i, selectOptions;
      selectOptions = "";
      i = this.minYear;
      while (i <= this.maxYear) {
        selectOptions += "<option value='" + i + "'>" + i + "</option>";
        i++;
      }
      return selectOptions;
    };

    return DateJust;

  })();

  window.DateJust = DateJust;

  Utils = {
    extend: function() {
      var j, key, len, object, objects, target, val;
      target = arguments[0], objects = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      for (j = 0, len = objects.length; j < len; j++) {
        object = objects[j];
        for (key in object) {
          val = object[key];
          target[key] = val;
        }
      }
      return target;
    },
    addClass: function(className, elm) {
      return elm.classList.add(className);
    },
    removeClass: function(className, elm) {
      return elm.classList.remove(className);
    },
    hasClass: function(className, elm) {
      return elm.classList.contains(className);
    },
    throttle: function(func, wait, options) {
      var args, context, later, previous, result, timeout;
      context = void 0;
      args = void 0;
      result = void 0;
      timeout = null;
      previous = 0;
      if (!options) {
        options = {};
      }
      later = function() {
        previous = options.leading === false ? 0 : Date.now();
        timeout = null;
        result = func.apply(context, args);
        if (!timeout) {
          context = args = null;
        }
      };
      return function() {
        var now, remaining;
        now = Date.now();
        if (!previous && options.leading === false) {
          previous = now;
        }
        remaining = wait - (now - previous);
        context = this;
        args = arguments;
        if (remaining <= 0 || remaining > wait) {
          if (timeout) {
            clearTimeout(timeout);
            timeout = null;
          }
          previous = now;
          result = func.apply(context, args);
          if (!timeout) {
            context = args = null;
          }
        } else if (!timeout && options.trailing !== false) {
          timeout = setTimeout(later, remaining);
        }
        return result;
      };
    },
    wheelDistance: function(e) {
      var d, w;
      w = e.wheelDelta;
      d = e.detail;
      if (d) {
        if (w) {
          if (w / d / 40 * d > 0) {
            return 1;
          } else {
            return -1;
          }
        } else {
          return -d / 3;
        }
      } else {
        return w / 120;
      }
    },
    wheelDirection: function(e) {
      if (e.detail < 0) {
        return true;
      } else if (e.wheelDelta > 0) {
        return true;
      } else {
        return false;
      }
    }
  };

}).call(this);
