const form = document.getElementById("studentForm");
const tableBody = document.getElementById("tableBody");
const themeSwitch = document.getElementById("themeSwitch");
const addBtn = document.getElementById("addBtn");

// Input fields
const nameInput = document.getElementById("name");
const regInput = document.getElementById("reg");
const deptInput = document.getElementById("dept");
const yearInput = document.getElementById("year");
const marksInput = document.getElementById("marks");
const searchInput = document.getElementById("searchInput"); 

// Modal elements
const customModal = document.getElementById("customModal");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");
const modalButtonsContainer = document.getElementById("modalButtons");

let students = JSON.parse(localStorage.getItem("students")) || [];
let editIndex = null; 

// --- MODAL IMPLEMENTATION (Replaces alert/confirm) ---

/**
 * Shows a custom modal message.
 * @param {string} title 
 * @param {string} message 
 * @param {boolean} isConfirmation - If true, displays Confirm/Cancel buttons.
 * @param {function} onConfirm - Callback function executed on confirmation.
 */
function showModal(title, message, isConfirmation = false, onConfirm = null) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    
    // Clear previous buttons
    modalButtonsContainer.innerHTML = '';

    const closeButton = document.createElement('button');
    closeButton.classList.add('ripple-button');
    closeButton.textContent = isConfirmation ? 'Cancel' : 'OK';
    closeButton.onclick = () => customModal.classList.remove('visible');
    
    modalButtonsContainer.appendChild(closeButton);

    // If it's a confirmation, add the confirm button
    if (isConfirmation) {
        const confirmButton = document.createElement('button');
        confirmButton.classList.add('ripple-button');
        confirmButton.textContent = 'Confirm Delete';
        confirmButton.style.backgroundColor = 'var(--accent)';
        
        confirmButton.onclick = () => {
            customModal.classList.remove('visible');
            if (onConfirm) onConfirm();
        };
        modalButtonsContainer.appendChild(confirmButton);
    }
    
    customModal.classList.add('visible');
}

// --- UTILITY FUNCTIONS ---

/**
 * Checks if the Registration Number already exists (case-insensitive).
 */
function isRegNoDuplicate(reg, currentIndex = null) {
    const normalizedReg = reg.trim().toUpperCase();
    
    return students.some((student, index) => {
        const studentRegNormalized = student.reg.trim().toUpperCase();
        return studentRegNormalized === normalizedReg && index !== currentIndex;
    });
}

/**
 * Saves the current students array to localStorage.
 */
function saveStudents() {
    localStorage.setItem("students", JSON.stringify(students));
}

/**
 * Resets the form and prepares it for adding a new student.
 */
function resetForm() {
    form.reset();
    editIndex = null;
    regInput.disabled = false;
    addBtn.innerHTML = '<i class="fas fa-plus"></i> Add Student';
}

// -------------------------------------------------------------------

// ## READ / RENDER STUDENTS (Includes Search/Filter Logic)
function loadStudents() {
    tableBody.innerHTML = "";
    
    const searchTerm = searchInput.value.toLowerCase().trim();

    const filteredStudents = students.filter(student => {
        if (!searchTerm) return true;
        
        // Search by Name or Reg No (case-insensitive)
        return student.name.toLowerCase().includes(searchTerm) || 
               student.reg.toLowerCase().includes(searchTerm);
    });

    filteredStudents.forEach(student => {
        // Find the original index for correct CRUD operations
        const originalIndex = students.findIndex(s => s.reg === student.reg);
        addStudentRow(student, originalIndex);
    });
}

// --- ADD STUDENT ROW TO TABLE ---
function addStudentRow(student, originalIndex) {
    const tr = document.createElement("tr");
    tr.classList.add("table-row-animated");

    tr.innerHTML = `
        <td>${student.name}</td>
        <td>${student.reg}</td>
        <td>${student.dept}</td>
        <td>${student.year}</td>
        <td>${student.marks}</td>
        <td>
            <button class="edit-btn"><i class="fas fa-edit"></i> Edit</button>
            <button class="delete-btn"><i class="fas fa-trash"></i> Delete</button>
        </td>
    `;

    // Edit Student Logic
    tr.querySelector(".edit-btn").addEventListener("click", () => {
        // Populate the form
        nameInput.value = student.name;
        regInput.value = student.reg;
        deptInput.value = student.dept;
        yearInput.value = student.year;
        marksInput.value = student.marks;
        
        editIndex = originalIndex;
        regInput.disabled = true; // Prevent editing Reg No while updating
        addBtn.innerHTML = '<i class="fas fa-save"></i> Update Student';
        
        window.scrollTo(0, 0); 
    });

    // Delete Student Logic
    tr.querySelector(".delete-btn").addEventListener("click", () => {
        showModal(
            'Confirm Deletion', 
            `Are you sure you want to permanently delete the record for ${student.name} (${student.reg})?`, 
            true, // isConfirmation = true
            () => {
                students.splice(originalIndex, 1);
                saveStudents();
                loadStudents();
                
                if (editIndex === originalIndex) {
                    resetForm();
                }
                showModal('Success', 'Record deleted successfully.');
            }
        );
    });

    tableBody.appendChild(tr);
}

// -------------------------------------------------------------------

// ## RIPPLE EFFECT FOR BUTTONS (JS Logic)
document.addEventListener('DOMContentLoaded', () => {
    // Attach ripple effect to all elements with class .ripple-button
    document.querySelectorAll('.ripple-button').forEach(button => {
        button.addEventListener('click', function(e) {
            const circle = document.createElement('span');
            const diameter = Math.max(this.clientWidth, this.clientHeight);
            const radius = diameter / 2;
            
            // Calculate coordinates relative to the button
            const rect = this.getBoundingClientRect();
            circle.style.left = `${e.clientX - (rect.left + radius)}px`;
            circle.style.top = `${e.clientY - (rect.top + radius)}px`;
            
            circle.style.width = circle.style.height = `${diameter}px`;
            circle.classList.add('ripple');
            
            // Remove previous ripples before adding a new one
            const ripple = this.getElementsByClassName('ripple')[0];
            if (ripple) {
                ripple.remove();
            }
            this.appendChild(circle);
        });
    });
});


// -------------------------------------------------------------------

// ## CREATE / UPDATE (SAVE)
form.addEventListener("submit", e => {
    e.preventDefault();
    
    const newReg = regInput.value.trim();
    const marksValue = parseInt(marksInput.value.trim());

    // 1. Basic Validation
    if (!nameInput.value.trim() || !newReg) {
        showModal('Validation Error', 'Name and Registration Number are required!');
        return;
    }
    if (isNaN(marksValue) || marksValue < 0 || marksValue > 100) {
         showModal('Validation Error', 'Marks must be a number between 0 and 100.');
         return;
    }
    
    // 2. Uniqueness Check
    if (isRegNoDuplicate(newReg, editIndex)) {
        showModal('Uniqueness Error', `The Registration Number "${newReg}" already exists! Please enter a unique Reg No.`);
        return;
    }
    
    // 3. Data Collection
    const student = {
        name: nameInput.value.trim(),
        reg: newReg,
        dept: deptInput.value.trim(),
        year: yearInput.value.trim(),
        marks: marksInput.value.trim()
    };
    
    // 4. Add or Update
    if (editIndex === null) {
        // ADD
        students.push(student);
        showModal('Success', `Student ${student.name} added successfully!`);
    } else {
        // UPDATE
        students[editIndex] = student;
        showModal('Success', `Student ${student.name} updated successfully!`);
    }

    // 5. Final Steps
    saveStudents();
    loadStudents();
    resetForm();
});

// -------------------------------------------------------------------

// ## FILTER/SEARCH EVENT LISTENER
searchInput.addEventListener("input", loadStudents);

// -------------------------------------------------------------------

// ## THEME TOGGLE
themeSwitch.addEventListener("change", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    document.getElementById("themeText").textContent = isDark ? "Dark Mode" : "Light Mode";
    localStorage.setItem("theme", isDark ? "dark" : "light");
});

// --- LOAD THEME PREFERENCE ---
if(localStorage.getItem("theme") === "dark"){
    document.body.classList.add("dark");
    themeSwitch.checked = true;
    document.getElementById("themeText").textContent = "Dark Mode";
}

// Initial load
loadStudents();