// Package Modal Handler
class PackageModalHandler {
  constructor() {
    this.modal = null;
    this.packageData = null;
    this.dishData = null;
    this.packageDishMap = null;
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.modal = document.getElementById('package-modal');
    this.packageData = window.PACKAGE_DATA || [];
    this.dishData = window.DISH_DATA || [];
    this.packageDishMap = window.PACKAGE_DISH_MAP || {};

    // Add click handlers to package cards
    this.addPackageClickHandlers();
  }

  addPackageClickHandlers() {
    const packageCards = document.querySelectorAll('.package-card');
    packageCards.forEach(card => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        const packageId = card.getAttribute('data-package-id');
        if (packageId) {
          this.openModal(packageId);
        }
      });
    });
  }

  openModal(packageId) {
    if (!this.modal) return;

    // Find package data
    const packageInfo = this.packageData.find(pkg => 
      pkg.id === packageId || pkg.slug === packageId
    );

    if (!packageInfo) {
      console.error('Package not found:', packageId);
      return;
    }

    // Populate modal with package data
    this.populateModal(packageInfo);
    
    // Show modal
    this.modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  populateModal(packageInfo) {
    // Set title and price
    const title = document.getElementById('modal-package-title');
    const price = document.getElementById('modal-package-price');
    const description = document.getElementById('modal-package-description');
    const benefits = document.getElementById('modal-package-benefits');
    const menu = document.getElementById('modal-package-menu');

    if (title) {
      title.textContent = packageInfo["שם חבילה (Package Name)"] || packageInfo.Title || packageInfo.Name || "חבילה";
    }

    if (price) {
      const packagePrice = packageInfo["מחיר (Price)"] || packageInfo.Price;
      if (packagePrice) {
        price.textContent = this.formatPrice(packagePrice);
        price.style.display = 'block';
      } else {
        price.style.display = 'none';
      }
    }

    if (description) {
      const packageDescription = packageInfo["תיאור (Description)"] || packageInfo.Description || "";
      description.textContent = packageDescription;
    }

    if (benefits) {
      this.populateBenefits(benefits, packageInfo);
    }

    if (menu) {
      this.populateMenu(menu, packageInfo);
    }
  }

  populateBenefits(benefitsElement, packageInfo) {
    // Get benefits from package data
    const benefitsList = packageInfo["יתרונות (Benefits)"] || packageInfo.Benefits || [];
    
    if (Array.isArray(benefitsList) && benefitsList.length > 0) {
      benefitsElement.innerHTML = benefitsList.map(benefit => `<li>${benefit}</li>`).join('');
    } else {
      // Default benefits based on package type
      const defaultBenefits = this.getDefaultBenefits(packageInfo);
      benefitsElement.innerHTML = defaultBenefits.map(benefit => `<li>${benefit}</li>`).join('');
    }
  }

  getDefaultBenefits(packageInfo) {
    const packageName = (packageInfo["שם חבילה (Package Name)"] || packageInfo.Title || packageInfo.Name || "").toLowerCase();
    
    if (packageName.includes('vip') || packageName.includes('מורחבת')) {
      return [
        "שירות אישי ברמה גבוהה",
        "תפריט מלא ומגוון",
        "משקאות אלכוהוליים",
        "עיצוב שולחנות מקצועי",
        "צוות מקצועי לכל האירוע"
      ];
    } else if (packageName.includes('בסיסית') || packageName.includes('standard')) {
      return [
        "תפריט איכותי",
        "שירות מקצועי",
        "עיצוב בסיסי",
        "משקאות לא אלכוהוליים"
      ];
    } else {
      return [
        "תפריט מותאם אישית",
        "שירות מקצועי",
        "עיצוב ייחודי",
        "מחיר תחרותי"
      ];
    }
  }

  populateMenu(menuElement, packageInfo) {
    const packageName = packageInfo["שם חבילה (Package Name)"] || packageInfo.Title || packageInfo.Name || "";
    
    // Find dishes assigned to this package
    const assignedDishes = this.packageDishMap[packageName] || [];
    
    if (assignedDishes.length > 0) {
      menuElement.innerHTML = assignedDishes.map(dish => this.createDishCard(dish)).join('');
    } else {
      // Fallback: show all dishes if no specific assignment
      menuElement.innerHTML = this.dishData.map(dish => this.createDishCard(dish)).join('');
    }
  }

  createDishCard(dish) {
    const name = dish["שם המנה (Dish Name)"] || dish.Title || dish.Name || "מנה";
    const description = dish["תיאור (Description)"] || dish.Description || "";
    const price = dish["מחיר (Price)"] || dish.Price;
    const category = dish["קטגוריה (Category)"] || dish.Category || "";
    
    // Get dish image - check multiple possible field names
    const imageUrl = this.getDishImage(dish);

    return `
      <div class="package-menu-item">
        ${imageUrl ? `<div class="dish-image-container">
          <img src="${imageUrl}" alt="${name}" class="dish-image" onerror="this.classList.add('hidden')">
        </div>` : ""}
        <div class="dish-content">
          <h4>${name}</h4>
          ${description ? `<p class="dish-description">${description}</p>` : ""}
          ${category ? `<p class="dish-category">${category}</p>` : ""}
          ${price ? `<div class="dish-price">${this.formatPrice(price)}</div>` : ""}
        </div>
      </div>
    `;
  }

  getDishImage(dish) {
    // Check multiple possible field names for dish images
    const imageFields = [
      "תמונה (Image)",
      "Image", 
      "תמונה",
      "Picture",
      "Photo",
      "תמונה של המנה"
    ];
    
    for (const field of imageFields) {
      if (dish[field]) {
        if (Array.isArray(dish[field])) {
          return dish[field][0]?.url || dish[field][0];
        }
        return dish[field];
      }
    }
    
    return null;
  }

  formatPrice(price) {
    if (typeof price === 'number') {
      return `₪${price.toLocaleString()}`;
    }
    return price;
  }

  closeModal() {
    if (this.modal) {
      this.modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  }

  scrollToContact() {
    this.closeModal();
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

// Global functions for onclick handlers
function openPackageModal(packageId) {
  if (window.packageModalHandler) {
    window.packageModalHandler.openModal(packageId);
  }
}

function closePackageModal() {
  if (window.packageModalHandler) {
    window.packageModalHandler.closeModal();
  }
}

function scrollToContact() {
  if (window.packageModalHandler) {
    window.packageModalHandler.scrollToContact();
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.packageModalHandler = new PackageModalHandler();
});

// Also initialize immediately if DOM is already ready
if (document.readyState !== 'loading') {
  window.packageModalHandler = new PackageModalHandler();
}
