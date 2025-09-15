// public/gallery-modal.js
// Gallery modal functionality for image expansion

class GalleryModalHandler {
  constructor() {
    this.galleryModal = document.getElementById('gallery-modal');
    this.modalImage = document.getElementById('gallery-modal-image');
    this.modalTitle = document.getElementById('gallery-modal-title');
    this.modalDescription = document.getElementById('gallery-modal-description');
    
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
