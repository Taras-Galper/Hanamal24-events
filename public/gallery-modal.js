// public/gallery-modal.js
// Gallery modal functionality for image expansion and load more

class GalleryModalHandler {
  constructor() {
    this.galleryModal = document.getElementById('gallery-modal');
    this.modalImage = document.getElementById('gallery-modal-image');
    this.modalTitle = document.getElementById('gallery-modal-title');
    this.modalDescription = document.getElementById('gallery-modal-description');
    this.galleryGrid = document.getElementById('gallery-grid');
    this.viewMoreBtn = document.querySelector('.gallery-view-more-btn');
    
    this.currentImagesShown = 6;
    this.imagesPerLoad = 6;
    this.galleryData = window.GALLERY_DATA || [];
    
    this.init();
  }

  init() {
    // Close modal when clicking outside the image
    this.galleryModal.addEventListener('click', (e) => {
      if (e.target === this.galleryModal) {
        this.closeModal();
      }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.galleryModal.style.display === 'flex') {
        this.closeModal();
      }
    });
  }

  openModal(imageUrl, title, description) {
    // Set modal content
    this.modalImage.src = imageUrl;
    this.modalImage.alt = title;
    this.modalTitle.textContent = title;
    this.modalDescription.textContent = description || '';

    // Show modal
    this.galleryModal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent scrolling background

    // Add fade-in animation
    setTimeout(() => {
      this.galleryModal.style.opacity = '1';
    }, 10);
  }

  closeModal() {
    // Add fade-out animation
    this.galleryModal.style.opacity = '0';
    
    setTimeout(() => {
      this.galleryModal.style.display = 'none';
      document.body.style.overflow = ''; // Restore scrolling
    }, 300);
  }

  loadMoreImages() {
    const remainingImages = this.galleryData.slice(this.currentImagesShown);
    const imagesToLoad = remainingImages.slice(0, this.imagesPerLoad);
    
    if (imagesToLoad.length === 0) {
      // Hide the button if no more images
      if (this.viewMoreBtn) {
        this.viewMoreBtn.style.display = 'none';
      }
      return;
    }

    // Create HTML for new images
    const newImagesHTML = imagesToLoad.map(item => {
      const imageUrl = this.getImageUrl(item);
      const title = item["כותרת (Title)"] || item.Title || item.Name || "תמונה";
      const description = item["תיאור (Description)"] || item.Description || "";
      
      return `
        <div class="gallery-item" onclick="openGalleryModal('${imageUrl}', '${title.replace(/'/g, "\\'")}', '${description.replace(/'/g, "\\'")}')">
          <div class="gallery-image-container">
            <img src="${imageUrl}" alt="${title}" class="gallery-image" loading="lazy" onerror="this.classList.add('hidden'); this.nextElementSibling.classList.add('show');">
            <div class="image-placeholder">📷</div>
          </div>
          <div class="gallery-content">
            <h3 class="gallery-item-title">${title}</h3>
            ${description ? `<p class="gallery-item-description">${description}</p>` : ""}
          </div>
        </div>
      `;
    }).join('');

    // Add new images to grid with animation
    this.galleryGrid.insertAdjacentHTML('beforeend', newImagesHTML);
    
    // Update counter
    this.currentImagesShown += imagesToLoad.length;
    const remainingCount = this.galleryData.length - this.currentImagesShown;
    
    if (remainingCount <= 0) {
      // Hide button if all images are loaded
      if (this.viewMoreBtn) {
        this.viewMoreBtn.style.display = 'none';
      }
    } else {
      // Update button text with remaining count
      const btnCount = this.viewMoreBtn.querySelector('.btn-count');
      if (btnCount) {
        btnCount.textContent = `(${remainingCount} נוספות)`;
      }
    }

    // Smooth scroll to new images
    setTimeout(() => {
      const newImages = this.galleryGrid.querySelectorAll('.gallery-item');
      const lastNewImage = newImages[newImages.length - 1];
      lastNewImage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }

  getImageUrl(item) {
    // Helper function to get image URL from various possible field names
    const imageFields = [
      "תמונה (Image)",
      "Image", 
      "תמונה",
      "Picture",
      "Photo",
      "תמונה של המנה"
    ];
    
    for (const field of imageFields) {
      if (item[field]) {
        if (Array.isArray(item[field])) {
          const imageUrl = item[field][0]?.url || item[field][0];
          return imageUrl;
        }
        return item[field];
      }
    }
    
    return "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop"; // Fallback
  }
}

// Initialize gallery modal handler
const galleryModalHandler = new GalleryModalHandler();

// Expose functions to global scope for HTML onclick
window.openGalleryModal = (imageUrl, title, description) => {
  galleryModalHandler.openModal(imageUrl, title, description);
};

window.closeGalleryModal = () => {
  galleryModalHandler.closeModal();
};

window.loadMoreGalleryImages = () => {
  galleryModalHandler.loadMoreImages();
};
