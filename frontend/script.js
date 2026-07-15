// Configuration settings
const BACKEND_URL = "http://127.0.0.1:8000";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTENSION = ".txt";

// DOM Elements
const bodyEl = document.body;
const themeToggleBtn = document.getElementById("theme-toggle-btn");
const themeToggleIcon = document.getElementById("theme-toggle-icon");
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const fileBrowseBtn = document.getElementById("file-browse-btn");

const previewPanel = document.getElementById("preview-panel");
const previewFilename = document.getElementById("preview-filename");
const previewFilesize = document.getElementById("preview-filesize");
const previewTextContent = document.getElementById("preview-text-content");

const progressPanel = document.getElementById("progress-panel");
const uploadProgressBar = document.getElementById("upload-progress-bar");
const uploadPercentage = document.getElementById("upload-percentage");
const uploadStatusText = document.getElementById("upload-status-text");

const successAlert = document.getElementById("success-alert");
const successAlertMsg = document.getElementById("success-alert-msg");
const successAlertClose = document.getElementById("success-alert-close");
const errorAlert = document.getElementById("error-alert");
const errorAlertMsg = document.getElementById("error-alert-msg");
const errorAlertClose = document.getElementById("error-alert-close");

const uploadSubmitBtn = document.getElementById("upload-submit-btn");
const cancelBtn = document.getElementById("cancel-btn");

const historyList = document.getElementById("history-list");
const historyEmptyState = document.getElementById("history-empty-state");
const clearHistoryBtn = document.getElementById("clear-history-btn");
const metricCount = document.getElementById("metric-count");
const metricSize = document.getElementById("metric-size");

const toastEl = document.getElementById("live-toast");
const toastMsg = document.getElementById("toast-msg");
const toastIcon = document.getElementById("toast-icon");

// State Variables
let selectedFile = null;
let uploadHistory = [];
let bootstrapToast = null;

// ==========================================================================
// Initialization
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  // Initialize Bootstrap toast
  if (toastEl) {
    bootstrapToast = new bootstrap.Toast(toastEl, { delay: 4000 });
  }

  // Load Theme Preference
  initTheme();

  // Load Upload History
  loadHistory();

  // Perform backend connectivity check
  checkBackendHealth();

  // Attach Event Listeners
  setupEventListeners();
});

// ==========================================================================
// Event Listeners Setup
// ==========================================================================
function setupEventListeners() {
  // Theme Toggle
  themeToggleBtn.addEventListener("click", toggleTheme);

  // File browse triggers
  fileBrowseBtn.addEventListener("click", () => fileInput.click());
  dropZone.addEventListener("click", (e) => {
    // Prevent triggering twice if browse button itself was clicked
    if (e.target !== fileBrowseBtn) {
      fileInput.click();
    }
  });

  // File Input change
  fileInput.addEventListener("change", handleFileSelect);

  // Drag and Drop listeners
  ["dragenter", "dragover"].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add("dragover");
    }, false);
  });

  ["dragleave", "drop"].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove("dragover");
    }, false);
  });

  dropZone.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      fileInput.files = files; // Sync file input
      handleFileSelect();
    }
  }, false);

  // Submit and Clear Actions
  uploadSubmitBtn.addEventListener("click", startUploadProcess);
  cancelBtn.addEventListener("click", resetUploadPortal);

  // Alert Closures
  successAlertClose.addEventListener("click", () => successAlert.classList.add("d-none"));
  errorAlertClose.addEventListener("click", () => errorAlert.classList.add("d-none"));

  // History Actions
  clearHistoryBtn.addEventListener("click", clearHistory);
}

// ==========================================================================
// Theme (Light/Dark Mode) Logic
// ==========================================================================
function initTheme() {
  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  
  if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
    bodyEl.classList.add("dark-theme");
    themeToggleIcon.className = "bi bi-sun-fill";
  } else {
    bodyEl.classList.remove("dark-theme");
    themeToggleIcon.className = "bi bi-moon-stars-fill";
  }
}

function toggleTheme() {
  if (bodyEl.classList.contains("dark-theme")) {
    bodyEl.classList.remove("dark-theme");
    themeToggleIcon.className = "bi bi-moon-stars-fill";
    localStorage.setItem("theme", "light");
    showToast("Theme switched to Light Mode", "info");
  } else {
    bodyEl.classList.add("dark-theme");
    themeToggleIcon.className = "bi bi-sun-fill";
    localStorage.setItem("theme", "dark");
    showToast("Theme switched to Dark Mode", "info");
  }
}

// ==========================================================================
// Health Checks
// ==========================================================================
function checkBackendHealth() {
  fetch(BACKEND_URL + "/")
    .then(response => {
      if (response.ok) {
        console.log("FastAPI backend is online.");
      } else {
        showToast("Backend running with unexpected response status.", "warning");
      }
    })
    .catch(error => {
      console.warn("Could not connect to FastAPI server. Check running status on port 8000.", error);
      showToast("Backend offline. Please start the FastAPI server on port 8000.", "danger");
    });
}

// ==========================================================================
// File Input Handling & Validation
// ==========================================================================
function handleFileSelect() {
  const files = fileInput.files;
  if (files.length === 0) {
    resetUploadPortal();
    return;
  }
  
  selectedFile = files[0];
  hideAlerts();
  
  // Validate File Extension (.txt only)
  if (!selectedFile.name.toLowerCase().endsWith(ALLOWED_EXTENSION)) {
    showUploadError(`Invalid extension. Only ${ALLOWED_EXTENSION} files are supported.`);
    selectedFile = null;
    fileInput.value = "";
    return;
  }
  
  // Validate File Size (10 MB Max)
  if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
    showUploadError(`File is too large. Maximum allowed size is ${formatBytes(MAX_FILE_SIZE_BYTES)}.`);
    selectedFile = null;
    fileInput.value = "";
    return;
  }
  
  // Show file properties and preview
  renderPreview(selectedFile);
}

function renderPreview(file) {
  previewFilename.innerText = file.name;
  previewFilesize.innerText = formatBytes(file.size);
  
  const reader = new FileReader();
  
  reader.onload = (e) => {
    const text = e.target.result;
    // Cap preview output to first 1200 characters for safety
    const previewLength = 1200;
    if (text.length > previewLength) {
      previewTextContent.innerText = text.substring(0, previewLength) + "\n\n... [Content truncated for preview. Total length: " + text.length + " characters] ...";
    } else {
      previewTextContent.innerText = text || "[Empty file]";
    }
    
    // Smooth transition
    previewPanel.classList.remove("d-none");
    uploadSubmitBtn.classList.remove("d-none");
    cancelBtn.classList.remove("d-none");
  };
  
  reader.onerror = () => {
    previewTextContent.innerText = "Error reading file content preview.";
    previewPanel.classList.remove("d-none");
  };
  
  reader.readAsText(file);
}

function resetUploadPortal() {
  selectedFile = null;
  fileInput.value = "";
  previewPanel.classList.add("d-none");
  previewTextContent.innerText = "";
  previewFilename.innerText = "-";
  previewFilesize.innerText = "0 KB";
  
  progressPanel.classList.add("d-none");
  uploadProgressBar.style.width = "0%";
  uploadProgressBar.setAttribute("aria-valuenow", "0");
  uploadPercentage.innerText = "0%";
  
  uploadSubmitBtn.classList.add("d-none");
  cancelBtn.classList.add("d-none");
  
  hideAlerts();
}

// ==========================================================================
// File Upload Logic (XMLHttpRequest for real progress support)
// ==========================================================================
function startUploadProcess() {
  if (!selectedFile) {
    showUploadError("No file selected for upload.");
    return;
  }

  // Disable buttons during upload
  setUploadControlsDisabled(true);
  
  // Prepare progress bar UI
  progressPanel.classList.remove("d-none");
  uploadProgressBar.style.width = "0%";
  uploadPercentage.innerText = "0%";
  uploadStatusText.innerText = "Connecting to server...";
  hideAlerts();

  // Create multipart/form-data payload
  const formData = new FormData();
  formData.append("file", selectedFile);

  const xhr = new XMLHttpRequest();
  
  // Connect upload progress listener
  xhr.upload.addEventListener("progress", (event) => {
    if (event.lengthComputable) {
      const percentComplete = Math.round((event.loaded / event.total) * 100);
      uploadProgressBar.style.width = percentComplete + "%";
      uploadProgressBar.setAttribute("aria-valuenow", percentComplete.toString());
      uploadPercentage.innerText = percentComplete + "%";
      
      if (percentComplete === 100) {
        uploadStatusText.innerText = "Uploading finalized. Waiting for S3 confirmation...";
      } else {
        uploadStatusText.innerText = `Uploading stream: ${formatBytes(event.loaded)} / ${formatBytes(event.total)}`;
      }
    }
  });

  // Handle server response
  xhr.onreadystatechange = () => {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      setUploadControlsDisabled(false);
      progressPanel.classList.add("d-none");
      
      const status = xhr.status;
      let responseData = null;
      
      try {
        if (xhr.responseText) {
          responseData = JSON.parse(xhr.responseText);
        }
      } catch (err) {
        console.error("Failed to parse backend response JSON:", err);
      }
      
      if (status >= 200 && status < 300 && responseData && responseData.status === "success") {
        // Success
        handleUploadSuccess(responseData.message || "File uploaded successfully", selectedFile.name, selectedFile.size);
      } else {
        // Error
        let errorMsg = "S3 Upload failed. Check FastAPI server connectivity.";
        if (responseData && responseData.detail) {
          errorMsg = responseData.detail;
        } else if (responseData && responseData.message) {
          errorMsg = responseData.message;
        } else if (xhr.statusText) {
          errorMsg = `Server error ${xhr.status}: ${xhr.statusText}`;
        }
        handleUploadFailure(errorMsg);
      }
    }
  };

  // Open & send request
  xhr.open("POST", `${BACKEND_URL}/upload`, true);
  xhr.send(formData);
}

function handleUploadSuccess(msg, filename, size) {
  successAlertMsg.innerText = msg;
  successAlert.classList.remove("d-none");
  showToast(msg, "success");
  
  // Record in History
  addHistoryRecord(filename, size, "Success");
  
  // Reset portals
  resetUploadPortal();
}

function handleUploadFailure(errorMsg) {
  showUploadError(errorMsg);
  showToast("Upload process encountered errors.", "danger");
  
  // Record in History
  if (selectedFile) {
    addHistoryRecord(selectedFile.name, selectedFile.size, "Failed");
  }
}

function setUploadControlsDisabled(disabled) {
  uploadSubmitBtn.disabled = disabled;
  cancelBtn.disabled = disabled;
  fileBrowseBtn.disabled = disabled;
  fileInput.disabled = disabled;
  
  if (disabled) {
    uploadSubmitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Uploading...`;
  } else {
    uploadSubmitBtn.innerHTML = `<i class="bi bi-cloud-arrow-up-fill me-2 fs-5"></i> Upload to S3`;
  }
}

// ==========================================================================
// Alerts & Toasts Helpers
// ==========================================================================
function showUploadError(msg) {
  errorAlertMsg.innerText = msg;
  errorAlert.classList.remove("d-none");
}

function hideAlerts() {
  successAlert.classList.add("d-none");
  errorAlert.classList.add("d-none");
}

function showToast(msg, type = "info") {
  if (!bootstrapToast) return;
  
  toastMsg.innerText = msg;
  
  // Style toast wrapper based on type
  if (type === "success") {
    toastEl.className = "toast align-items-center text-white border-0 shadow-lg bg-success";
    toastIcon.className = "bi bi-check-circle-fill me-2 fs-5";
  } else if (type === "danger") {
    toastEl.className = "toast align-items-center text-white border-0 shadow-lg bg-danger";
    toastIcon.className = "bi bi-exclamation-triangle-fill me-2 fs-5";
  } else if (type === "warning") {
    toastEl.className = "toast align-items-center text-dark border-0 shadow-lg bg-warning";
    toastIcon.className = "bi bi-exclamation-circle-fill me-2 fs-5";
  } else {
    // Info / default
    toastEl.className = "toast align-items-center text-white border-0 shadow-lg bg-dark";
    toastIcon.className = "bi bi-info-circle-fill me-2 fs-5";
  }
  
  bootstrapToast.show();
}

// ==========================================================================
// Local History Storage & Render
// ==========================================================================
function loadHistory() {
  const historyString = localStorage.getItem("upload_history");
  if (historyString) {
    try {
      uploadHistory = JSON.parse(historyString);
    } catch (e) {
      console.error("Error reading localStorage upload history", e);
      uploadHistory = [];
    }
  }
  renderHistory();
}

function saveHistory() {
  localStorage.setItem("upload_history", JSON.stringify(uploadHistory));
}

function addHistoryRecord(filename, size, status) {
  const timestamp = new Date().toLocaleString();
  
  // Prepend to array
  uploadHistory.unshift({
    filename: filename,
    size: size,
    timestamp: timestamp,
    status: status
  });
  
  // Cap history at 15 items
  if (uploadHistory.length > 15) {
    uploadHistory.pop();
  }
  
  saveHistory();
  renderHistory();
}

function clearHistory() {
  uploadHistory = [];
  saveHistory();
  renderHistory();
  showToast("History log cleared.", "info");
}

function renderHistory() {
  historyList.innerHTML = "";
  
  if (uploadHistory.length === 0) {
    historyList.appendChild(historyEmptyState);
    metricCount.innerText = "0";
    metricSize.innerText = "0 KB";
    return;
  }
  
  let totalSize = 0;
  let successCount = 0;

  uploadHistory.forEach((item) => {
    const sizeFormatted = formatBytes(item.size);
    const isSuccess = item.status === "Success";
    
    if (isSuccess) {
      totalSize += item.size;
      successCount++;
    }
    
    const badgeClass = isSuccess ? "bg-success-soft text-success" : "bg-danger-soft text-danger";
    const statusIcon = isSuccess ? "bi-check-all text-success" : "bi-exclamation-circle text-danger";
    
    const li = document.createElement("li");
    li.className = "list-group-item history-item d-flex align-items-center justify-content-between py-3";
    li.innerHTML = `
      <div class="d-flex align-items-center overflow-hidden me-2">
        <div class="file-icon-wrapper p-2 bg-light-subtle rounded-3 me-3 flex-shrink-0 d-flex align-items-center justify-content-center">
          <i class="bi bi-file-text-fill text-secondary fs-4"></i>
        </div>
        <div class="text-truncate">
          <h4 class="h6 mb-1 text-truncate fw-semibold text-body" title="${item.filename}">${item.filename}</h4>
          <span class="text-muted font-monospace small" style="font-size: 0.75rem;">
            ${sizeFormatted} &bull; ${item.timestamp}
          </span>
        </div>
      </div>
      <div class="flex-shrink-0">
        <span class="badge ${badgeClass} rounded-pill px-3 py-2 d-flex align-items-center gap-1 font-monospace" style="font-size: 0.75rem;">
          <i class="bi ${statusIcon}"></i> ${item.status}
        </span>
      </div>
    `;
    historyList.appendChild(li);
  });
  
  // Update Metrics
  metricCount.innerText = successCount.toString();
  metricSize.innerText = formatBytes(totalSize);
}

// ==========================================================================
// Helper Utility Functions
// ==========================================================================
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
