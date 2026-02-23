

/* CONFIGURATION — Steps definition */

const STEPS = [
  { id: 'personal', icon: '👤', label: 'Personal Info' },
  { id: 'travel',   icon: '✈️', label: 'Travel'        },
  { id: 'docs',     icon: '📄', label: 'Documents'     },
  { id: 'review',   icon: '🔍', label: 'Review'        },
  { id: 'approved', icon: '🎉', label: 'Approved'      },
];

const STORAGE_KEY  = 'visa_app_data';
const STORAGE_STEP = 'visa_app_step';
const MAX_FILE     = 5 * 1024 * 1024; // 5MB



let currentStep = 0;

let formData = {
  firstName:     '',
  lastName:      '',
  email:         '',
  phone:         '',
  nationality:   '',
  dob:           '',
  passportNum:   '',
  destination:   '',
  arrivalDate:   '',
  departureDate: '',
  purpose:       '',
  duration:      '',
};

let uploadedFiles = {
  passport: null,
  photo:    null,
};

// Persistent reference number for this application
let appRef = localStorage.getItem('visa_ref') || generateRef();
localStorage.setItem('visa_ref', appRef);

// Read republic name from index.html so a rename there updates everywhere automatically
const REPUBLIC_NAME = document.querySelector('.brand-text .sub')?.textContent?.trim() || 'Republic of Anywhere';


/* UTILITY FUNCTIONS */

function generateRef() {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `VA-${year}-${rand}-C`;
}

function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function addMonths(str, months) {
  if (!str) return '—';
  const d = new Date(str + 'T00:00:00');
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function showToast(msg, duration = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}


/* LOCAL STORAGE, Save & Load Progress */

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  localStorage.setItem(STORAGE_STEP, currentStep);
}

function loadSaved() {
  const saved     = localStorage.getItem(STORAGE_KEY);
  const savedStep = parseInt(localStorage.getItem(STORAGE_STEP) || '0');

  if (saved) {
    formData    = { ...formData, ...JSON.parse(saved) };
    currentStep = savedStep;
  }

  dismissBanner();
  renderStep();
}

function dismissBanner() {
  document.getElementById('continueBanner').classList.add('hidden');
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_STEP);
  renderStep();
}

function checkSaved() {
  if (localStorage.getItem(STORAGE_KEY)) {
    document.getElementById('continueBanner').classList.remove('hidden');
  } else {
    renderStep();
  }
}


/*  PROGRESS — Stamp Track & Bar */

function renderProgress() {
  const track = document.getElementById('stampTrack');
  track.innerHTML = '';

  STEPS.forEach((step, i) => {
    const state = i < currentStep ? 'completed' : i === currentStep ? 'active' : 'inactive';

    const labelColor =
      state === 'active'    ? 'var(--gold)'      :
      state === 'completed' ? 'var(--green)'      :
                              'var(--text-muted)';

    // Stamp element
    const wrap = document.createElement('div');
    wrap.className = 'stamp-wrap';
    wrap.innerHTML = `
      <div class="stamp ${state}" title="${step.label}">
        <div class="stamp-icon">${i < currentStep ? '✓' : step.icon}</div>
        <div class="stamp-check">✓</div>
      </div>
      <div class="stamp-label" style="color: ${labelColor}">${step.label}</div>
    `;
    track.appendChild(wrap);

    // Connector line between stamps
    if (i < STEPS.length - 1) {
      const conn = document.createElement('div');
      conn.className = 'stamp-connector' + (i < currentStep ? ' done' : '');
      track.appendChild(conn);
    }
  });

  // Progress bar percentage
  const pct = (currentStep / (STEPS.length - 1)) * 100;
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressText').textContent =
    currentStep < STEPS.length - 1
      ? `STEP ${currentStep + 1} OF ${STEPS.length} · ${Math.round(pct)}% COMPLETE`
      : 'APPLICATION COMPLETE ✓';
}


/* progress navigation */

function renderStep(back = false) {
  const card = document.getElementById('formCard');
  card.className = 'form-card' + (back ? ' going-back' : '');
  renderProgress();

  const stepRenderers = [step1, step2, step3, step4, step5];
  stepRenderers[currentStep]();
}

function nextStep() {
  if (currentStep < STEPS.length - 1) {
    currentStep++;
    renderStep(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function prevStep() {
  if (currentStep > 0) {
    currentStep--;
    renderStep(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function goToStep(n) {
  const goingBack = n < currentStep;
  currentStep = n;
  renderStep(goingBack);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetApp() {
  currentStep = 0;
  formData = {
    firstName: '', lastName: '', email: '', phone: '',
    nationality: '', dob: '', passportNum: '',
    destination: '', arrivalDate: '', departureDate: '',
    purpose: '', duration: '',
  };
  uploadedFiles = { passport: null, photo: null };
  appRef = generateRef();
  localStorage.setItem('visa_ref', appRef);

  // Reset card styles that step 5 overrides
  const card = document.getElementById('formCard');
  card.removeAttribute('style');

  renderStep();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}


/* STEP 1 — Personal Information */

function step1() {
  document.getElementById('stepContent').innerHTML = `
    <div class="card-eyebrow">Step 01 of 05 · Personal Information</div>
    <div class="card-title">About the Applicant</div>
    <div class="card-desc">Please provide your details exactly as they appear on your passport.</div>

    <div class="field-row">
      <div class="field-group">
        <div class="field-label">First Name <span class="required-mark">*</span></div>
        <input class="field-input" id="f_firstName" placeholder="e.g. John" value="${formData.firstName}">
        <div class="field-error" id="e_firstName" style="display:none"></div>
      </div>
      <div class="field-group">
        <div class="field-label">Last Name <span class="required-mark">*</span></div>
        <input class="field-input" id="f_lastName" placeholder="e.g. Doe" value="${formData.lastName}">
        <div class="field-error" id="e_lastName" style="display:none"></div>
      </div>
    </div>

    <div class="field-group">
      <div class="field-label">Email Address <span class="required-mark">*</span></div>
      <input class="field-input" id="f_email" type="email" placeholder="e.g. johndoe@email.com" value="${formData.email}">
      <div class="field-error" id="e_email" style="display:none"></div>
    </div>

    <div class="field-row">
      <div class="field-group">
        <div class="field-label">Phone Number <span class="required-mark">*</span></div>
        <input class="field-input" id="f_phone" placeholder="+1 234 567 890" value="${formData.phone}">
        <div class="field-error" id="e_phone" style="display:none"></div>
      </div>
      <div class="field-group">
        <div class="field-label">Date of Birth <span class="required-mark">*</span></div>
        <input class="field-input" id="f_dob" type="date" value="${formData.dob}">
        <div class="field-error" id="e_dob" style="display:none"></div>
      </div>
    </div>

    <div class="field-row">
      <div class="field-group">
        <div class="field-label">Nationality <span class="required-mark">*</span></div>
        <div class="select-wrap">
          <select class="field-select" id="f_nationality">
            <option value="">Select country…</option>
            ${nationalities().map(n => `<option value="${n}" ${formData.nationality === n ? 'selected' : ''}>${n}</option>`).join('')}
          </select>
        </div>
        <div class="field-error" id="e_nationality" style="display:none"></div>
      </div>
      <div class="field-group">
        <div class="field-label">Passport Number <span class="required-mark">*</span></div>
        <input class="field-input" id="f_passportNum" placeholder="e.g. A12345678" value="${formData.passportNum}">
        <div class="field-error" id="e_passportNum" style="display:none"></div>
      </div>
    </div>

    <div class="btn-row">
      <span></span>
      <button class="btn btn-primary" onclick="validateStep1()">Next Step →</button>
    </div>
    <div class="form-card-bg-num">1</div>
  `;
}

function validateStep1() {
  const fields = [
    { id: 'firstName',   label: 'first name'      },
    { id: 'lastName',    label: 'last name'        },
    { id: 'email',       label: 'email',  type: 'email' },
    { id: 'phone',       label: 'phone number'     },
    { id: 'dob',         label: 'date of birth'    },
    { id: 'nationality', label: 'nationality'      },
    { id: 'passportNum', label: 'passport number'  },
  ];

  let valid = true;

  fields.forEach(f => {
    const input = document.getElementById('f_' + f.id);
    const err   = document.getElementById('e_' + f.id);
    const val   = input.value.trim();
    let msg     = '';

    if (!val) {
      msg = `⚠ Your application cannot proceed without a ${f.label}.`;
    } else if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      msg = '⚠ Your visa cannot be issued without a valid email address.';
    }

    if (msg) {
      input.classList.add('has-error');
      err.textContent  = msg;
      err.style.display = 'flex';
      valid = false;
    } else {
      input.classList.remove('has-error');
      err.style.display = 'none';
      formData[f.id] = val;
    }
  });

  if (valid) { saveProgress(); nextStep(); }
  else showToast('⚠ Please fill all required fields correctly.');
}


/* STEP 2 — Travel Details */

function step2() {
  // Pre-calculate duration if both dates already exist (e.g. returning from review)
  const preCalcDuration = (formData.arrivalDate && formData.departureDate)
    ? calcDuration(formData.arrivalDate, formData.departureDate)
    : formData.duration;

  document.getElementById('stepContent').innerHTML = `
    <div class="card-eyebrow">Step 02 of 05 · Travel Details</div>
    <div class="card-title">Your Journey</div>
    <div class="card-desc">Provide details about your intended visit. All fields are required.</div>

    <div class="field-group">
      <div class="field-label">Destination Country <span class="required-mark">*</span></div>
      <div class="select-wrap">
        <select class="field-select" id="f_destination">
          <option value="">Select destination…</option>
          ${destinations().map(d => `<option value="${d}" ${formData.destination === d ? 'selected' : ''}>${d}</option>`).join('')}
        </select>
      </div>
      <div class="field-error" id="e_destination" style="display:none"></div>
    </div>

    <div class="field-row">
      <div class="field-group">
        <div class="field-label">Arrival Date <span class="required-mark">*</span></div>
        <input class="field-input" id="f_arrivalDate" type="date" value="${formData.arrivalDate}"
               onchange="updateDuration()">
        <div class="field-error" id="e_arrivalDate" style="display:none"></div>
      </div>
      <div class="field-group">
        <div class="field-label">Departure Date <span class="required-mark">*</span></div>
        <input class="field-input" id="f_departureDate" type="date" value="${formData.departureDate}"
               onchange="updateDuration()">
        <div class="field-error" id="e_departureDate" style="display:none"></div>
      </div>
    </div>

    <div class="field-row">
      <div class="field-group">
        <div class="field-label">Purpose of Visit <span class="required-mark">*</span></div>
        <div class="select-wrap">
          <select class="field-select" id="f_purpose">
            <option value="">Select purpose…</option>
            ${['Tourism', 'Business', 'Transit', 'Medical', 'Education', 'Family Visit']
              .map(p => `<option value="${p}" ${formData.purpose === p ? 'selected' : ''}>${p}</option>`)
              .join('')}
          </select>
        </div>
        <div class="field-error" id="e_purpose" style="display:none"></div>
      </div>
      <div class="field-group">
        <div class="field-label">Duration (days)</div>
        <input class="field-input" id="f_duration"
               value="${preCalcDuration ? preCalcDuration + ' days' : 'Select dates above…'}"
               readonly
               style="opacity:0.6; cursor:not-allowed; background:rgba(0,0,0,0.5);">
        <div class="field-error" id="e_duration" style="display:none"></div>
      </div>
    </div>

    <div class="btn-row">
      <button class="btn btn-ghost" onclick="prevStep()">← Go Back</button>
      <button class="btn btn-primary" onclick="validateStep2()">Next Step →</button>
    </div>
    <div class="form-card-bg-num">2</div>
  `;
}

/* Called whenever arrival or departure date changes — updates duration display */
function calcDuration(arrival, departure) {
  if (!arrival || !departure) return null;
  const a = new Date(arrival + 'T00:00:00');
  const d = new Date(departure + 'T00:00:00');
  const diff = Math.round((d - a) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : null;
}

function updateDuration() {
  const arrival    = document.getElementById('f_arrivalDate')?.value;
  const departure  = document.getElementById('f_departureDate')?.value;
  const durationEl = document.getElementById('f_duration');
  if (!durationEl) return;

  const days = calcDuration(arrival, departure);

  if (days === null && arrival && departure) {
    // Dates exist but departure is before/same as arrival
    durationEl.value = 'Invalid date range';
    durationEl.style.color = 'var(--red-light)';
  } else if (days) {
    durationEl.value = `${days} days`;
    durationEl.style.color = 'var(--gold-light)';
    formData.duration = String(days);
  } else {
    durationEl.value = 'Select dates above…';
    durationEl.style.color = '';
  }
}

function validateStep2() {
  let valid = true;

  // Standard required field checks (excluding duration — it's auto-calculated)
  const fields = [
    { id: 'destination',   label: 'destination country' },
    { id: 'arrivalDate',   label: 'arrival date'        },
    { id: 'departureDate', label: 'departure date'      },
    { id: 'purpose',       label: 'purpose of visit'    },
  ];

  fields.forEach(f => {
    const input = document.getElementById('f_' + f.id);
    const err   = document.getElementById('e_' + f.id);
    const val   = input.value.trim();

    if (!val) {
      input.classList.add('has-error');
      err.textContent   = `⚠ No ${f.label} selected. This field is required before proceeding.`;
      err.style.display = 'flex';
      valid = false;
    } else {
      input.classList.remove('has-error');
      err.style.display = 'none';
      formData[f.id] = val;
    }
  });

  // Logical date check: departure must be strictly after arrival
  if (formData.arrivalDate && formData.departureDate) {
    if (new Date(formData.departureDate) <= new Date(formData.arrivalDate)) {
      document.getElementById('f_departureDate').classList.add('has-error');
      const err = document.getElementById('e_departureDate');
      err.textContent   = '⚠ Departure must be after your arrival date.';
      err.style.display = 'flex';
      valid = false;
    }
  }

  // Duration: auto-calculated from dates — validate it resolved to a positive number
  if (valid) {
    const days = calcDuration(formData.arrivalDate, formData.departureDate);
    if (!days || days < 1) {
      const err = document.getElementById('e_duration');
      err.textContent   = '⚠ Could not calculate duration. Please check your dates.';
      err.style.display = 'flex';
      valid = false;
    } else {
      formData.duration = String(days);
    }
  }

  if (valid) { saveProgress(); nextStep(); }
  else showToast('⚠ Please complete all travel details.');
}


/* STEP 3 — Document Upload */

function step3() {
  const pp = uploadedFiles.passport;
  const ph = uploadedFiles.photo;

  document.getElementById('stepContent').innerHTML = `
    <div class="card-eyebrow">Step 03 of 05 · Document Upload</div>
    <div class="card-title">Submit Your Documents</div>
    <div class="card-desc">Drag & drop or click to upload. Files must be JPG, PNG or PDF under 5MB each.</div>

    <!-- Passport Scan Upload Zone -->
    <div class="upload-zone ${pp ? 'uploaded' : ''}" id="zone_passport"
      onclick="document.getElementById('file_passport').click()"
      ondragover="handleDragOver(event, 'passport')"
      ondragleave="handleDragLeave('passport')"
      ondrop="handleDrop(event, 'passport')">
      ${pp ? '<div class="upload-status">✓ Uploaded</div>' : ''}
      <div class="upload-icon">${pp ? '🛂' : '📁'}</div>
      <div class="upload-label">
        ${pp
          ? `<strong>Passport Scan</strong>
             <div class="upload-file-name">${pp.name} · ${formatSize(pp.size)}</div>`
          : `<strong>Drop Passport Scan here</strong><br>or click to browse · PDF, JPG, PNG`
        }
      </div>
    </div>
    <div class="field-error" id="e_passport" style="display:none"></div>
    <input type="file" id="file_passport" accept=".pdf,.jpg,.jpeg,.png"
           onchange="handleFileSelect(event, 'passport')">

    <!-- Passport Photo Upload Zone -->
    <div class="upload-zone ${ph ? 'uploaded' : ''}" id="zone_photo"
      onclick="document.getElementById('file_photo').click()"
      ondragover="handleDragOver(event, 'photo')"
      ondragleave="handleDragLeave('photo')"
      ondrop="handleDrop(event, 'photo')">
      ${ph ? '<div class="upload-status">✓ Uploaded</div>' : ''}
      <div class="upload-icon">${ph ? '📸' : '🖼️'}</div>
      <div class="upload-label">
        ${ph
          ? `<strong>Applicant Photo</strong>
             <div class="upload-file-name">${ph.name} · ${formatSize(ph.size)}</div>`
          : `<strong>Drop Passport Photo here</strong><br>or click to browse · JPG or PNG only`
        }
      </div>
    </div>
    <div class="field-error" id="e_photo" style="display:none"></div>
    <input type="file" id="file_photo" accept=".jpg,.jpeg,.png"
           onchange="handleFileSelect(event, 'photo')">

    <div class="btn-row">
      <button class="btn btn-ghost" onclick="prevStep()">← Go Back</button>
      <button class="btn btn-primary" onclick="validateStep3()">Next Step →</button>
    </div>
    <div class="form-card-bg-num">3</div>
  `;
}

function handleFileSelect(e, type) {
  const file = e.target.files[0];
  if (!file) return;

  // Photo slot only accepts image files — reject PDFs even if browser slips them through
  if (type === 'photo') {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedMimes.includes(file.type)) {
      showToast('⚠ Passport photo must be a JPG or PNG image. PDFs are not accepted here.');
      e.target.value = ''; // clear the input so the same file can be re-selected after fix
      return;
    }
  }

  if (file.size > MAX_FILE) {
    showToast('⚠ File exceeds 5MB limit. Please compress and re-upload.');
    e.target.value = '';
    return;
  }
  uploadedFiles[type] = file;
  step3(); // Re-render to show uploaded state
}

function handleDragOver(e, type) {
  e.preventDefault();
  document.getElementById('zone_' + type).classList.add('dragging');
}

function handleDragLeave(type) {
  document.getElementById('zone_' + type).classList.remove('dragging');
}

function handleDrop(e, type) {
  e.preventDefault();
  handleDragLeave(type);
  const file = e.dataTransfer.files[0];
  if (!file) return;

  // Same MIME check as click-to-upload — PDFs not allowed for photo slot
  if (type === 'photo') {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedMimes.includes(file.type)) {
      showToast('⚠ Passport photo must be a JPG or PNG image. PDFs are not accepted here.');
      return;
    }
  }

  if (file.size > MAX_FILE) {
    showToast('⚠ File exceeds 5MB limit. Please compress and re-upload.');
    return;
  }
  uploadedFiles[type] = file;
  step3();
}

function validateStep3() {
  let valid = true;

  ['passport', 'photo'].forEach(type => {
    const zone = document.getElementById('zone_' + type);
    const err  = document.getElementById('e_' + type);

    if (!uploadedFiles[type]) {
      zone.classList.add('has-error');
      err.textContent   = `⚠ A ${type === 'passport' ? 'passport scan' : 'passport photo'} is required to proceed.`;
      err.style.display = 'flex';
      valid = false;
    } else {
      zone.classList.remove('has-error');
      err.style.display = 'none';
    }
  });

  if (valid) { saveProgress(); nextStep(); }
  else showToast('⚠ Both documents are required.');
}


/* STEP 4 — Review & Confirm */

function step4() {
  document.getElementById('stepContent').innerHTML = `
    <div class="card-eyebrow">Step 04 of 05 · Review & Confirm</div>
    <div class="card-title">Double-Check Everything</div>
    <div class="card-desc">Ensure all information is accurate before submitting. You can edit any section.</div>

    <!-- Personal Info -->
    <div class="review-section">
      <div class="review-section-title">
        Personal Information
        <button class="review-edit-btn" onclick="goToStep(0)">Edit</button>
      </div>
      <div class="review-row"><span class="review-key">Full Name</span>     <span class="review-val">${formData.firstName} ${formData.lastName}</span></div>
      <div class="review-row"><span class="review-key">Email</span>         <span class="review-val">${formData.email}</span></div>
      <div class="review-row"><span class="review-key">Phone</span>         <span class="review-val">${formData.phone}</span></div>
      <div class="review-row"><span class="review-key">Date of Birth</span> <span class="review-val">${formatDate(formData.dob)}</span></div>
      <div class="review-row"><span class="review-key">Nationality</span>   <span class="review-val">${formData.nationality}</span></div>
      <div class="review-row"><span class="review-key">Passport No.</span>  <span class="review-val gold">${formData.passportNum}</span></div>
    </div>

    <hr class="cert-divider">

    <!-- Travel Details -->
    <div class="review-section">
      <div class="review-section-title">
        Travel Details
        <button class="review-edit-btn" onclick="goToStep(1)">Edit</button>
      </div>
      <div class="review-row"><span class="review-key">Destination</span> <span class="review-val gold">${formData.destination}</span></div>
      <div class="review-row"><span class="review-key">Arrival</span>     <span class="review-val">${formatDate(formData.arrivalDate)}</span></div>
      <div class="review-row"><span class="review-key">Departure</span>   <span class="review-val">${formatDate(formData.departureDate)}</span></div>
      <div class="review-row"><span class="review-key">Purpose</span>     <span class="review-val">${formData.purpose}</span></div>
      <div class="review-row"><span class="review-key">Duration</span>    <span class="review-val">${formData.duration} days</span></div>
    </div>

    <hr class="cert-divider">

    <!-- Documents -->
    <div class="review-section">
      <div class="review-section-title">
        Documents
        <button class="review-edit-btn" onclick="goToStep(2)">Edit</button>
      </div>
      <div class="review-row">
        <span class="review-key">Passport Scan</span>
        <span class="review-val green">✓ ${uploadedFiles.passport?.name || 'Uploaded'}</span>
      </div>
      <div class="review-row">
        <span class="review-key">Applicant Photo</span>
        <span class="review-val green">✓ ${uploadedFiles.photo?.name || 'Uploaded'}</span>
      </div>
    </div>

    <div class="btn-row">
      <button class="btn btn-ghost" onclick="prevStep()">← Go Back</button>
      <button class="btn btn-primary" id="submitBtn" onclick="submitApplication()">Submit Application</button>
    </div>
    <div class="form-card-bg-num">4</div>
  `;
}

function submitApplication() {
  const btn = document.getElementById('submitBtn');
  btn.textContent = 'Processing…';
  btn.classList.add('loading');
  btn.disabled = true;

  // Simulate backend processing delay
  setTimeout(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_STEP);
    nextStep();
  }, 1800);
}


/* STEP 5 — Visa Approved + Certificate */

function step5() {
  // Remove the card's dark background for the certificate screen
  const card = document.getElementById('formCard');
  card.style.background = 'transparent';
  card.style.border     = 'none';
  card.style.boxShadow  = 'none';
  card.style.padding    = '0';

  const expiry = addMonths(formData.arrivalDate, 3);

  document.getElementById('stepContent').innerHTML = `
    <div class="success-screen">
      <div class="success-eyebrow">✓ Application Approved</div>
      <div class="success-title">Your Visa is Ready</div>
      <div class="success-sub">
        Congratulations, ${formData.firstName}. Your Type-C Tourist Visa has been approved.<br>
        Download and keep your certificate for entry purposes.
      </div>

      <!-- Visa Certificate (visible + used for PDF capture) -->
      <div id="certificate-render" style="display:block; width:100%; position:static; left:auto; top:auto;">
        <div class="cert-watermark">APPROVED</div>
        <div class="cert-inner">
          <div class="cert-seal">✅</div>
          <div class="cert-authority">${REPUBLIC_NAME} · Visa Services Division</div>
          <div class="cert-title">Visa Approved</div>
          <div class="cert-ref">${appRef}</div>
          <div class="cert-certifies">This certifies that</div>
          <div class="cert-name">${formData.firstName} ${formData.lastName}</div>
          <div class="cert-details-grid">
            <div class="cert-detail">
              <span class="cert-detail-label">Passport No.</span>
              <span class="cert-detail-value">${formData.passportNum}</span>
            </div>
            <div class="cert-detail">
              <span class="cert-detail-label">Destination</span>
              <span class="cert-detail-value">${formData.destination}</span>
            </div>
            <div class="cert-detail">
              <span class="cert-detail-label">Visa Type</span>
              <span class="cert-detail-value">Type C — Tourist</span>
            </div>
            <div class="cert-detail">
              <span class="cert-detail-label">Arrival</span>
              <span class="cert-detail-value">${formatDate(formData.arrivalDate)}</span>
            </div>
            <div class="cert-detail">
              <span class="cert-detail-label">Expires</span>
              <span class="cert-detail-value">${expiry}</span>
            </div>
          </div>
          <div class="cert-footer">
            Issued by the ${REPUBLIC_NAME} · Travel Authority<br>
            This document is valid for single entry · Keep this certificate for your records
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div style="margin-top: 24px;">
        <button class="download-btn" id="dlBtn" onclick="downloadCertificate()">
          ⬇ Download Certificate PDF
        </button>
        <div class="size-note">PDF · Max 5MB · Includes all your visa details</div>
        <br>
        <button class="new-app-btn" onclick="resetApp()">Start New Application</button>
      </div>
    </div>
  `;
}


/* PDF DOWNLOAD — html2canvas + jsPDF, compressed to ≤ 5MB */

async function downloadCertificate() {
  const btn = document.getElementById('dlBtn');
  btn.textContent = '⏳ Generating PDF…';
  btn.classList.add('loading');
  btn.disabled = true;

  try {
    const cert = document.getElementById('certificate-render');

    // Render the certificate element to a canvas
    const canvas = await html2canvas(cert, {
      scale:           2,
      useCORS:         true,
      backgroundColor: '#F7F2E8',
      logging:         false,
    });

    const { jsPDF } = window.jspdf;
    const pdf    = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW  = pdf.internal.pageSize.getWidth();
    const pageH  = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const imgW   = pageW - margin * 2;
    const imgH   = (canvas.height / canvas.width) * imgW;
    const imgY   = (pageH - Math.min(imgH, pageH - margin * 2)) / 2;

    // Start at high JPEG quality and compress down until under 5MB
    let quality = 0.92;
    let imgData = canvas.toDataURL('image/jpeg', quality);

    while (imgData.length * 0.75 > 5 * 1024 * 1024 && quality > 0.3) {
      quality -= 0.1;
      imgData  = canvas.toDataURL('image/jpeg', quality);
    }

    pdf.addImage(imgData, 'JPEG', margin, imgY, imgW, Math.min(imgH, pageH - margin * 2));
    pdf.save(`visa-certificate-${formData.lastName.toLowerCase()}-${appRef}.pdf`);

    // Success feedback
    btn.textContent       = '✓ Downloaded!';
    btn.style.background  = 'var(--green)';
    btn.style.color       = 'white';

    setTimeout(() => {
      btn.textContent      = '⬇ Download Certificate PDF';
      btn.style.background = '';
      btn.style.color      = '';
      btn.classList.remove('loading');
      btn.disabled         = false;
    }, 3000);

  } catch (err) {
    console.error('PDF generation failed:', err);
    btn.textContent = '⬇ Download Certificate PDF';
    btn.classList.remove('loading');
    btn.disabled = false;
    showToast('⚠ Download failed. Please try again.');
  }
}


/* DATA — Nationality & Destination Lists */

function nationalities() {
  return [
    'Afghan','Albanian','Algerian','American','Andorran','Angolan','Argentine','Armenian',
    'Australian','Austrian','Azerbaijani','Bangladeshi','Belarusian','Belgian','Bolivian',
    'Brazilian','British','Bulgarian','Cambodian','Cameroonian','Canadian','Chilean','Chinese',
    'Colombian','Congolese','Costa Rican','Croatian','Cuban','Czech','Danish','Dominican',
    'Dutch','Ecuadorian','Egyptian','Ethiopian','Finnish','French','Georgian','German',
    'Ghanaian','Greek','Guatemalan','Honduran','Hungarian','Indian','Indonesian','Iranian',
    'Iraqi','Irish','Israeli','Italian','Jamaican','Japanese','Jordanian','Kazakhstani',
    'Kenyan','Korean','Kuwaiti','Lebanese','Libyan','Lithuanian','Luxembourgish','Malaysian',
    'Maldivian','Mexican','Moroccan','Mozambican','Namibian','Nepalese','New Zealander',
    'Nicaraguan','Nigerian','Norwegian','Omani','Pakistani','Panamanian','Paraguayan','Peruvian',
    'Philippine','Polish','Portuguese','Qatari','Romanian','Russian','Rwandan','Saudi',
    'Senegalese','Serbian','Singaporean','Somali','South African','Spanish','Sri Lankan',
    'Sudanese','Swedish','Swiss','Syrian','Taiwanese','Tanzanian','Thai','Tunisian','Turkish',
    'Ugandan','Ukrainian','Uruguayan','Venezuelan','Vietnamese','Yemeni','Zambian','Zimbabwean',
  ];
}

function destinations() {
  return [
    'France 🇫🇷','Germany 🇩🇪','Italy 🇮🇹','Spain 🇪🇸','Portugal 🇵🇹','United Kingdom 🇬🇧',
    'Netherlands 🇳🇱','Belgium 🇧🇪','Switzerland 🇨🇭','Austria 🇦🇹','Greece 🇬🇷','Sweden 🇸🇪',
    'Norway 🇳🇴','Denmark 🇩🇰','Finland 🇫🇮','Poland 🇵🇱','Czech Republic 🇨🇿','Hungary 🇭🇺',
    'Croatia 🇭🇷','Japan 🇯🇵','South Korea 🇰🇷','China 🇨🇳','Thailand 🇹🇭','Vietnam 🇻🇳',
    'Indonesia 🇮🇩','Malaysia 🇲🇾','Singapore 🇸🇬','Philippines 🇵🇭','India 🇮🇳',
    'United Arab Emirates 🇦🇪','Qatar 🇶🇦','Turkey 🇹🇷','Egypt 🇪🇬','Morocco 🇲🇦',
    'South Africa 🇿🇦','Kenya 🇰🇪','Nigeria 🇳🇬','Ghana 🇬🇭','Tanzania 🇹🇿',
    'United States 🇺🇸','Canada 🇨🇦','Mexico 🇲🇽','Brazil 🇧🇷','Argentina 🇦🇷',
    'Colombia 🇨🇴','Chile 🇨🇱','Peru 🇵🇪','Australia 🇦🇺','New Zealand 🇳🇿',
  ];
}


/* INIT */

checkSaved();
