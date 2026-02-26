/* ================= GLOBAL DATA ================= */
let assignments = JSON.parse(localStorage.getItem("assignments")) || [];
let currentUser = null;
let generatedOTP = null;
let activeStudent = null;

// ✅ Student list
const VALID_STUDENTS = [
  { roll: "1", name: "Vedant Panhale", division: "1", email: "vedantpanhale.01@gmail.com" },
  { roll: "2", name: "Bhavna Singh", division: "1", email: "bhavna@example.com" },
  { roll: "3", name: "Chirag Patel", division: "2", email: "chirag@example.com" }
];

// Initialize EmailJS with your Public Key
(function() {
    emailjs.init("98gZm8ipWNkhRgl-e"); 
})();

function saveAssignments() {
    localStorage.setItem("assignments", JSON.stringify(assignments));
}

/* ================= STUDENT LOGIN LOGIC ================= */

document.getElementById("student-login-btn").onclick = () => {
    document.getElementById("role-selection").classList.add("hidden");
    document.getElementById("student-login-form").classList.remove("hidden");
};

// STEP 1: Verify all 4 fields (Before sending OTP)
document.getElementById("verify-details-btn").onclick = function() {
    const div = document.getElementById("login-div").value.trim();
    const name = document.getElementById("login-name").value.trim().toLowerCase();
    const roll = document.getElementById("login-roll").value.trim();
    const email = document.getElementById("login-email").value.trim().toLowerCase();

    const found = VALID_STUDENTS.find(s => 
        s.division === div && 
        s.name.toLowerCase() === name && 
        s.roll === roll &&
        s.email.toLowerCase() === email
    );

    if (found) {
        activeStudent = found;
        // Lock inputs and show the Send OTP button section
        document.getElementById("input-fields").classList.add("opacity-50", "pointer-events-none");
        this.classList.add("hidden"); 
        document.getElementById("otp-request-container").classList.remove("hidden");
    } else {
        alert("Verification Failed! Details do not match our records.");
    }
};

// STEP 2: Send OTP via EmailJS
document.getElementById("send-otp-btn").onclick = function() {
    generatedOTP = Math.floor(1000 + Math.random() * 9000).toString();
    
    this.disabled = true;
    this.innerText = "Sending Code...";

    const templateParams = {
        to_name: activeStudent.name,
        to_email: activeStudent.email,
        otp_code: generatedOTP // Make sure your EmailJS template uses {{otp_code}}
    };

    emailjs.send('service_hl3w7ql', 'template_42er2vp', templateParams)
        .then(() => {
            alert("Verification code sent to " + activeStudent.email);
            document.getElementById("otp-request-container").classList.add("hidden");
            document.getElementById("otp-verify-section").classList.remove("hidden");
        }, (error) => {
            alert("Email failed to send. Check console.");
            console.error("EmailJS Error:", error);
            this.disabled = false;
            this.innerText = "Send OTP to Email";
        });
};

// STEP 3: Final OTP Verification
document.getElementById("final-login-btn").onclick = function() {
    const enteredOTP = document.getElementById("login-otp").value.trim();

    if (enteredOTP === generatedOTP) {
        currentUser = { type: "student", ...activeStudent };
        showStudentView();
    } else {
        alert("Invalid Code. Please check your email.");
    }
};

/* ================= TEACHER LOGIN ================= */

document.getElementById("teacher-login-btn").onclick = () => {
  const pin = prompt("Enter Teacher PIN (1234)");
  if (pin === "1234") {
    currentUser = { type: "teacher" };
    showTeacherView();
  } else {
    alert("Wrong PIN");
  }
};

/* ================= VIEW TRANSITIONS ================= */

function showStudentView() {
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("student-view").classList.remove("hidden");

    document.getElementById("student-info").innerHTML =
        `<p><strong>Name:</strong> ${currentUser.name}</p>
         <p><strong>Roll:</strong> ${currentUser.roll}</p>
         <p><strong>Division:</strong> ${currentUser.division}</p>`;

    renderStudentAssignments();
}

function showTeacherView() {
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("teacher-view").classList.remove("hidden");
    renderTeacherAssignments();
}

/* ================= CORE LOGIC ================= */

function renderStudentAssignments() {
    const list = document.getElementById("student-assignments-list");
    list.innerHTML = "";
    assignments
        .filter(a => a.division === currentUser.division)
        .forEach((a) => {
            const submitted = Array.isArray(a.submissions) && a.submissions.some(s => s.roll === currentUser.roll);
            list.innerHTML += `
                <div class="card mb-4 bg-[#252542] p-4 rounded-xl border border-gray-700">
                    <h3 class="font-bold text-xl">${a.title}</h3>
                    <p class="text-gray-400 text-sm mb-2">${a.description}</p>
                    <div class="flex justify-between items-center mt-4">
                        <span class="text-xs bg-gray-800 px-2 py-1 rounded">${a.subject}</span>
                        <button class="px-3 py-1 rounded text-sm font-semibold ${submitted ? "bg-green-500" : "bg-gray-500"}">
                            ${submitted ? "✓ Submitted" : "Pending"}
                        </button>
                    </div>
                </div>`;
        });
}

function renderTeacherAssignments() {
    const list = document.getElementById("teacher-assignments-list");
    const detail = document.getElementById("assignment-detail-view");
    detail.classList.add("hidden");
    list.classList.remove("hidden");
    list.innerHTML = "";
    assignments.forEach((a, index) => {
        list.innerHTML += `
            <div class="card mb-4 bg-[#252542] p-4 rounded-xl cursor-pointer border border-gray-700" onclick="openAssignment(${index})">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-bold text-lg">${a.title}</h3>
                        <p class="text-xs text-gray-400">Div ${a.division} • ${a.subject}</p>
                    </div>
                    <button onclick="event.stopPropagation(); deleteAssignment(${index})" class="bg-red-500/20 text-red-500 p-2 rounded-lg hover:bg-red-500 hover:text-white transition">Delete</button>
                </div>
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

    if (!Array.isArray(a.submissions)) a.submissions = [];
    const studentsInDivision = VALID_STUDENTS.filter(s => s.division === a.division);

    let html = `
        <div class="mb-6">
            <h2 class="text-2xl font-bold">${a.title}</h2>
            <p class="text-gray-400">${a.description}</p>
        </div>
        <h3 class="font-bold mb-4 text-[#f72585]">Class List (Division ${a.division})</h3>
    `;

    studentsInDivision.forEach(student => {
        const submitted = a.submissions.some(s => s.roll === student.roll);
        html += `
            <div class="bg-[#1e1f3a] p-4 rounded-lg mb-3 flex justify-between items-center border border-gray-800">
                <span>Roll ${student.roll}: ${student.name}</span>
                <button onclick="toggleTeacherSubmission(${index}, '${student.roll}', '${student.name}')"
                    class="px-4 py-2 rounded-lg text-xs font-bold ${submitted ? 'bg-cyan-500' : 'bg-gray-700 text-gray-400'}">
                    ${submitted ? '✓ MARKED' : 'MARK SUBMITTED'}
                </button>
            </div>`;
    });

    html += `<button id="back-btn" class="mt-4 bg-pink-500 px-8 py-2 rounded-lg font-bold">Back to List</button>`;
    detail.innerHTML = html;
    document.getElementById("back-btn").onclick = () => {
        renderTeacherAssignments();
        form.classList.remove("hidden");
    };
}

function toggleTeacherSubmission(assignIndex, roll, name) {
    const assignment = assignments[assignIndex];
    if (!Array.isArray(assignment.submissions)) assignment.submissions = [];
    const existingIndex = assignment.submissions.findIndex(s => s.roll === roll);
    if (existingIndex !== -1) {
        assignment.submissions.splice(existingIndex, 1);
    } else {
        assignment.submissions.push({ roll, name });
    }
    saveAssignments();
    openAssignment(assignIndex);
}

function deleteAssignment(index) {
    if(confirm("Delete this assignment?")) {
        assignments.splice(index, 1);
        saveAssignments();
        renderTeacherAssignments();
    }
}

document.getElementById("teacher-form").onsubmit = function(e) {
    e.preventDefault();
    assignments.push({
        title: document.getElementById("assign-title").value,
        subject: document.getElementById("assign-subject").value,
        description: document.getElementById("assign-desc").value,
        due: document.getElementById("assign-due").value,
        division: document.getElementById("assign-division").value,
        submissions: []
    });
    saveAssignments();
    this.reset();
    renderTeacherAssignments();
};

document.getElementById("student-logout-btn").onclick = 
document.getElementById("teacher-logout-btn").onclick = () => location.reload();