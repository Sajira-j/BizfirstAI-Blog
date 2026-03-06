
// Profile Page Upload Manager
window.profileUploader = (function() {

  let inputFile = null;
  let avatarHiddenField = null;
  let profileImages = null;
  let uploadButton = null;

  // Initialize on page load
  function init() {
    inputFile = document.getElementById('frmUploadFile');
    avatarHiddenField = document.querySelector('input[name="Avatar"]');
    profileImages = document.querySelectorAll('.profilePicture');
    uploadButton = document.querySelector('button[onclick*="uploadClick"]');

    // Check if elements exist
    if (!inputFile || !avatarHiddenField) {
      console.error('Required elements not found for profile uploader');
      return false;
    }

    return true;
  }

  // Triggered when upload button clicked
  function uploadClick() {
    if (!inputFile) {
      console.error('File input not initialized');
      return false;
    }

    // Open file picker
    inputFile.click();
    return false;
  }

  // Triggered when file selected
  function uploadSubmit() {
    const file = inputFile.files[0];

    if (!file) {
      console.error('No file selected');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showMessage('Please select an image file (JPG, PNG, GIF, or WebP)', 'error');
      inputFile.value = ''; // Clear selection
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      showMessage('File size must be less than 5MB', 'error');
      inputFile.value = ''; // Clear selection
      return;
    }

    // Show loading state
    showUploadProgress(true);

    // Create unique filename with timestamp to prevent caching
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = originalName.substring(originalName.lastIndexOf('.'));
    const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
    const uniqueFilename = `${nameWithoutExt}-${timestamp}${extension}`;

    // Create new File object with unique name
    const uniqueFile = new File([file], uniqueFilename, { type: file.type });

    // Create FormData
    const formData = new FormData();
    formData.append('file', uniqueFile);

    // Upload to server
    fetch('/api/storage/upload', {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      // Success - data is StorageDto
      uploadSuccess(data.slug);
    })
    .catch(error => {
      uploadError(error);
    })
    .finally(() => {
      showUploadProgress(false);
      inputFile.value = ''; // Clear file input
    });
  }

  // Upload succeeded
  function uploadSuccess(imageUrl) {
    console.log('Avatar uploaded successfully:', imageUrl);

    // Update hidden field with new URL
    if (avatarHiddenField) {
      avatarHiddenField.value = imageUrl;
    }

    // Update all profile images with cache-busting parameter
    if (profileImages) {
      // Add timestamp to force browser to reload image
      const cacheBustUrl = imageUrl + (imageUrl.includes('?') ? '&' : '?') + 'v=' + Date.now();
      profileImages.forEach(img => {
        img.src = cacheBustUrl;
      });
    }

    // Show success message
    showMessage('Avatar updated! Click Save to keep changes.', 'success');
  }

  // Upload failed
  function uploadError(error) {
    console.error('Avatar upload failed:', error);
    showMessage('Failed to upload avatar. Please try again.', 'error');
  }

  // Show/hide upload progress
  function showUploadProgress(show) {
    if (uploadButton) {
      if (show) {
        uploadButton.disabled = true;
        uploadButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
      } else {
        uploadButton.disabled = false;
        uploadButton.innerHTML = `
          <svg width="18" height="18" class="bi bi-arrow-up-circle">
            <use xlink:href="/_content/Blogifier.Themes.Standard/img/icon-sprites.svg#bi-arrow-up-circle"></use>
          </svg>`;
      }
    }
  }

  // Show temporary message
  function showMessage(message, type) {
    // Remove any existing messages
    const existingMsg = document.querySelector('.avatar-upload-message');
    if (existingMsg) {
      existingMsg.remove();
    }

    // Create message element
    const msgDiv = document.createElement('div');
    msgDiv.className = `alert alert-${type === 'success' ? 'success' : 'danger'} mt-2 avatar-upload-message`;
    msgDiv.textContent = message;
    msgDiv.style.fontSize = '14px';

    // Insert after avatar section
    const avatarSection = document.querySelector('.form-item');
    if (avatarSection) {
      avatarSection.appendChild(msgDiv);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        msgDiv.remove();
      }, 5000);
    }
  }

  // Reset avatar to default
  function resetAvatar() {
    if (!confirm('Reset to default avatar? You must click Save to apply this change.')) {
      return false;
    }

    // Clear hidden field
    if (avatarHiddenField) {
      avatarHiddenField.value = '';
    }

    // Update images to default
    // Note: We can't easily get the default avatar URL here, so we'll reload the page after save
    // For now, just clear the field and show message
    showMessage('Avatar will be reset to default. Click Save to apply.', 'success');

    return false;
  }

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', function() {
    init();
  });

  // Public API
  return {
    uploadClick: uploadClick,
    uploadSubmit: uploadSubmit,
    resetAvatar: resetAvatar
  };

})();

// Legacy copy function - keep for compatibility
function test(elm) {
  var copyText = document.getElementById(elm);
  var copyTextStore = copyText.dataset.link;
  copyText.select();
  copyText.setSelectionRange(0, 99999);
  document.execCommand("copy");
  copyText.value = "Copied!";
  copyText.classList.add("copied");
  setTimeout(function () {
    copyText.value = copyTextStore;
    copyText.classList.remove("copied");
  }, 500);
}
