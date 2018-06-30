'use strict';

function run() {
  let now = new Date();

  // Seconds in this day
  let seconds_in_day = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  let ks_in_day = Math.round(seconds_in_day / 100) / 10;
  document.getElementById("current-time-seconds").innerHTML = formatBigNumber(seconds_in_day);
  document.getElementById("current-time-ks").innerHTML = ks_in_day;

  // Birthday things
  let birthday_date = document.getElementById("birthday-date").value;
  let birthday_time = document.getElementById("birthday-time").value;
  let birthday = Date.parse(birthday_date + " " + birthday_time);
  if (!birthday) {
    return;
  }
  let age = Math.floor((now - birthday) / 1000);
  let age_in_ms = Math.round(age / 1000 / 1000);
  document.getElementById("age-seconds").innerHTML = formatBigNumber(age);
  document.getElementById("age-megaseconds").innerHTML = age_in_ms;

  let gs_birthday = birthday + 1000000000000; // ms!
  gs_birthday = new Date(gs_birthday);
  document.getElementById("gs-birthday").innerHTML = gs_birthday.toISOString();
}

function formatBigNumber(n) {
  return n.toLocaleString("en");
}

// Ensure things run
function install() {
  run();
  window.setInterval(run, 1000);
}
document.addEventListener('DOMContentLoaded', install, false);
