// Configuration settings
// NOTE: When deploying to AWS, replace with your EC2 Public IP/Domain:
// e.g., const BACKEND_URL = "http://<EC2_PUBLIC_IP>:8000";
const BACKEND_URL = window.BACKEND_API_URL || "http://127.0.0.1:8000";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB per file
const ALLOWED_EXTENSION = ".txt";

// DOM Elements - Theme & Global
const bodyEl = document.body;
const themeToggleBtn = document.getElementById("theme-toggle-btn");
const themeToggleIcon = document.getElementById("theme-toggle-icon");

// DOM Elements - Folder Selector
const folderInput = document.getElementById("folder-input");
const createFolderBtn = document.getElementById("create-folder-btn");
const folderPathBadge = document.getElementById("folder-path-badge");
const folderPresetBtns = document.querySelectorAll(".folder-preset-btn");
const folderChipBtns = document.querySelectorAll(".folder-chip-btn");

// DOM Elements - Upload Zone
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const fileBrowseBtn = document.getElementById("file-browse-btn");

// DOM Elements - Preview & Queue
const previewPanel = document.getElementById("preview-panel");
const previewFileCount = document.getElementById("preview-file-count");
const previewFilesize = document.getElementById("preview-filesize");
const selectedFilesList = document.getElementById("selected-files-list");
const previewActiveFilename = document.getElementById("preview-active-filename");
const previewTextContent = document.getElementById("preview-text-content");

// DOM Elements - Progress
const progressPanel = document.getElementById("progress-panel");
const uploadProgressBar = document.getElementById("upload-progress-bar");
const uploadPercentage = document.getElementById("upload-percentage");
const uploadStatusText = document.getElementById("upload-status-text");

// DOM Elements - Alerts
const successAlert = document.getElementById("success-alert");
const successAlertMsg = document.getElementById("success-alert-msg");
const successAlertClose = document.getElementById("success-alert-close");
const errorAlert = document.getElementById("error-alert");
const errorAlertMsg = document.getElementById("error-alert-msg");
const errorAlertClose = document.getElementById("error-alert-close");

// DOM Elements - Results Panel (S3 URLs Display)
const resultsPanel = document.getElementById("results-panel");
const resultsFilesList = document.getElementById("results-files-list");
const resultsCountBadge = document.getElementById("results-count-badge");

// DOM Elements - Action Buttons
const uploadSubmitBtn = document.getElementById("upload-submit-btn");
const cancelBtn = document.getElementById("cancel-btn");

// DOM Elements - History & Metrics
const historyList = document.getElementById("history-list");
const historyEmptyState = document.getElementById("history-empty-state");
const clearHistoryBtn = document.getElementById("clear-history-btn");
const metricCount = document.getElementById("metric-count");
const metricSize = document.getElementById("metric-size");

// DOM Elements - Toast
const toastEl = document.getElementById("live-toast");
const toastMsg = document.getElementById("toast-msg");
const toastIcon = document.getElementById("toast-icon");

// State Variables
let selectedFiles = []; // Array of File objects
let activePreviewIndex = 0;
let targetFolder = "";
let uploadHistory = [];
let bootstrapToast = null;

// ==========================================================================
// Initialization
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
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

  // Folder inputs & presets
  if (folderInput) {
    folderInput.addEventListener("input", handleFolderInput);
  }

  if (createFolderBtn) {
    createFolderBtn.addEventListener("click", handleCreateFolderAction);
  }

  folderPresetBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const folder = btn.getAttribute("data-folder") || "";
      setTargetFolder(folder);
    });
  });

  folderChipBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const folder = btn.getAttribute("data-folder") || "";
      setTargetFolder(folder);
    });
  });

  // File browse triggers
  fileBrowseBtn.addEventListener("click", () => fileInput.click());
  dropZone.addEventListener("click", (e) => {
    if (e.target !== fileBrowseBtn) {
      fileInput.click();
    }
  });

  // File Input change
  fileInput.addEventListener("change", handleFileInputChange);

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
    if (dt && dt.files && dt.files.length > 0) {
      addFilesToQueue(dt.files);
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
// Folder Selection & Handling
// ==========================================================================
function handleFolderInput() {
  setTargetFolder(folderInput.value, false);
}

function handleCreateFolderAction() {
  const rawValue = (folderInput ? folderInput.value : "").trim();
  const clean = rawValue.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  
  if (!clean) {
    showUploadError("Please type a folder name first (e.g. folder1, folder2, folder3).");
    showToast("Enter a folder name to create in S3", "warning");
    return;
  }

  if (createFolderBtn) {
    createFolderBtn.disabled = true;
    createFolderBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1" role="status"></span> Creating...`;
  }

  const formData = new FormData();
  formData.append("folder", clean);

  fetch(`${BACKEND_URL}/create-folder`, {
    method: "POST",
    body: formData
  })
    .then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.status === "success") {
        setTargetFolder(clean, true);
        showToast(`Folder '${clean}/' created in S3 bucket!`, "success");
        successAlertMsg.innerText = `Folder '${clean}/' created in Amazon S3. Ready for file uploads!`;
        successAlert.classList.remove("d-none");
      } else {
        const err = data.detail || data.message || "Failed to create folder in S3.";
        showUploadError(err);
        showToast(err, "danger");
      }
    })
    .catch((err) => {
      console.error("Create folder request error:", err);
      showUploadError("Could not reach backend to create folder.");
      showToast("Backend connection failed.", "danger");
    })
    .finally(() => {
      if (createFolderBtn) {
        createFolderBtn.disabled = false;
        createFolderBtn.innerHTML = `<i class="bi bi-folder-plus me-1"></i> Create`;
      }
    });
}

function setTargetFolder(folder, updateInput = true) {
  // Normalize folder: remove leading/trailing slashes
  const clean = folder.replace(/\\/g, "/").trim().replace(/^\/+|\/+$/g, "");
  targetFolder = clean;

  if (updateInput && folderInput) {
    folderInput.value = clean;
  }

  // Update badge preview
  if (folderPathBadge) {
    folderPathBadge.innerText = clean ? `Path: /${clean}/<filename>` : "Path: /<filename>";
  }

  // Highlight matching chip if present
  folderChipBtns.forEach(btn => {
    const btnFolder = btn.getAttribute("data-folder") || "";
    if (btnFolder === clean) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  // Update submit button text if files are queued
  updateSubmitButtonText();
}

// ==========================================================================
// Theme (Light/Dark Mode) Logic
// ==========================================================================
function initTheme() {
  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  
  if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
    bodyEl.classList.add("dark-theme");
    bodyEl.setAttribute("data-bs-theme", "dark");
    themeToggleIcon.className = "bi bi-sun-fill";
  } else {
    bodyEl.classList.remove("dark-theme");
    bodyEl.removeAttribute("data-bs-theme");
    themeToggleIcon.className = "bi bi-moon-stars-fill";
  }
}

function toggleTheme() {
  if (bodyEl.classList.contains("dark-theme")) {
    bodyEl.classList.remove("dark-theme");
    bodyEl.removeAttribute("data-bs-theme");
    themeToggleIcon.className = "bi bi-moon-stars-fill";
    localStorage.setItem("theme", "light");
    showToast("Theme switched to Light Mode", "info");
  } else {
    bodyEl.classList.add("dark-theme");
    bodyEl.setAttribute("data-bs-theme", "dark");
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
// File Input Handling & Multi-File Queue
// ==========================================================================
function handleFileInputChange() {
  const files = fileInput.files;
  if (!files || files.length === 0) return;
  addFilesToQueue(files);
  fileInput.value = ""; // Reset file input so re-selecting same files triggers change
}

function addFilesToQueue(fileList) {
  hideAlerts();
  const validFiles = [];
  const rejectedFiles = [];

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];

    // Validate Extension (.txt only)
    if (!file.name.toLowerCase().endsWith(ALLOWED_EXTENSION)) {
      rejectedFiles.push(`${file.name} (Only ${ALLOWED_EXTENSION} supported)`);
      continue;
    }

    // Validate Size (10 MB Max)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      rejectedFiles.push(`${file.name} (Exceeds ${formatBytes(MAX_FILE_SIZE_BYTES)})`);
      continue;
    }

    // Avoid exact duplicates in current queue
    const alreadyExists = selectedFiles.some(
      f => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified
    );

    if (!alreadyExists) {
      validFiles.push(file);
    }
  }

  if (rejectedFiles.length > 0) {
    showUploadError(`Some files were skipped:\n${rejectedFiles.join(", ")}`);
  }

  if (validFiles.length > 0) {
    selectedFiles = [...selectedFiles, ...validFiles];
    if (activePreviewIndex >= selectedFiles.length) {
      activePreviewIndex = 0;
    }
    renderFileQueue();
  } else if (selectedFiles.length === 0) {
    resetUploadPortal();
  }
}

function removeFileFromQueue(index, event) {
  if (event) event.stopPropagation();
  selectedFiles.splice(index, 1);
  if (selectedFiles.length === 0) {
    resetUploadPortal();
    return;
  }
  if (activePreviewIndex >= selectedFiles.length) {
    activePreviewIndex = selectedFiles.length - 1;
  }
  renderFileQueue();
}

function renderFileQueue() {
  if (selectedFiles.length === 0) {
    resetUploadPortal();
    return;
  }

  const totalCount = selectedFiles.length;
  let totalBytes = 0;
  selectedFiles.forEach(f => totalBytes += f.size);

  previewFileCount.innerText = `${totalCount} file${totalCount > 1 ? "s" : ""}`;
  previewFilesize.innerText = formatBytes(totalBytes);

  // Render list of files
  selectedFilesList.innerHTML = "";
  selectedFiles.forEach((file, idx) => {
    const isActive = idx === activePreviewIndex;
    const item = document.createElement("div");
    item.className = `selected-file-item ${isActive ? "active-file" : ""}`;
    item.innerHTML = `
      <div class="d-flex align-items-center text-truncate me-2">
        <i class="bi bi-filetype-txt text-primary me-2 fs-5 flex-shrink-0"></i>
        <span class="text-body fw-semibold text-truncate small">${file.name}</span>
        <span class="text-muted ms-2 small font-monospace flex-shrink-0">(${formatBytes(file.size)})</span>
      </div>
      <button type="button" class="file-remove-btn" title="Remove file" aria-label="Remove ${file.name}">
        <i class="bi bi-x-lg"></i>
      </button>
    `;

    // Click item to preview
    item.addEventListener("click", () => {
      activePreviewIndex = idx;
      renderFileQueue();
    });

    // Remove file button
    const removeBtn = item.querySelector(".file-remove-btn");
    removeBtn.addEventListener("click", (e) => removeFileFromQueue(idx, e));

    selectedFilesList.appendChild(item);
  });

  // Render active file text preview
  const activeFile = selectedFiles[activePreviewIndex] || selectedFiles[0];
  if (activeFile) {
    previewActiveFilename.innerText = activeFile.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const previewLength = 1200;
      if (text.length > previewLength) {
        previewTextContent.innerText = text.substring(0, previewLength) + `\n\n... [Preview truncated. Total size: ${text.length} chars] ...`;
      } else {
        previewTextContent.innerText = text || "[Empty text file]";
      }
    };
    reader.onerror = () => {
      previewTextContent.innerText = "Error previewing file content.";
    };
    reader.readAsText(activeFile);
  }

  // Show preview container and action buttons
  previewPanel.classList.remove("d-none");
  uploadSubmitBtn.classList.remove("d-none");
  cancelBtn.classList.remove("d-none");

  updateSubmitButtonText();
}

function updateSubmitButtonText() {
  if (selectedFiles.length === 0) return;
  const count = selectedFiles.length;
  const folderText = targetFolder ? ` to ${targetFolder}/` : " to S3";
  uploadSubmitBtn.innerHTML = `<i class="bi bi-cloud-arrow-up-fill me-2 fs-5"></i> Upload ${count} File${count > 1 ? "s" : ""}${folderText}`;
}

function resetUploadPortal() {
  selectedFiles = [];
  activePreviewIndex = 0;
  fileInput.value = "";
  
  previewPanel.classList.add("d-none");
  selectedFilesList.innerHTML = "";
  previewTextContent.innerText = "";
  previewActiveFilename.innerText = "-";
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
// File Upload Logic (Multi-file & Folder support via XMLHttpRequest)
// ==========================================================================
function startUploadProcess() {
  if (selectedFiles.length === 0) {
    showUploadError("No file(s) selected for upload.");
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

  // Create multipart/form-data payload with folder and files
  const formData = new FormData();
  selectedFiles.forEach(file => {
    formData.append("files", file);
  });
  formData.append("folder", targetFolder);

  const xhr = new XMLHttpRequest();
  
  // Progress listener
  xhr.upload.addEventListener("progress", (event) => {
    if (event.lengthComputable) {
      const percentComplete = Math.round((event.loaded / event.total) * 100);
      uploadProgressBar.style.width = percentComplete + "%";
      uploadProgressBar.setAttribute("aria-valuenow", percentComplete.toString());
      uploadPercentage.innerText = percentComplete + "%";
      
      if (percentComplete === 100) {
        uploadStatusText.innerText = "Upload completed. Finalizing S3 storage...";
      } else {
        uploadStatusText.innerText = `Uploading: ${formatBytes(event.loaded)} / ${formatBytes(event.total)}`;
      }
    }
  });

  // Server response handler
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
        handleUploadSuccess(responseData);
      } else {
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

  xhr.open("POST", `${BACKEND_URL}/upload`, true);
  xhr.send(formData);
}

// ==========================================================================
// Handle Upload Success & Display File URLs
// ==========================================================================
function handleUploadSuccess(responseData) {
  const uploadedFiles = responseData.uploaded_files || [];
  const count = uploadedFiles.length || selectedFiles.length;
  const folderText = responseData.folder ? ` in folder '${responseData.folder}'` : "";
  const msg = responseData.message || `Successfully uploaded ${count} file(s)${folderText} to S3!`;

  successAlertMsg.innerText = msg;
  successAlert.classList.remove("d-none");
  showToast(msg, "success");

  // Display S3 URLs prominently in results panel
  renderUploadedUrls(uploadedFiles);

  // Record in History
  if (uploadedFiles.length > 0) {
    uploadedFiles.forEach(fileMeta => {
      addHistoryRecord({
        filename: fileMeta.filename,
        key: fileMeta.key,
        folder: fileMeta.folder,
        size: fileMeta.size,
        s3_url: fileMeta.s3_url,
        status: "Success"
      });
    });
  } else {
    selectedFiles.forEach(f => {
      const key = targetFolder ? `${targetFolder}/${f.name}` : f.name;
      const directUrl = responseData.s3_url || responseData.file_url || "";
      addHistoryRecord({
        filename: f.name,
        key: key,
        folder: targetFolder,
        size: f.size,
        s3_url: directUrl,
        status: "Success"
      });
    });
  }

  // Clear selected queue
  resetUploadPortal();
}

function renderUploadedUrls(uploadedFiles) {
  if (!resultsPanel || !resultsFilesList) return;

  resultsFilesList.innerHTML = "";
  if (!uploadedFiles || uploadedFiles.length === 0) {
    resultsPanel.classList.add("d-none");
    return;
  }

  resultsCountBadge.innerText = `${uploadedFiles.length} File${uploadedFiles.length > 1 ? "s" : ""}`;

  uploadedFiles.forEach((fileItem) => {
    const fileCard = document.createElement("div");
    fileCard.className = "url-result-box";

    const displayKey = fileItem.key || fileItem.filename;
    const s3Url = fileItem.s3_url || "";
    const fileSizeFormatted = formatBytes(fileItem.size || 0);

    fileCard.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-1">
        <span class="fw-bold text-body small d-flex align-items-center">
          <i class="bi bi-folder-check text-warning me-2 fs-5"></i>
          <span class="font-monospace text-truncate" style="max-width: 320px;">${displayKey}</span>
        </span>
        <span class="badge bg-secondary-soft text-muted font-monospace" style="font-size: 0.72rem;">${fileSizeFormatted}</span>
      </div>
      <div class="input-group input-group-sm mt-2">
        <span class="input-group-text bg-transparent text-muted"><i class="bi bi-link-45deg"></i></span>
        <input type="text" class="form-control url-text-field text-secondary" readonly value="${s3Url}" title="S3 URL">
        <button class="btn btn-outline-primary copy-url-btn px-3" type="button" title="Copy S3 URL to Clipboard">
          <i class="bi bi-clipboard me-1"></i> Copy URL
        </button>
        <a href="${s3Url}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-secondary px-3" title="Open file in new tab">
          <i class="bi bi-box-arrow-up-right me-1"></i> Open
        </a>
      </div>
    `;

    // Attach copy button handler
    const copyBtn = fileCard.querySelector(".copy-url-btn");
    copyBtn.addEventListener("click", () => {
      copyToClipboard(s3Url, copyBtn);
    });

    resultsFilesList.appendChild(fileCard);
  });

  resultsPanel.classList.remove("d-none");
}

function handleUploadFailure(errorMsg) {
  showUploadError(errorMsg);
  showToast("Upload process encountered errors.", "danger");

  // Record failures in history
  if (selectedFiles.length > 0) {
    selectedFiles.forEach(f => {
      const key = targetFolder ? `${targetFolder}/${f.name}` : f.name;
      addHistoryRecord({
        filename: f.name,
        key: key,
        folder: targetFolder,
        size: f.size,
        s3_url: "",
        status: "Failed"
      });
    });
  }
}

function setUploadControlsDisabled(disabled) {
  uploadSubmitBtn.disabled = disabled;
  cancelBtn.disabled = disabled;
  fileBrowseBtn.disabled = disabled;
  fileInput.disabled = disabled;
  if (folderInput) folderInput.disabled = disabled;
  
  if (disabled) {
    uploadSubmitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Uploading to S3...`;
  } else {
    updateSubmitButtonText();
  }
}

// ==========================================================================
// Copy to Clipboard Utility
// ==========================================================================
function copyToClipboard(text, btnElement) {
  if (!text) return;

  const handleSuccess = () => {
    showToast("S3 URL copied to clipboard!", "success");
    if (btnElement) {
      btnElement.classList.add("copied");
      const originalHTML = btnElement.innerHTML;
      btnElement.innerHTML = `<i class="bi bi-clipboard-check-fill me-1"></i> Copied!`;
      setTimeout(() => {
        btnElement.classList.remove("copied");
        btnElement.innerHTML = originalHTML;
      }, 2000);
    }
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(handleSuccess).catch(err => {
      console.warn("Clipboard API failed, trying fallback:", err);
      fallbackCopyTextToClipboard(text, handleSuccess);
    });
  } else {
    fallbackCopyTextToClipboard(text, handleSuccess);
  }
}

function fallbackCopyTextToClipboard(text, callback) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.top = "-9999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    const successful = document.execCommand("copy");
    if (successful && callback) callback();
  } catch (err) {
    console.error("Fallback clipboard copy failed:", err);
  }
  document.body.removeChild(textArea);
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

function addHistoryRecord(record) {
  const timestamp = new Date().toLocaleString();
  
  uploadHistory.unshift({
    filename: record.filename,
    key: record.key || record.filename,
    folder: record.folder || "",
    size: record.size || 0,
    s3_url: record.s3_url || "",
    timestamp: timestamp,
    status: record.status || "Success"
  });
  
  if (uploadHistory.length > 20) {
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
    const displayPath = item.key || item.filename;
    
    const li = document.createElement("li");
    li.className = "list-group-item history-item d-flex flex-column py-3";

    const urlActionRow = item.s3_url ? `
      <div class="d-flex align-items-center gap-2 mt-2 pt-1 border-top border-light-subtle">
        <a href="${item.s3_url}" target="_blank" rel="noopener noreferrer" class="history-url-link" title="Open ${item.s3_url}">
          <i class="bi bi-box-arrow-up-right"></i> Open S3 URL
        </a>
        <button class="btn btn-link btn-sm p-0 text-primary text-decoration-none ms-auto copy-history-url-btn" title="Copy URL">
          <i class="bi bi-clipboard"></i> Copy URL
        </button>
      </div>
    ` : "";

    li.innerHTML = `
      <div class="d-flex align-items-center justify-content-between">
        <div class="d-flex align-items-center overflow-hidden me-2">
          <div class="file-icon-wrapper p-2 bg-light-subtle rounded-3 me-3 flex-shrink-0 d-flex align-items-center justify-content-center">
            <i class="bi bi-file-text-fill text-secondary fs-4"></i>
          </div>
          <div class="text-truncate">
            <h4 class="h6 mb-0 text-truncate fw-semibold text-body" title="${displayPath}">
              ${displayPath}
            </h4>
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
      </div>
      ${urlActionRow}
    `;

    // Attach copy event to history copy button
    if (item.s3_url) {
      const copyBtn = li.querySelector(".copy-history-url-btn");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => copyToClipboard(item.s3_url, copyBtn));
      }
    }

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
  if (!bytes || bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
