let assignments = JSON.parse(localStorage.getItem("assignments")) || [];
let currentUser = null;

function saveAssignments() {
  localStorage.setItem("assignments", JSON.stringify(assignments));
}

/* ================= LOGIN ================= */

document.getElementById("student-login-btn").onclick = () => {
  const division = prompt("Enter Division (1-5)");
  const name = prompt("Enter Your Name");
  const roll = prompt("Enter Roll Number");

  if (!division || !name || !roll) return;

  currentUser = { type: "student", division, name, roll };
  showStudentView();
};

document.getElementById("teacher-login-btn").onclick = () => {
  const pin = prompt("Enter Teacher PIN (1234)");
  if (pin === "1234") {
    currentUser = { type: "teacher" };
    showTeacherView();
  } else {
    alert("Wrong PIN");
  }
};

/* ================= STUDENT ================= */

function showStudentView() {
  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("student-view").classList.remove("hidden");

  document.getElementById("student-info").innerHTML =
    `<p>Name: ${currentUser.name}</p>
     <p>Roll: ${currentUser.roll}</p>
     <p>Division: ${currentUser.division}</p>`;

  renderStudentAssignments();
}

function renderStudentAssignments() {
  const list = document.getElementById("student-assignments-list");
  list.innerHTML = "";

  assignments
    .filter(a => a.division === currentUser.division)
    .forEach((a) => {

      const submitted = Array.isArray(a.submissions) &&
        a.submissions.some(s => s.roll === currentUser.roll);

      list.innerHTML += `
        <div class="card mb-4">
          <h3 class="font-bold">${a.title}</h3>
          <p>${a.description}</p>
          <p>Subject: ${a.subject}</p>
          <p>Due: ${a.due}</p>

          <button class="px-3 py-1 rounded ${
            submitted ? "bg-green-500" : "bg-gray-500"
          }">
            ${submitted ? "✓ Submitted (Marked by Teacher)" : "Waiting for Teacher"}
          </button>
        </div>`;
    });
}

/* ================= TEACHER ================= */

function showTeacherView() {
  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("teacher-view").classList.remove("hidden");
  renderTeacherAssignments();
}

function renderTeacherAssignments() {
  const list = document.getElementById("teacher-assignments-list");
  const detail = document.getElementById("assignment-detail-view");

  detail.classList.add("hidden");
  list.classList.remove("hidden");

  list.innerHTML = "";

  assignments.forEach((a, index) => {
    list.innerHTML += `
      <div class="card mb-4 cursor-pointer"
           onclick="openAssignment(${index})">
        <h3 class="font-bold">${a.title}</h3>
        <p>${a.description}</p>

        <button onclick="event.stopPropagation(); deleteAssignment(${index})"
          class="bg-red-500 px-3 py-1 rounded">
          Delete
        </button>
      </div>`;
  });
}

function openAssignment(index) {
  const a = assignments[index];

  const detail = document.getElementById("assignment-detail-view");
  const list = document.getElementById("teacher-assignments-list");
  const form = document.getElementById("teacher-form");

  list.classList.add("hidden");
  form.classList.add("hidden");
  detail.classList.remove("hidden");

  if (!Array.isArray(a.submissions)) {
    a.submissions = [];
  }

  const students = [
    { roll: "1", name: "Aarav Sharma" },
    { roll: "2", name: "Bhavna Singh" },
    { roll: "3", name: "Chirag Patel" },
    { roll: "4", name: "Divya Desai" },
    { roll: "5", name: "Emaan Khan" }
  ];

  let html = `
    <h2 class="text-2xl font-bold mb-2">${a.title}</h2>
    <p>${a.description}</p>
    <p>Subject: ${a.subject}</p>
    <p>Due: ${a.due}</p>

    <h3 class="mt-4 font-bold">Students in Division ${a.division}</h3>
  `;

  students.forEach(student => {

    const submitted = a.submissions.some(
      s => s.roll === student.roll
    );

    html += `
      <div class="bg-[#1e1f3a] p-4 rounded-lg mb-3 flex justify-between items-center">

        <span class="text-white font-medium">
          Roll ${student.roll}: ${student.name}
        </span>

        <button
          onclick="toggleTeacherSubmission(${index}, '${student.roll}', '${student.name}')"
          class="px-4 py-2 rounded-lg text-sm font-semibold
          ${submitted 
            ? 'bg-cyan-500 text-white' 
            : 'bg-gray-600 text-gray-200'}">

          ${submitted ? '✓ Submitted' : 'Not Submitted'}
        </button>

      </div>
    `;
  });

  html += `
    <button id="back-btn"
      class="mt-4 bg-pink-500 px-5 py-2 rounded-lg font-semibold">
      Back
    </button>
  `;

  detail.innerHTML = html;

  document.getElementById("back-btn").onclick = function () {
    detail.classList.add("hidden");
    list.classList.remove("hidden");
    form.classList.remove("hidden");
  };
}

function toggleTeacherSubmission(assignIndex, roll, name) {
  const assignment = assignments[assignIndex];

  if (!Array.isArray(assignment.submissions)) {
    assignment.submissions = [];
  }

  const existingIndex = assignment.submissions.findIndex(
    s => s.roll === roll
  );

  if (existingIndex !== -1) {
    assignment.submissions.splice(existingIndex, 1);
  } else {
    assignment.submissions.push({ roll, name });
  }

  saveAssignments();
  openAssignment(assignIndex);
}

function deleteAssignment(index) {
  assignments.splice(index, 1);
  saveAssignments();
  renderTeacherAssignments();
}

/* ================= CREATE ASSIGNMENT ================= */

document.getElementById("teacher-form").onsubmit = function(e) {
  e.preventDefault();

  const newAssignment = {
    title: document.getElementById("assign-title").value,
    subject: document.getElementById("assign-subject").value,
    description: document.getElementById("assign-desc").value,
    due: document.getElementById("assign-due").value,
    division: document.getElementById("assign-division").value,
    submissions: []
  };

  assignments.push(newAssignment);
  saveAssignments();
  this.reset();
  renderTeacherAssignments();
};

/* ================= LOGOUT ================= */

document.getElementById("student-logout-btn").onclick =
document.getElementById("teacher-logout-btn").onclick = () => {
  location.reload();
};