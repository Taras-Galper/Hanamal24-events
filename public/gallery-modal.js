// public/gallery-modal.js
// Robust gallery modal functionality with navigation and scrolling

class GalleryModalHandler {
  constructor() {
    this.galleryModal = document.getElementById('gallery-modal');
    this.modalImage = document.getElementById('gallery-modal-image');
    this.modalTitle = document.getElementById('gallery-modal-title');
    this.modalDescription = document.getElementById('gallery-modal-description');
    this.galleryGrid = document.getElementById('gallery-grid');
    this.viewMoreBtn = document.querySelector('.gallery-view-more-btn');
    this.thumbnailsContainer = document.getElementById('gallery-thumbnails');
    this.currentIndexElement = document.getElementById('gallery-current-index');
    this.totalCountElement = document.getElementById('gallery-total-count');
    this.prevBtn = document.getElementById('gallery-prev-btn');
    this.nextBtn = document.getElementById('gallery-next-btn');
    
    this.currentImagesShown = 6;
    this.imagesPerLoad = 6;
    this.galleryData = window.GALLERY_DATA || [];
    this.currentImageIndex = 0;
    this.isModalOpen = false;
    
    this.init();
  }

  init() {
    // Close modal when clicking outside the image
    this.galleryModal.addEventListener('click', (e) => {
      if (e.target === this.galleryModal) {
        this.closeModal();
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!this.isModalOpen) return;
      
      switch(e.key) {
        case 'Escape':
          this.closeModal();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.previousImage();
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.nextImage();
          break;
      }
    });

    // Touch/swipe support for mobile
    this.addTouchSupport();
  }

  addTouchSupport() {
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;

    this.galleryModal.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    });

    this.galleryModal.addEventListener('touchend', (e) => {
      endX = e.changedTouches[0].clientX;
      endY = e.changedTouches[0].clientY;
      
      const diffX = startX - endX;
      const diffY = startY - endY;
      
      // Only handle horizontal swipes
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0) {
          this.nextImage(); // Swipe left = next image
        } else {
          this.previousImage(); // Swipe right = previous image
        }
      }
    });
  }

  openModal(imageUrl, title, description, imageIndex = 0) {
    this.currentImageIndex = imageIndex;
    this.isModalOpen = true;
    
    // Set modal content
    this.modalImage.src = imageUrl;
    this.modalImage.alt = title;
    this.modalTitle.textContent = title;
    this.modalDescription.textContent = description || '';

    // Update counter
    this.updateCounter();
    
    // Generate thumbnails
    this.generateThumbnails();
    
    // Update navigation buttons
    this.updateNavigationButtons();

    // Show modal
    this.galleryModal.classList.add('show');
    document.body.style.overflow = 'hidden';

    // Add fade-in animation
    setTimeout(() => {
      this.galleryModal.style.opacity = '1';
    }, 10);
  }

  closeModal() {
    this.isModalOpen = false;
    
    // Add fade-out animation
    this.galleryModal.style.opacity = '0';
    
    setTimeout(() => {
      this.galleryModal.classList.remove('show');
      document.body.style.overflow = '';
    }, 300);
  }

  nextImage() {
    if (this.currentImageIndex < this.galleryData.length - 1) {
      this.currentImageIndex++;
      this.updateImage();
    }
  }

  previousImage() {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
      this.updateImage();
    }
  }

  goToImage(index) {
    if (index >= 0 && index < this.galleryData.length) {
      this.currentImageIndex = index;
      this.updateImage();
    }
  }

  updateImage() {
    const currentItem = this.galleryData[this.currentImageIndex];
    const imageUrl = this.getImageUrl(currentItem);
    const title = currentItem["כותרת (Title)"] || currentItem.Title || currentItem.Name || "תמונה";
    const description = currentItem["תיאור (Description)"] || currentItem.Description || "";

    // Update main image with fade effect
    this.modalImage.style.opacity = '0';
    
    setTimeout(() => {
      this.modalImage.src = imageUrl;
      this.modalImage.alt = title;
      this.modalTitle.textContent = title;
      this.modalDescription.textContent = description || '';
      this.modalImage.style.opacity = '1';
    }, 150);

    // Update counter
    this.updateCounter();
    
    // Update thumbnails
    this.updateThumbnails();
    
    // Update navigation buttons
    this.updateNavigationButtons();
  }

  updateCounter() {
    this.currentIndexElement.textContent = this.currentImageIndex + 1;
    this.totalCountElement.textContent = this.galleryData.length;
  }

  updateNavigationButtons() {
    this.prevBtn.classList.toggle('hidden', this.currentImageIndex <= 0);
    this.nextBtn.classList.toggle('hidden', this.currentImageIndex >= this.galleryData.length - 1);
  }

  generateThumbnails() {
    this.thumbnailsContainer.innerHTML = '';
    
    this.galleryData.forEach((item, index) => {
      const thumbnail = document.createElement('img');
      thumbnail.src = this.getImageUrl(item);
      thumbnail.alt = item["כותרת (Title)"] || item.Title || item.Name || "תמונה";
      thumbnail.className = 'gallery-thumbnail';
      
      if (index === this.currentImageIndex) {
        thumbnail.classList.add('active');
      }
      
      thumbnail.addEventListener('click', () => {
        this.goToImage(index);
      });
      
      this.thumbnailsContainer.appendChild(thumbnail);
    });
  }

  updateThumbnails() {
    const thumbnails = this.thumbnailsContainer.querySelectorAll('.gallery-thumbnail');
    thumbnails.forEach((thumb, index) => {
      thumb.classList.toggle('active', index === this.currentImageIndex);
    });
  }

  loadMoreImages() {
    const remainingImages = this.galleryData.slice(this.currentImagesShown);
    const imagesToLoad = remainingImages.slice(0, this.imagesPerLoad);
    
    if (imagesToLoad.length === 0) {
      // Hide the button if no more images
      if (this.viewMoreBtn) {
        this.viewMoreBtn.classList.add('hidden');
      }
      return;
    }

    // Create HTML for new images
    const newImagesHTML = imagesToLoad.map((item, index) => {
      const imageUrl = this.getImageUrl(item);
      const title = item["כותרת (Title)"] || item.Title || item.Name || "תמונה";
      const description = item["תיאור (Description)"] || item.Description || "";
      const globalIndex = this.currentImagesShown + index;
      
      return `
        <div class="gallery-item" onclick="openGalleryModal('${imageUrl}', '${title.replace(/'/g, "\\'")}', '${description.replace(/'/g, "\\'")}', ${globalIndex})">
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
        this.viewMoreBtn.classList.add('hidden');
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
          if (imageUrl) {
            // Try local backup first, then fallback to original
            return this.getLocalImagePath(imageUrl) || imageUrl;
          }
        } else if (typeof item[field] === 'string') {
          return this.getLocalImagePath(item[field]) || item[field];
        }
      }
    }
    
    return "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop"; // Fallback
  }

  getLocalImagePath(originalUrl) {
    // Check if we have a local backup of this image
    // This would be populated by the build process
    if (window.imageMap && window.imageMap[originalUrl]) {
      return window.imageMap[originalUrl];
    }
    return null;
  }
}

// Initialize gallery modal handler
const galleryModalHandler = new GalleryModalHandler();

// Expose functions to global scope for HTML onclick
window.openGalleryModal = (imageUrl, title, description, imageIndex = 0) => {
  galleryModalHandler.openModal(imageUrl, title, description, imageIndex);
};

window.closeGalleryModal = () => {
  galleryModalHandler.closeModal();
};

window.nextGalleryImage = () => {
  galleryModalHandler.nextImage();
};

window.previousGalleryImage = () => {
  galleryModalHandler.previousImage();
};

window.loadMoreGalleryImages = () => {
  galleryModalHandler.loadMoreImages();
};