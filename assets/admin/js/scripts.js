// Global JS code
jQuery(document).ready(function($) {
  var jobs = [];
  var list = $('.idx-sr-list');
  var start; // Elapsed time
  var timer;

  // Add click event for importing jobs
  $('.idx-sr-btn[action]').on('click', function(e) {
    e.preventDefault();
    var button = $(this);
    var action = button.attr('action');
    var date = new Date();

    // Perform actions
    if (button.hasClass('disabled') == false) {
      $('.idx-sr-btn[action]').addClass('disabled'); // Disable all buttons
      jobs = []; // Empty jobs array
      list.empty(); // Empty job HTML list
      startTimer();

      // Check the button action
      if (action == 'import-all') {
        // Import all jobs
        importJobs(0, 100);
      }
      else if (action == 'import-recent') {
        //date.setMonth(date.getMonth() - 1); // Last month
        date.setDate(date.getDate() - 7); // Last week
        importJobs(0, 100, date.toISOString());
      }
    }
  });

  function importJobs(offset = 0, limit = 100, updatedAfter) {
    $.post(ajaxurl, { action: 'import_jobs', offset: offset, limit: limit, updatedAfter: updatedAfter }, function(response) { 
      if (response.success == true) {
        var data = response['data'];
        var total = data['totalFound'];
        
        // Check if there are more jobs to search
        if (offset < total) {
          data['content'].forEach(function(job) { addJobToList(job); });
          updateProgressBar(offset + limit, total, 'Downloaded ' + (offset + limit) + ' of ' + total + ' jobs...');
          importJobs(offset + limit, limit, updatedAfter); // Recursively request more jobs
        }
        else {
          updateProgressBar(0, jobs.length, 'Download complete!');
          publishJobs();
        }
      }
      else {
        // Log error
        console.log(response);
      }
    });
  }

  function updateProgressBar(index = 0, length = 1, text = '') {
    var percent = (index / length) * 100;
    var progress = $('.idx-sr-progress');
    var bar = $('.idx-sr-progress-bar');
    if (percent > 100) percent = 100;
    progress.attr('data-text', text)
    bar.attr('data-percent', parseInt(percent));
    bar.width(percent + '%');
  }

  function addJobToList(job) {
    // Only add jobs with 'PUBLIC' or 'INTERNAL' posting status
    if (job['postingStatus'] == 'PUBLIC' || job['postingStatus'] == 'INTERNAL') {
      jobs.push(job);
      addRowToList(job['id'], '<span class="idx-sr-status queued"></span>' + '(' + jobs.length + ') ' + job['title']);
    }
  }

  function addRowToList(id, text) {
    var row = '<div class="idx-sr-row" id="' + id + '">' + text + '</div>';
    list.prepend(row);
  }

  function publishJobs(index = 0) {
    // Update status if index is less than the number of jobs
    if (index < jobs.length) {
      var id = jobs[index]['id'];
      $.post(ajaxurl, { action: 'publish_job', id: id }, function(response) { 
        if (response.success == true) {
          // Update the row status
          var data = response['data'];
          var row = $('#' + id);
          row.find('.idx-sr-status').attr('class', 'idx-sr-status published');
          console.log(data);
          updateProgressBar(index + 1, jobs.length, 'Published ' + (index + 1) + ' of ' + jobs.length + ' job pages...');
          publishJobs(index + 1); // Recurively request next job
        }
        else {
          // Log error
          console.log(response);
        }
      });
    }
    else {
      // Update page to show completion
      $('.idx-sr-btn[action]').removeClass('disabled');
      stopTimer();
    }
  }

  function startTimer() {
    start = Date.now();
    timer = setInterval(function() {
      var time = (Date.now() - start) / 1000;
      var hours = parseInt(Math.floor(((time % 31536000) % 86400) / 3600), 10);
      var minutes = parseInt(Math.floor((((time % 31536000) % 86400) % 3600) / 60), 10);
      var seconds = parseInt((((time % 31536000) % 86400) % 3600) % 60, 10);
      $('.idx-sr-time').text(
        ((hours < 10) ? "0" + hours : hours) + ":" + 
        ((minutes < 10) ? "0" + minutes : minutes) + ":" + 
        ((seconds < 10) ? "0" + seconds : seconds)
      );
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timer);
  }
});