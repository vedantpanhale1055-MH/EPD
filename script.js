/* ===============================
   ASSIGNMENT MANAGER — SCRIPT.JS
   =============================== */

/* ---- GLOBAL STATE ---- */
let assignments = JSON.parse(localStorage.getItem("assignments")) || [];
let currentUser  = null;
let generatedOTP = null;
let activeStudent = null;

/* ---- STUDENT ROSTER ---- */
const VALID_STUDENTS = [
    { roll: "1", name: "Vedant Panhale",  division: "1", email: "vedantpanhale.01@gmail.com" },
    { roll: "2", name: "Bhavna Singh",    division: "1", email: "bhavna@example.com" },
    { roll: "3", name: "Chirag Patel",    division: "2", email: "chirag@example.com" }
];

/* ---- TEACHER PIN ---- */
const TEACHER_PIN = "1234";

/* ---- EMAILJS INIT ---- */
(function () { emailjs.init("98gZm8ipWNkhRgl-e"); })();

/* ===========================
   UTILITY FUNCTIONS
   =========================== */

function saveAssignments() {
    localStorage.setItem("assignments", JSON.stringify(assignments));
}

/**
 * Show a toast notification.
 * @param {string} msg   - Message to display
 * @param {'success'|'error'|'info'} type
 * @param {number} duration  - ms before hiding (default 3000)
 */
function showToast(msg, type = "info", duration = 3000) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.className = `toast toast-${type}`;
    toast.classList.remove("hidden");

    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.add("hidden"), duration);
}

function formatDate(dateStr) {
    if (!dateStr) return "No due date";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/* ===========================
   LOGIN — STUDENT FLOW
   =========================== */

document.getElementById("student-login-btn").onclick = () => {
    document.getElementById("role-selection").classList.add("hidden");
    document.getElementById("student-login-form").classList.remove("hidden");
};

// STEP 1 — Verify details
document.getElementById("verify-details-btn").onclick = function () {
    const div   = document.getElementById("login-div").value.trim();
    const name  = document.getElementById("login-name").value.trim().toLowerCase();
    const roll  = document.getElementById("login-roll").value.trim();
    const email = document.getElementById("login-email").value.trim().toLowerCase();

    if (!div || !name || !roll || !email) {
        showToast("Please fill in all fields.", "error");
        return;
    }

    const found = VALID_STUDENTS.find(s =>
        s.division === div &&
        s.name.toLowerCase() === name &&
        s.roll === roll &&
        s.email.toLowerCase() === email
    );

    if (found) {
        activeStudent = found;
        document.getElementById("input-fields").style.opacity = "0.5";
        document.getElementById("input-fields").style.pointerEvents = "none";
        this.classList.add("hidden");
        document.getElementById("otp-request-container").classList.remove("hidden");
        showToast("Details verified! Send OTP to continue.", "success");
    } else {
        showToast("Details don't match our records. Please try again.", "error");
        // Shake the card for feedback
        const card = document.getElementById("student-login-form");
        card.style.animation = "none";
        card.offsetHeight; // reflow
        card.style.animation = "shake 0.4s ease";
    }
};

// STEP 2 — Send OTP
document.getElementById("send-otp-btn").onclick = function () {
    generatedOTP = Math.floor(1000 + Math.random() * 9000).toString();
    this.disabled = true;
    this.textContent = "Sending…";

    emailjs.send("service_hl3w7ql", "template_42er2vp", {
        to_name:  activeStudent.name,
        to_email: activeStudent.email,
        otp_code: generatedOTP
    }).then(() => {
        showToast(`OTP sent to ${activeStudent.email}`, "success");
        document.getElementById("otp-request-container").classList.add("hidden");
        document.getElementById("otp-verify-section").classList.remove("hidden");
    }, (err) => {
        console.error("EmailJS error:", err);
        showToast("Failed to send OTP. Check console for details.", "error");
        this.disabled = false;
        this.textContent = "Retry Send OTP";
    });
};

// STEP 3 — Verify OTP
document.getElementById("final-login-btn").onclick = function () {
    const entered = document.getElementById("login-otp").value.trim();
    if (entered === generatedOTP) {
        currentUser = { type: "student", ...activeStudent };
        showToast(`Welcome, ${currentUser.name}! 👋`, "success");
        showStudentView();
    } else {
        showToast("Incorrect OTP. Please try again.", "error");
    }
};

/* ===========================
   LOGIN — TEACHER FLOW
   =========================== */

window.addEventListener("load", () => {
    const modal      = document.getElementById("teacher-modal");
    const pinInput   = document.getElementById("teacher-pin-input");
    const cancelBtn  = document.getElementById("modal-cancel-btn");
    const confirmBtn = document.getElementById("modal-confirm-btn");

    document.getElementById("teacher-login-btn").onclick = () => {
        modal.classList.remove("hidden");
        pinInput.value = "";
        pinInput.focus();
    };

    cancelBtn.onclick = () => {
        modal.classList.add("hidden");
        pinInput.value = "";
    };

    // Close on backdrop click
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.classList.add("hidden");
            pinInput.value = "";
        }
    });

    confirmBtn.onclick = verifyTeacherPin;

    // Allow Enter key in PIN field
    pinInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") verifyTeacherPin();
    });

    function verifyTeacherPin() {
        if (pinInput.value === TEACHER_PIN) {
            modal.classList.add("hidden");
            currentUser = { type: "teacher" };
            showTeacherView();
            showToast("Welcome, Teacher! 🏫", "success");
        } else {
            showToast("Wrong PIN. Try again.", "error");
            pinInput.value = "";
            pinInput.focus();
        }
    }
});

/* ===========================
   VIEW TRANSITIONS
   =========================== */

function showStudentView() {
    document.getElementById("login-screen").classList.add("hidden");
    const view = document.getElementById("student-view");
    view.classList.remove("hidden");

    document.getElementById("student-greeting").textContent =
        `Division ${currentUser.division} · Roll ${currentUser.roll}`;

    document.getElementById("student-info").innerHTML = `
        <p><strong>👤 Name:</strong> ${currentUser.name}</p>
        <p><strong>📌 Roll:</strong> ${currentUser.roll}</p>
        <p><strong>🏷️ Division:</strong> ${currentUser.division}</p>
        <p><strong>📧 Email:</strong> ${currentUser.email}</p>
    `;

    renderStudentAssignments();
}

function showTeacherView() {
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("teacher-view").classList.remove("hidden");
    renderTeacherAssignments();
}

/* ===========================
   STUDENT: RENDER ASSIGNMENTS
   =========================== */

function renderStudentAssignments() {
    const list = document.getElementById("student-assignments-list");
    const myAssignments = assignments.filter(a => a.division === currentUser.division);

    if (myAssignments.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <p>No assignments yet for your division.</p>
            </div>`;
        return;
    }

    list.innerHTML = myAssignments.map(a => {
        const submitted = Array.isArray(a.submissions) &&
            a.submissions.some(s => s.roll === currentUser.roll);
        const due = formatDate(a.due);

        return `
        <div class="assign-card">
            <div class="assign-card-top">
                <div>
                    <div class="assign-title">${escapeHTML(a.title)}</div>
                    <div class="assign-desc">${escapeHTML(a.description || "No description provided.")}</div>
                </div>
                <span class="status-badge ${submitted ? "status-submitted" : "status-pending"}">
                    ${submitted ? "✓ Done" : "Pending"}
                </span>
            </div>
            <div class="assign-footer">
                <span class="tag">📚 ${escapeHTML(a.subject)}</span>
                <span class="tag">📅 ${due}</span>
            </div>
        </div>`;
    }).join("");
}

/* ===========================
   TEACHER: RENDER ASSIGNMENTS
   =========================== */

function renderTeacherAssignments() {
    const list   = document.getElementById("teacher-assignments-list");
    const detail = document.getElementById("assignment-detail-view");
    detail.classList.add("hidden");
    list.classList.remove("hidden");

    if (assignments.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <p>No assignments created yet. Create one above!</p>
            </div>`;
        return;
    }

    list.innerHTML = assignments.map((a, i) => {
        const count     = Array.isArray(a.submissions) ? a.submissions.length : 0;
        const total     = VALID_STUDENTS.filter(s => s.division === a.division).length;
        const pct       = total > 0 ? Math.round((count / total) * 100) : 0;

        return `
        <div class="teacher-assign-card" onclick="openAssignment(${i})">
            <div class="tac-info" style="flex:1; min-width:0;">
                <h3>${escapeHTML(a.title)}</h3>
                <p>Div ${a.division} · ${escapeHTML(a.subject)} · ${formatDate(a.due)}</p>
                <div class="progress-bar" style="margin-top:0.5rem">
                    <div class="progress-fill" style="width:${pct}%"></div>
                </div>
                <p style="margin-top:0.25rem; font-size:0.68rem;">${count}/${total} submitted</p>
            </div>
            <button class="btn-delete"
                onclick="event.stopPropagation(); deleteAssignment(${i})">
                🗑 Delete
            </button>
        </div>`;
    }).join("");
}

/* ===========================
   TEACHER: OPEN ASSIGNMENT DETAIL
   =========================== */

function openAssignment(index) {
    const a      = assignments[index];
    const detail = document.getElementById("assignment-detail-view");
    const list   = document.getElementById("teacher-assignments-list");
    const form   = document.getElementById("teacher-form").closest(".teacher-form-card");

    list.classList.add("hidden");
    form.classList.add("hidden");
    detail.classList.remove("hidden");

    if (!Array.isArray(a.submissions)) a.submissions = [];

    const studentsInDiv = VALID_STUDENTS.filter(s => s.division === a.division);
    const submittedCount = a.submissions.length;

    const studentRows = studentsInDiv.map(student => {
        const done = a.submissions.some(s => s.roll === student.roll);
        return `
        <div class="student-row">
            <div>
                <div class="student-row-name">${escapeHTML(student.name)}</div>
                <div class="student-row-roll">Roll #${student.roll}</div>
            </div>
            <button class="btn-mark ${done ? "mark-done" : "mark-pending"}"
                onclick="toggleSubmission(${index}, '${student.roll}', '${escapeAttr(student.name)}')">
                ${done ? "✓ Submitted" : "Mark Done"}
            </button>
        </div>`;
    }).join("");

    detail.innerHTML = `
        <div class="detail-header">
            <h2>${escapeHTML(a.title)}</h2>
            <p>${escapeHTML(a.description || "")} · Due: ${formatDate(a.due)}</p>
        </div>
        <div class="detail-body">
            <div class="class-list-title">
                Division ${a.division} · ${submittedCount}/${studentsInDiv.length} Submitted
            </div>
            ${studentRows.length ? studentRows : '<p style="color:var(--text-muted);font-size:0.8rem;">No students in this division.</p>'}
        </div>
        <button class="btn-back" id="back-btn">← Back to List</button>
    `;

    document.getElementById("back-btn").onclick = () => {
        renderTeacherAssignments();
        form.classList.remove("hidden");
    };
}

/* ===========================
   TEACHER: TOGGLE SUBMISSION
   =========================== */

function toggleSubmission(assignIndex, roll, name) {
    const a = assignments[assignIndex];
    if (!Array.isArray(a.submissions)) a.submissions = [];

    const idx = a.submissions.findIndex(s => s.roll === roll);
    if (idx !== -1) {
        a.submissions.splice(idx, 1);
        showToast(`${name} marked as pending.`, "info");
    } else {
        a.submissions.push({ roll, name });
        showToast(`${name} marked as submitted! ✓`, "success");
    }

    saveAssignments();
    openAssignment(assignIndex); // re-render detail
}

/* ===========================
   TEACHER: DELETE ASSIGNMENT
   =========================== */

function deleteAssignment(index) {
    const title = assignments[index].title;
    if (confirm(`Delete "${title}"? This cannot be undone.`)) {
        assignments.splice(index, 1);
        saveAssignments();
        renderTeacherAssignments();
        showToast("Assignment deleted.", "info");
    }
}

/* ===========================
   TEACHER: CREATE ASSIGNMENT
   =========================== */

document.getElementById("teacher-form").onsubmit = function (e) {
    e.preventDefault();

    const title   = document.getElementById("assign-title").value.trim();
    const subject = document.getElementById("assign-subject").value.trim();

    if (!title || !subject) {
        showToast("Title and Subject are required.", "error");
        return;
    }

    assignments.push({
        title,
        subject,
        description: document.getElementById("assign-desc").value.trim(),
        due:         document.getElementById("assign-due").value,
        division:    document.getElementById("assign-division").value,
        submissions: []
    });

    saveAssignments();
    this.reset();
    renderTeacherAssignments();
    showToast(`"${title}" created! 📋`, "success");
};

/* ===========================
   LOGOUT
   =========================== */

document.getElementById("student-logout-btn").onclick =
document.getElementById("teacher-logout-btn").onclick = () => location.reload();

/* ===========================
   XSS HELPERS
   =========================== */

function escapeHTML(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function escapeAttr(str) {
    if (!str) return "";
    return String(str).replace(/'/g, "\\'");
}
