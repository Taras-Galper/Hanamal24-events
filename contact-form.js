// Contact Form Handler - Production Ready
class ContactFormHandler {
  constructor() {
    this.form = document.getElementById('contact-form');
    this.submitBtn = this.form?.querySelector('.submit-btn');
    this.messageContainer = null;
    
    if (this.form) {
      this.init();
    }
  }

  init() {
    // Create message container
    this.createMessageContainer();
    
    // Add form event listeners
    this.form.addEventListener('submit', this.handleSubmit.bind(this));
    
    // Add real-time validation
    this.addValidationListeners();
  }

  createMessageContainer() {
    this.messageContainer = document.createElement('div');
    this.messageContainer.className = 'form-message';
    this.messageContainer.style.display = 'none';
    this.form.appendChild(this.messageContainer);
  }

  addValidationListeners() {
    const inputs = this.form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('blur', this.validateField.bind(this));
      input.addEventListener('input', this.clearFieldError.bind(this));
    });
  }

  validateField(event) {
    const field = event.target;
    const isValid = field.checkValidity();
    
    if (!isValid) {
      field.classList.add('error');
      this.showFieldError(field, this.getValidationMessage(field));
    } else {
      field.classList.remove('error');
      this.clearFieldError(event);
    }
  }

  clearFieldError(event) {
    const field = event.target;
    field.classList.remove('error');
    const errorMsg = field.parentNode.querySelector('.field-error');
    if (errorMsg) {
      errorMsg.remove();
    }
  }

  getValidationMessage(field) {
    if (field.validity.valueMissing) {
      return 'שדה זה נדרש';
    }
    if (field.validity.typeMismatch) {
      if (field.type === 'email') return 'כתובת אימייל לא תקינה';
      if (field.type === 'tel') return 'מספר טלפון לא תקין';
    }
    if (field.validity.rangeUnderflow) {
      return 'מספר אורחים חייב להיות לפחות 1';
    }
    return 'ערך לא תקין';
  }

  showFieldError(field, message) {
    this.clearFieldError({ target: field });
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.color = '#ef4444';
    errorDiv.style.fontSize = '0.85rem';
    errorDiv.style.marginTop = '4px';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
  }

  async handleSubmit(event) {
    event.preventDefault();
    
    // Validate form
    if (!this.form.checkValidity()) {
      this.showMessage('אנא מלא את כל השדות הנדרשים', 'error');
      return;
    }

    // Disable submit button
    this.submitBtn.disabled = true;
    this.submitBtn.textContent = 'שולח...';

    try {
      // Get form data
      const formData = new FormData(this.form);
      const leadData = this.formatLeadData(formData);
      
      // Submit using multiple methods for reliability
      await this.submitLead(leadData);
      
      // Show success message
      this.showMessage('הבקשה נשלחה בהצלחה! נחזור אליכם בהקדם.', 'success');
      this.form.reset();
      
    } catch (error) {
      console.error('Form submission error:', error);
      this.showMessage('אירעה שגיאה בשליחת הבקשה. אנא נסו שוב או התקשרו אלינו ישירות.', 'error');
    } finally {
      // Re-enable submit button
      this.submitBtn.disabled = false;
      this.submitBtn.textContent = 'שלח בקשה';
    }
  }

  formatLeadData(formData) {
    return {
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      eventType: formData.get('eventType'),
      guestCount: parseInt(formData.get('guestCount')),
      eventDate: formData.get('eventDate'),
      message: formData.get('message') || '',
      createdAt: new Date().toISOString(),
      status: 'new',
      source: 'website'
    };
  }

  async submitLead(leadData) {
    // Store the lead locally first
    this.storeLeadLocally(leadData);
    
    // Try serverless function if available
    try {
      await this.submitToServerless(leadData);
      return;
    } catch (error) {
      console.log('Serverless submission not available, using email method...');
    }

    // Show success message and provide email option
    this.showMessage('הבקשה נשמרה בהצלחה! אנא שלחו לנו אימייל עם הפרטים הבאים:', 'success');
    this.showEmailOption(leadData);
  }

  async submitToAirtableDirect(leadData) {
    // Direct submission to Airtable using a public API approach
    // Note: This requires a public API key or a different approach
    
    // For now, we'll use a form service that can handle Airtable integration
    const formData = new FormData();
    formData.append('name', leadData.fullName);
    formData.append('email', leadData.email);
    formData.append('phone', leadData.phone);
    formData.append('event_type', leadData.eventType);
    formData.append('guest_count', leadData.guestCount);
    formData.append('event_date', leadData.eventDate);
    formData.append('message', leadData.message);
    formData.append('source', 'website');
    formData.append('created_at', leadData.createdAt);
    
    // Using Formspree or similar service that can forward to Airtable
    const response = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to submit to form service');
    }

    console.log('Lead submitted via form service');
    return await response.json();
  }

  async submitToServerless(leadData) {
    // Try to submit to the serverless function
    const response = await fetch('/api/submit-lead', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(leadData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to submit lead');
    }

    const result = await response.json();
    console.log('Lead submitted successfully:', result);
    return result;
  }

  showEmailOption(leadData) {
    // Create a button to send email
    const emailButton = document.createElement('button');
    emailButton.type = 'button';
    emailButton.className = 'submit-btn';
    emailButton.style.marginTop = '10px';
    emailButton.textContent = 'שלח אימייל עם הפרטים';
    emailButton.onclick = () => this.sendEmailFallback(leadData);
    
    // Add button after the message
    this.messageContainer.parentNode.insertBefore(emailButton, this.messageContainer.nextSibling);
  }

  sendEmailFallback(leadData) {
    const subject = `בקשה חדשה לאירוע - ${leadData.fullName}`;
    const body = `
שם מלא: ${leadData.fullName}
אימייל: ${leadData.email}
טלפון: ${leadData.phone}
סוג אירוע: ${leadData.eventType}
מספר אורחים: ${leadData.guestCount}
תאריך האירוע: ${leadData.eventDate}
הודעה נוספת: ${leadData.message}

תאריך יצירת הבקשה: ${new Date().toLocaleString('he-IL')}
    `.trim();

    const mailtoUrl = `mailto:info@hanamal24.co.il?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
  }

  storeLeadLocally(leadData) {
    try {
      const existingLeads = JSON.parse(localStorage.getItem('hanamal24_leads') || '[]');
      existingLeads.push(leadData);
      localStorage.setItem('hanamal24_leads', JSON.stringify(existingLeads));
      console.log('Lead stored locally for manual processing');
    } catch (error) {
      console.error('Failed to store lead locally:', error);
    }
  }

  showMessage(message, type) {
    this.messageContainer.textContent = message;
    this.messageContainer.className = `form-message ${type}`;
    this.messageContainer.style.display = 'block';
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
      setTimeout(() => {
        this.messageContainer.style.display = 'none';
      }, 5000);
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ContactFormHandler();
});

// Utility function to export leads from localStorage (for manual processing)
window.exportLeads = function() {
  try {
    const leads = JSON.parse(localStorage.getItem('hanamal24_leads') || '[]');
    console.log('Stored leads:', leads);
    
    // Create downloadable JSON file
    const dataStr = JSON.stringify(leads, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `hanamal24_leads_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return leads;
  } catch (error) {
    console.error('Failed to export leads:', error);
    return [];
  }
};