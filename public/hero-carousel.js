// Hero Carousel JavaScript
// Simple, lightweight carousel for static site

document.addEventListener('DOMContentLoaded', function() {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dot');
  const prevBtn = document.querySelector('.hero-nav.prev');
  const nextBtn = document.querySelector('.hero-nav.next');
  
  if (slides.length <= 1) return; // No need for carousel with single slide
  
  let currentSlide = 0;
  let autoSlideInterval;
  
  function showSlide(index) {
    // Hide all slides
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    // Show current slide
    slides[index].classList.add('active');
    dots[index].classList.add('active');
    
    currentSlide = index;
  }
  
  function nextSlide() {
    const next = (currentSlide + 1) % slides.length;
    showSlide(next);
  }
  
  function prevSlide() {
    const prev = (currentSlide - 1 + slides.length) % slides.length;
    showSlide(prev);
  }
  
  function startAutoSlide() {
    autoSlideInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
  }
  
  function stopAutoSlide() {
    clearInterval(autoSlideInterval);
  }
  
  // Event listeners
  if (nextBtn) nextBtn.addEventListener('click', () => {
    nextSlide();
    stopAutoSlide();
    startAutoSlide();
  });
  
  if (prevBtn) prevBtn.addEventListener('click', () => {
    prevSlide();
    stopAutoSlide();
    startAutoSlide();
  });
  
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      showSlide(index);
      stopAutoSlide();
      startAutoSlide();
    });
  });
  
  // Pause on hover
  const carousel = document.querySelector('.hero-carousel');
  if (carousel) {
    carousel.addEventListener('mouseenter', stopAutoSlide);
    carousel.addEventListener('mouseleave', startAutoSlide);
  }
  
  // Start auto-slide
  startAutoSlide();
  
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      prevSlide();
      stopAutoSlide();
      startAutoSlide();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
      stopAutoSlide();
      startAutoSlide();
    }
  });
});
