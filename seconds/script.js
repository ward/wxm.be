"use strict";

function run() {
  let now = new Date();

  // Seconds in this day
  let seconds_in_day =
    now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  let ks_in_day = Math.round(seconds_in_day / 100) / 10;
  document.getElementById("current-time-seconds").textContent =
    formatBigNumber(seconds_in_day);
  document.getElementById("current-time-ks").textContent = ks_in_day;

  // Birthday things
  let birthday_date = document.getElementById("birthday-date").value;
  let birthday_time = document.getElementById("birthday-time").value;
  let birthday = Date.parse(birthday_date + " " + birthday_time);
  if (!birthday) {
    return;
  }
  let age = Math.floor((now - birthday) / 1000);
  let age_in_ms = Math.round(age / 1000 / 1000);
  document.getElementById("age-seconds").textContent = formatBigNumber(age);
  document.getElementById("age-megaseconds").textContent = age_in_ms;
}

function updateBirthdayTable() {
  let birthday_date = document.getElementById("birthday-date").value;
  let birthday_time = document.getElementById("birthday-time").value;
  let birthday = Date.parse(birthday_date + " " + birthday_time);
  let tbody = document.querySelector("#birthdays tbody");
  tbody.innerHTML = "";
  if (!birthday) {
    return;
  }
  for (let i = 1; i <= 20; i++) {
    let seconds = i * 100000000;
    let when = new Date(birthday + seconds * 1000);
    let label = i < 10 ? i * 100 + " Ms" : i / 10 + " Gs";
    let row = document.createElement("tr");
    let whatCell = document.createElement("td");
    whatCell.textContent = label;
    let whenCell = document.createElement("td");
    whenCell.textContent = formatDateTime(when);
    row.appendChild(whatCell);
    row.appendChild(whenCell);
    tbody.appendChild(row);
  }
}

function formatBigNumber(n) {
  return n.toLocaleString("en");
}

function formatDateTime(d) {
  let pad = (n) => String(n).padStart(2, "0");
  let date =
    d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  let time =
    pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
  return date + "\u00A0\u00A0\u00A0" + time;
}

// Ensure things run
function install() {
  run();
  window.setInterval(run, 1000);
  document
    .getElementById("birthday-date")
    .addEventListener("change", updateBirthdayTable);
  document
    .getElementById("birthday-time")
    .addEventListener("change", updateBirthdayTable);
  updateBirthdayTable();
}
document.addEventListener("DOMContentLoaded", install, false);
