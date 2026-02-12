// UniAxis Technologies - JavaScript
// =====================================

// Global scroll lock management
let scrollLockCount = 0;

function lockScroll() {
    scrollLockCount++;
    if (scrollLockCount === 1) {
        const scrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        document.body.classList.add('modal-open');
    }
}

function unlockScroll() {
    scrollLockCount = Math.max(0, scrollLockCount - 1);
    if (scrollLockCount === 0) {
        const scrollY = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.classList.remove('modal-open');
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
}

// Force unlock on page show (handles back button)
window.addEventListener('pageshow', function(e) {
    scrollLockCount = 0;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.classList.remove('modal-open');
    document.body.classList.remove('menu-open');
});

// Remove preload class to enable transitions
window.addEventListener('load', function() {
    document.body.classList.remove('preload');
});

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    initThemeToggle();
    initMobileMenu();
    initScrollToTop();
    initFormHandling();
    initScrollAnimation();
    initCounterAnimation();
    updateActiveNav();
    initTestimonialsCarousel();
    initEnhancedAnimations();
    initBeforeAfterSliders();
    initLottieAnimations();
});

// =====================================
// THEME TOGGLE (DARK/LIGHT MODE)
// =====================================

function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedTheme = localStorage.getItem('theme');
    
    // Initialize theme
    let isDarkMode = storedTheme ? storedTheme === 'dark' : prefersDark;
    
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
    
    // Toggle theme on button click
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            isDarkMode = !isDarkMode;
            
            if (isDarkMode) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('theme', 'light');
            }
        });
    }
}

// =====================================
// MOBILE MENU
// =====================================

function initMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            const isActive = hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            
            // Prevent body scroll when menu is open
            if (isActive) {
                document.body.classList.add('menu-open');
                lockScroll();
            } else {
                document.body.classList.remove('menu-open');
                unlockScroll();
            }
        });
    }
    
    // Close menu when link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (hamburger && hamburger.classList.contains('active')) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.classList.remove('menu-open');
                unlockScroll();
            }
        });
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && hamburger && hamburger.classList.contains('active')) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.classList.remove('menu-open');
            unlockScroll();
        }
    });
}

// =====================================
// SCROLL TO TOP BUTTON
// =====================================

function initScrollToTop() {
    const scrollToTopBtn = document.getElementById('scrollToTop');
    
    if (!scrollToTopBtn) return;
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.classList.add('show');
        } else {
            scrollToTopBtn.classList.remove('show');
        }
    }, { passive: true });
    
    scrollToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// =====================================
// FORM HANDLING & VALIDATION
// =====================================

function initFormHandling() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleFormSubmit);
    }
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Validate required fields
    if (!data.name || !data.email || !data.subject || !data.message) {
        showFormMessage('Please fill in all required fields', 'error');
        return;
    }
    
    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        showFormMessage('Please enter a valid email address', 'error');
        return;
    }
    
    // Validate message length
    if (data.message.trim().length < 10) {
        showFormMessage('Message must be at least 10 characters', 'error');
        return;
    }
    
    // Submit form
    submitForm(form, data);
}

function submitForm(form, data) {
    const submitBtn = form.querySelector('[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner">⟳</span> Sending...';
    
    // Send to backend
    fetch('/api/contact', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            showFormMessage('✓ Message sent successfully! We will contact you soon.', 'success');
            form.reset();
        } else {
            showFormMessage(result.message || 'Error sending message. Please try again.', 'error');
        }
    })
    .catch(error => {
        console.error('Form submission error:', error);
        // Fallback: send via mailto
        const mailtoLink = `mailto:info@uniaxis.tech?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(formatMailBody(data))}`;
        window.location.href = mailtoLink;
        showFormMessage('Message prepared in email client.', 'success');
        form.reset();
    })
    .finally(() => {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    });
}

function formatMailBody(data) {
    return `
Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone || 'Not provided'}
Service: ${data.service || 'General Inquiry'}
Subject: ${data.subject}

Message:
${data.message}
    `.trim();
}

function showFormMessage(message, type) {
    const messageDiv = document.getElementById('formMessage');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `form-message ${type}`;
        messageDiv.style.display = 'block';
        
        // Auto-hide success message after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
        }
    }
}

// =====================================
// SCROLL ANIMATIONS
// =====================================

function initScrollAnimation() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'slideUp 0.8s ease-out forwards';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe service cards, product cards, and other elements
    const elements = document.querySelectorAll('.service-card, .product-card, .internship-card, .info-card, .stat-card, .benefit-item');
    elements.forEach(el => {
        el.style.opacity = '0';
        el.style.animation = 'none';
        observer.observe(el);
    });
}

// =====================================
// COUNTER ANIMATION
// =====================================

function initCounterAnimation() {
    const observerOptions = {
        threshold: 0.5
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                const counters = entry.target.querySelectorAll('[data-target]');
                counters.forEach(counter => {
                    animateCounter(counter);
                });
                entry.target.classList.add('counted');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
        observer.observe(statsSection);
    }
}

function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-target'));
    const duration = 2000; // 2 seconds
    const increment = target / (duration / 16); // 60fps
    let current = 0;
    
    const counter = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(counter);
        }
        element.textContent = Math.floor(current);
    }, 16);
}

// =====================================
// ACTIVE NAVIGATION LINK
// =====================================

function updateActiveNav() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    
    window.addEventListener('scroll', () => {
        let currentSection = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (window.scrollY >= sectionTop - 200) {
                currentSection = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    }, { passive: true });
}

// =====================================
// SMOOTH SCROLL BEHAVIOR
// =====================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// =====================================
// PERFORMANCE OPTIMIZATIONS
// =====================================

// Lazy load images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                }
                imageObserver.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// =====================================
// PRINT FRIENDLY
// =====================================

window.addEventListener('beforeprint', () => {
    document.querySelectorAll('nav, footer, .scroll-to-top').forEach(el => {
        el.style.display = 'none';
    });
});

window.addEventListener('afterprint', () => {
    document.querySelectorAll('nav, footer, .scroll-to-top').forEach(el => {
        el.style.display = '';
    });
});

console.log('UniAxis Technologies - Website loaded successfully');


// Throttle function for performance
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Optimized active nav update (merged to avoid duplicate listeners)
// Removed - handled in updateActiveNav()

// =====================================
// TESTIMONIALS CAROUSEL
// =====================================

function initTestimonialsCarousel() {
    const cards = document.querySelectorAll('.testimonial-card');
    const dotsContainer = document.getElementById('testimonialDots');
    const prevBtn = document.getElementById('prevTestimonial');
    const nextBtn = document.getElementById('nextTestimonial');
    
    if (!cards.length) return;
    
    let currentIndex = 0;
    
    // Create dots
    cards.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = `carousel-dot ${index === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer?.appendChild(dot);
    });
    
    function goToSlide(index) {
        cards.forEach(card => card.classList.remove('active'));
        document.querySelectorAll('.carousel-dot').forEach(dot => dot.classList.remove('active'));
        
        currentIndex = index;
        cards[currentIndex].classList.add('active');
        document.querySelectorAll('.carousel-dot')[currentIndex].classList.add('active');
    }
    
    function nextSlide() {
        goToSlide((currentIndex + 1) % cards.length);
    }
    
    function prevSlide() {
        goToSlide((currentIndex - 1 + cards.length) % cards.length);
    }
    
    prevBtn?.addEventListener('click', prevSlide);
    nextBtn?.addEventListener('click', nextSlide);
    
    // Auto-advance carousel every 8 seconds
    setInterval(nextSlide, 8000);
}

// =====================================
// ENHANCED ANIMATIONS
// =====================================

function initEnhancedAnimations() {
    // Add hover effects to service cards
    const cards = document.querySelectorAll('.service-card, .team-card, .product-showcase, .stat-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s ease';
            this.style.transform = 'translateY(-8px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Add parallax effect to hero section
    const hero = document.querySelector('.hero');
    if (hero) {
        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY;
            if (scrolled < hero.offsetHeight) {
                hero.style.backgroundPosition = `center ${scrolled * 0.5}px`;
            }
        }, { passive: true });
    }
    
    // Animate numbers on stat cards
    const statNumbers = document.querySelectorAll('[data-target]');
    statNumbers.forEach(stat => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !stat.classList.contains('animated')) {
                animateValue(stat);
                stat.classList.add('animated');
                observer.unobserve(stat);
            }
        });
        observer.observe(stat);
    });
}

function animateValue(element) {
    const target = parseInt(element.getAttribute('data-target'));
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;
    
    const interval = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(interval);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// =====================================
// BEFORE/AFTER SLIDERS
// =====================================

function initBeforeAfterSliders() {
    const sliders = document.querySelectorAll('.comparison-slider');
    
    sliders.forEach((slider, index) => {
        const input = slider.querySelector('.slider-input');
        const afterImage = slider.querySelector('.after-image');
        const sliderButton = slider.querySelector('.slider-button');
        
        if (!input || !afterImage) return;
        
        input.addEventListener('input', (e) => {
            const value = e.target.value;
            afterImage.style.clipPath = `inset(0 ${100 - value}% 0 0)`;
            sliderButton.style.left = `${value}%`;
        });
        
        // Initialize position
        const initialValue = input.value;
        afterImage.style.clipPath = `inset(0 ${100 - initialValue}% 0 0)`;
        sliderButton.style.left = `${initialValue}%`;
    });
}

// =====================================
// LOTTIE ANIMATIONS
// =====================================

function initLottieAnimations() {
    // Check if Lottie is loaded
    if (typeof lottie === 'undefined') {
        console.log('Lottie not loaded yet');
        return;
    }
    
    // Add loading animation to hero section
    const heroAnimation = document.querySelector('.hero-animation');
    if (heroAnimation) {
        lottie.loadAnimation({
            container: heroAnimation,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: 'https://assets2.lottiefiles.com/packages/lf20_V9t630.json' // Tech animation
        });
    }
    
    // Success animation for form submission
    window.showSuccessAnimation = function() {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-animation';
        successDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 200px; height: 200px; z-index: 10000;';
        document.body.appendChild(successDiv);
        
        const animation = lottie.loadAnimation({
            container: successDiv,
            renderer: 'svg',
            loop: false,
            autoplay: true,
            path: 'https://assets9.lottiefiles.com/packages/lf20_jbrw3hcz.json' // Success checkmark
        });
        
        animation.addEventListener('complete', () => {
            setTimeout(() => successDiv.remove(), 500);
        });
    };
}

// Track page views with Google Analytics
if (typeof gtag !== 'undefined') {
    gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: window.location.pathname
    });
    
    // Track button clicks
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', function() {
            gtag('event', 'button_click', {
                'event_category': 'engagement',
                'event_label': this.textContent.trim()
            });
        });
    });
}

// Contact Form Submission
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(this);
        const name = this.querySelector('input[type="text"]:nth-of-type(1)').value;
        const email = this.querySelector('input[type="email"]').value;
        const subject = this.querySelector('input[type="text"]:nth-of-type(2)').value;
        const message = this.querySelector('textarea').value;

        // Validate form
        if (!name || !email || !subject || !message) {
            showAlert('Please fill in all fields', 'error');
            return;
        }

        if (!isValidEmail(email)) {
            showAlert('Please enter a valid email address', 'error');
            return;
        }

        // Create mailto link
        const mailtoLink = `mailto:info@uniaxis.tech?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`From: ${name} (${email})\n\n${message}`)}`;
        window.location.href = mailtoLink;

        // Show success message
        showAlert('Message sent successfully! We will get back to you soon.', 'success');
        
        // Reset form
        this.reset();
    });
}

// Email validation helper
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Enhanced form validation function
function validateForm(formData) {
    const errors = [];
    
    // Name validation
    if (!formData.name || formData.name.trim().length < 2) {
        errors.push('Name must be at least 2 characters');
    }
    
    // Email validation
    if (!formData.email || !isValidEmail(formData.email)) {
        errors.push('Please enter a valid email address');
    }
    
    // Subject validation
    if (!formData.subject || formData.subject.trim().length < 3) {
        errors.push('Subject must be at least 3 characters');
    }
    
    // Message validation
    if (!formData.message || formData.message.trim().length < 10) {
        errors.push('Message must be at least 10 characters');
    }
    
    return errors;
}

// Alert notification
function showAlert(message, type) {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10B981' : '#EF4444'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(alert);

    // Remove after 3 seconds
    setTimeout(() => {
        alert.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

// Smooth scroll behavior for better UX
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#' && document.querySelector(href)) {
            e.preventDefault();
            document.querySelector(href).scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add animations to service cards and internship cards on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeIn 0.6s ease-out forwards';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.service-card, .internship-card, .stat-card').forEach(card => {
    card.style.opacity = '0';
    observer.observe(card);
});

// Add CSS animation styles dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Add scroll-to-top button
function addScrollToTopButton() {
    const scrollTopBtn = document.createElement('button');
    scrollTopBtn.innerHTML = '↑';
    scrollTopBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        font-size: 24px;
        opacity: 0;
        pointer-events: none;
        transition: all 0.3s ease;
        z-index: 999;
    `;

    document.body.appendChild(scrollTopBtn);

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollTopBtn.style.opacity = '1';
            scrollTopBtn.style.pointerEvents = 'auto';
        } else {
            scrollTopBtn.style.opacity = '0';
            scrollTopBtn.style.pointerEvents = 'none';
        }
    });

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Initialize scroll-to-top button when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addScrollToTopButton);
} else {
    addScrollToTopButton();
}

// Optimize performance with passive event listeners
document.addEventListener('scroll', () => {}, { passive: true });

// ======================================
//  SEARCH FUNCTIONALITY
// ======================================

function initSearchModal() {
    const searchBtn = document.querySelector('.search-btn');
    const searchModal = document.getElementById('searchModal');
    const searchClose = searchModal?.querySelector('.search-close');
    const searchInput = searchModal?.querySelector('#searchInput');
    const searchResults = searchModal?.querySelector('.search-results');
    
    if (!searchBtn || !searchModal) return;
    
    // Open search modal
    searchBtn.addEventListener('click', () => {
        searchModal.classList.add('active');
        searchInput.focus();
    });
    
    // Close search modal
    searchClose?.addEventListener('click', () => {
        searchModal.classList.remove('active');
        searchInput.value = '';
        searchResults.innerHTML = '';
    });
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchModal.classList.contains('active')) {
            searchModal.classList.remove('active');
        }
    });
    
    // Close on background click
    searchModal.addEventListener('click', (e) => {
        if (e.target === searchModal) {
            searchModal.classList.remove('active');
        }
    });
    
    // Search functionality
    searchInput?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        if (query.length < 2) {
            searchResults.innerHTML = '';
            return;
        }
        
        const results = performSearch(query);
        displaySearchResults(results, searchResults);
    });
}

function performSearch(query) {
    const results = [];
    const sections = document.querySelectorAll('section');
    
    sections.forEach(section => {
        const sectionTitle = section.querySelector('h2')?.textContent || '';
        const sectionContent = section.textContent.toLowerCase();
        
        if (sectionContent.includes(query)) {
            const excerpt = extractExcerpt(sectionContent, query);
            results.push({
                title: sectionTitle,
                excerpt: excerpt,
                element: section
            });
        }
    });
    
    return results.slice(0, 10); // Limit to 10 results
}

function extractExcerpt(content, query) {
    const index = content.indexOf(query);
    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + query.length + 50);
    let excerpt = content.substring(start, end).trim();
    
    if (start > 0) excerpt = '...' + excerpt;
    if (end < content.length) excerpt = excerpt + '...';
    
    return excerpt;
}

function displaySearchResults(results, container) {
    if (results.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">No results found</p>';
        return;
    }
    
    container.innerHTML = results.map(result => `
        <div class="search-result-item" data-section="${result.title}">
            <div class="search-result-title">${result.title}</div>
            <div class="search-result-desc">${result.excerpt}</div>
        </div>
    `).join('');
    
    // Add click handlers to scroll to section
    container.querySelectorAll('.search-result-item').forEach((item, index) => {
        item.addEventListener('click', () => {
            results[index].element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            document.getElementById('searchModal').classList.remove('active');
        });
    });
}



// ======================================
//  VISITOR COUNTER
// ======================================

function initVisitorCounter() {
    const counterElement = document.querySelector('.visitor-count');
    if (!counterElement) return;
    
    // Simulate live visitor count (15-35 range)
    const getVisitorCount = () => {
        const stored = localStorage.getItem('visitorCount');
        if (stored) {
            const data = JSON.parse(stored);
            const timeDiff = Date.now() - data.timestamp;
            
            // Update every 30 seconds
            if (timeDiff < 30000) {
                return data.count;
            }
        }
        
        // Generate new random count
        const count = Math.floor(Math.random() * 21) + 15; // 15-35
        localStorage.setItem('visitorCount', JSON.stringify({
            count: count,
            timestamp: Date.now()
        }));
        return count;
    };
    
    const updateCounter = () => {
        const count = getVisitorCount();
        counterElement.textContent = count;
    };
    
    updateCounter();
    
    // Update counter every 30 seconds
    setInterval(updateCounter, 30000);
}

// ======================================
//  IMAGE LIGHTBOX
// ======================================

function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    
    const lightboxImg = lightbox.querySelector('img');
    const lightboxCaption = lightbox.querySelector('.lightbox-caption');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');
    
    let currentImages = [];
    let currentIndex = 0;
    
    // Make portfolio images clickable
    document.querySelectorAll('.portfolio-slide img, .team-member img').forEach((img, index, array) => {
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => {
            currentImages = Array.from(array);
            currentIndex = index;
            openLightbox(img.src, img.alt);
        });
    });
    
    function openLightbox(src, caption) {
        lightboxImg.src = src;
        lightboxCaption.textContent = caption;
        lightbox.classList.add('active');
        lockScroll();
    }
    
    function closeLightbox() {
        lightbox.classList.remove('active');
        unlockScroll();
    }
    
    closeBtn?.addEventListener('click', closeLightbox);
    
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
    
    // Navigation
    prevBtn?.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
        openLightbox(currentImages[currentIndex].src, currentImages[currentIndex].alt);
    });
    
    nextBtn?.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % currentImages.length;
        openLightbox(currentImages[currentIndex].src, currentImages[currentIndex].alt);
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') prevBtn?.click();
        if (e.key === 'ArrowRight') nextBtn?.click();
    });
}

// ======================================
//  PARTICLES ANIMATION
// ======================================

function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;
    
    const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    
    resize();
    window.addEventListener('resize', resize);
    
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.radius = Math.random() * 2 + 1;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(79, 70, 229, 0.5)';
            ctx.fill();
        }
    }
    
    // Create particles
    for (let i = 0; i < 50; i++) {
        particles.push(new Particle());
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        // Draw connections
        particles.forEach((p1, i) => {
            particles.slice(i + 1).forEach(p2 => {
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(79, 70, 229, ${0.2 * (1 - distance / 100)})`;
                    ctx.lineWidth = 1;
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            });
        });
        
        animationId = requestAnimationFrame(animate);
    }
    
    animate();
    
    // Pause animation when page is not visible
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animationId);
        } else {
            animate();
        }
    });
}

// ======================================
//  VIDEO TESTIMONIAL MODAL
// ======================================

function initVideoTestimonials() {
    const videoCards = document.querySelectorAll('.video-card');
    
    videoCards.forEach(card => {
        card.addEventListener('click', () => {
            const videoUrl = card.dataset.video;
            if (videoUrl) {
                openVideoModal(videoUrl);
            }
        });
    });
}

function openVideoModal(videoUrl) {
    const modal = document.createElement('div');
    modal.className = 'video-modal';
    modal.innerHTML = `
        <div class="video-modal-content">
            <button class="video-modal-close">&times;</button>
            <iframe 
                width="100%" 
                height="100%" 
                src="${videoUrl}?autoplay=1" 
                frameborder="0" 
                allow="autoplay; encrypted-media" 
                allowfullscreen>
            </iframe>
        </div>
    `;
    
    document.body.appendChild(modal);
    lockScroll();
    
    const closeModal = () => {
        modal.remove();
        unlockScroll();
    };
    
    modal.querySelector('.video-modal-close').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

// ======================================
//  TIMELINE SCROLL ANIMATIONS
// ======================================

function initTimelineAnimations() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    
const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.2 });
    
    timelineItems.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(30px)';
        item.style.transition = 'all 0.6s ease';
        observer.observe(item);
    });
}

// ======================================
//  INITIALIZE ALL NEW FEATURES
// ======================================

document.addEventListener('DOMContentLoaded', () => {
    initSearchModal();
    initVisitorCounter();
    initLightbox();
    initParticles();
    initVideoTestimonials();
    initTimelineAnimations();
    initParallaxScrolling();
    initTouchGestures();
});

// ======================================
//  PARALLAX SCROLLING
// ======================================

function initParallaxScrolling() {
    const hero = document.querySelector('.hero');
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    
    if (!hero && parallaxElements.length === 0) return;
    
    let ticking = false;
    
    function updateParallax() {
        const scrolled = window.pageYOffset;
        
        // Hero parallax
        if (hero) {
            hero.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
        
        // Custom parallax elements
        parallaxElements.forEach(element => {
            const speed = element.dataset.parallax || 0.5;
            const rect = element.getBoundingClientRect();
            
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                const offset = (window.innerHeight - rect.top) * speed;
                element.style.transform = `translateY(${offset}px)`;
            }
        });
        
        ticking = false;
    }
    
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', requestTick, { passive: true });
}

// ======================================
//  TOUCH GESTURES
// ======================================

function initTouchGestures() {
    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartY = 0;
    let touchEndY = 0;
    
    const carousels = document.querySelectorAll('.testimonials-carousel');
    
    carousels.forEach(carousel => {
        carousel.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });
        
        carousel.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            handleGesture(carousel);
        }, { passive: true });
    });
    
    function handleGesture(carousel) {
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        // Only handle horizontal swipes
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (Math.abs(deltaX) > 50) {
                if (deltaX > 0) {
                    // Swipe right
                    const prevBtn = carousel.closest('section').querySelector('.carousel-btn:first-child');
                    prevBtn?.click();
                } else {
                    // Swipe left
                    const nextBtn = carousel.closest('section').querySelector('.carousel-btn:last-child');
                    nextBtn?.click();
                }
                
                // Haptic feedback
                if ('vibrate' in navigator) {
                    navigator.vibrate(10);
                }
            }
        }
    }
}

// ======================================
//  VIBRATION FEEDBACK
// ======================================

function addVibrationFeedback() {
    const buttons = document.querySelectorAll('.btn, button');
    
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            if ('vibrate' in navigator) {
                navigator.vibrate(10);
            }
        }, { passive: true });
    });
}

// Call vibration feedback
addVibrationFeedback();

// ======================================
//  LAZY LOADING IMAGES
// ======================================

function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px'
    });
    
    images.forEach(img => imageObserver.observe(img));
    
    // Fallback for browsers without IntersectionObserver
    if (!('IntersectionObserver' in window)) {
        images.forEach(img => {
            img.src = img.dataset.src;
        });
    }
}

// ======================================
//  SOCIAL SHARING
// ======================================

function initSocialSharing() {
    const shareToggle = document.querySelector('.share-toggle');
    const shareOptions = document.querySelector('.share-options');
    const shareButtons = document.querySelectorAll('[data-share]');
    
    // Toggle share options on mobile tap
    if (shareToggle && window.innerWidth <= 768) {
        shareToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            shareOptions.classList.toggle('active');
            
            // Add active class styling
            if (!document.querySelector('.share-options-active-style')) {
                const style = document.createElement('style');
                style.className = 'share-options-active-style';
                style.textContent = `
                    .share-options.active {
                        opacity: 1 !important;
                        transform: translateY(0) !important;
                        pointer-events: all !important;
                    }
                `;
                document.head.appendChild(style);
            }
        });
        
        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.social-share-floating')) {
                shareOptions?.classList.remove('active');
            }
        });
    }
    
    shareButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const platform = button.dataset.share;
            const url = encodeURIComponent(window.location.href);
            const title = encodeURIComponent(document.title);
            
            let shareUrl;
            
            switch(platform) {
                case 'facebook':
                    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                    break;
                case 'twitter':
                    shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
                    break;
                case 'linkedin':
                    shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
                    break;
                case 'whatsapp':
                    shareUrl = `https://wa.me/?text=${title}%20${url}`;
                    break;
                default:
                    return;
            }
            
            window.open(shareUrl, '_blank', 'width=600,height=400');
            
            // Track share event
            if (typeof gtag !== 'undefined') {
                gtag('event', 'share', {
                    event_category: 'Social',
                    event_label: platform,
                    value: 1
                });
            }
        });
    });
    
    // Native Web Share API for mobile
    if (navigator.share) {
        const nativeShareBtn = document.querySelector('[data-native-share]');
        if (nativeShareBtn) {
            nativeShareBtn.addEventListener('click', async () => {
                try {
                    await navigator.share({
                        title: document.title,
                        url: window.location.href
                    });
                } catch (err) {
                    console.log('Error sharing:', err);
                }
            });
        }
    }
}

// ======================================
//  BREADCRUMB NAVIGATION
// ======================================

function initBreadcrumbs() {
    const breadcrumbContainer = document.querySelector('.breadcrumbs');
    if (!breadcrumbContainer) return;
    
    const path = window.location.pathname;
    const segments = path.split('/').filter(segment => segment);
    
    let breadcrumbHTML = '<a href="/">Home</a>';
    let currentPath = '';
    
    segments.forEach((segment, index) => {
        currentPath += `/${segment}`;
        const isLast = index === segments.length - 1;
        const label = segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        if (isLast) {
            breadcrumbHTML += ` / <span>${label}</span>`;
        } else {
            breadcrumbHTML += ` / <a href="${currentPath}">${label}</a>`;
        }
    });
    
    breadcrumbContainer.innerHTML = breadcrumbHTML;
}

// ======================================
//  PERFORMANCE OPTIMIZATIONS
// ======================================

// Resource hints
function addResourceHints() {
    const head = document.head;
    
    // DNS prefetch for external resources
    const dnsPrefetch = [
        'https://fonts.googleapis.com',
        'https://assets9.lottiefiles.com',
        'https://www.googletagmanager.com'
    ];
    
    dnsPrefetch.forEach(domain => {
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = domain;
        head.appendChild(link);
    });
    
    // Preconnect for critical resources
    const preconnect = [
        'https://fonts.gstatic.com'
    ];
    
    preconnect.forEach(domain => {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = domain;
        link.crossOrigin = 'anonymous';
        head.appendChild(link);
    });
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initLazyLoading();
        initSocialSharing();
        initBreadcrumbs();
        addResourceHints();
    });
} else {
    initLazyLoading();
    initSocialSharing();
    initBreadcrumbs();
    addResourceHints();
}

// ======================================
//  SERVICE WORKER REGISTRATION
// ======================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registered:', registration.scope);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}

// =====================================
// PERFORMANCE MONITORING & ERROR HANDLING
// =====================================

// Handle errors gracefully
window.addEventListener('error', function(e) {
    console.error('Error caught:', e.error);
    return true; // Prevents default error handling
});

// Performance optimization: Passive event listeners
const passiveSupport = (() => {
    let passive = false;
    try {
        const options = {
            get passive() {
                passive = true;
                return false;
            }
        };
        window.addEventListener('test', null, options);
        window.removeEventListener('test', null, options);
    } catch (err) {
        passive = false;
    }
    return passive;
})();

// Add scroll class for performance
let scrollTimer;
window.addEventListener('scroll', function() {
    document.body.classList.add('scrolling');
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(function() {
        document.body.classList.remove('scrolling');
    }, 100);
}, passiveSupport ? { passive: true } : false);

// Detect network status
window.addEventListener('online', function() {
    console.log('Connection restored');
});

window.addEventListener('offline', function() {
    console.warn('Connection lost');
});

// Clean up on page unload
window.addEventListener('beforeunload', function() {
    // Force unlock scroll in case of any stuck state
    scrollLockCount = 0;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.classList.remove('modal-open');
    document.body.classList.remove('menu-open');
});

// Log when site is ready
console.log('%c✓ UniAxis Technologies', 'color: #4f46e5; font-size: 20px; font-weight: bold;');
console.log('%cWebsite loaded successfully', 'color: #10b981; font-size: 14px;');
console.log('%cAll optimizations active', 'color: #6b7280; font-size: 12px;');


// =====================================
// SCROLL FIX - Emergency Unlock
// =====================================

// Emergency scroll unlock if page gets stuck
setInterval(function() {
    // Check if scroll is locked but no modals are open
    if (document.body.classList.contains('modal-open')) {
        const hasActiveModal = document.querySelector('.video-modal.active, .search-modal.active, .lightbox.active, .nav-menu.active');
        if (!hasActiveModal) {
            // Force unlock
            scrollLockCount = 0;
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            document.body.classList.remove('modal-open');
            console.log('Emergency scroll unlock triggered');
        }
    }
}, 1000);

// Double-click anywhere to force unlock (dev mode)
let clickCount = 0;
let clickTimer = null;
document.addEventListener('click', function() {
    clickCount++;
    if (clickCount === 5) {
        scrollLockCount = 0;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.classList.remove('modal-open');
        document.body.classList.remove('menu-open');
        console.log('Manual scroll unlock (5 clicks)');  
        clickCount = 0;
    }
    
    clearTimeout(clickTimer);
    clickTimer = setTimeout(function() {
        clickCount = 0;
    }, 2000);
});

// =====================================
// MISSING BUTTON/EVENT HANDLER FUNCTIONS
// =====================================

// Search modal functions
function openSearch() {
    const searchModal = document.getElementById('searchModal');
    if (searchModal) {
        searchModal.classList.add('active');
        lockScroll();
        document.getElementById('searchInput')?.focus();
    }
}

function closeSearch() {
    const searchModal = document.getElementById('searchModal');
    if (searchModal) {
        searchModal.classList.remove('active');
        unlockScroll();
    }
}

// Video player functions
let currentVideoUrl = '';

function playVideo(url) {
    currentVideoUrl = url;
    const videoModal = document.querySelector('.video-modal');
    if (!videoModal) {
        const modal = document.createElement('div');
        modal.className = 'video-modal active';
        modal.innerHTML = `
            <div class="video-container">
                <button class="modal-close" onclick="closeVideo()">✕</button>
                <iframe 
                    src="${url}?autoplay=1" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                </iframe>
            </div>
        `;
        document.body.appendChild(modal);
        lockScroll();
    }
}

function closeVideo() {
    const videoModal = document.querySelector('.video-modal.active');
    if (videoModal) {
        videoModal.remove();
        unlockScroll();
    }
}

// Lightbox functions
let lightboxImages = [];
let currentImageIndex = 0;

function openLightbox(imageUrl, imageIndex = 0) {
    currentImageIndex = imageIndex;
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        const lightboxImg = lightbox.querySelector('.lightbox-img');
        if (lightboxImg) {
            lightboxImg.src = imageUrl;
            lightbox.classList.add('active');
            lockScroll();
        }
    }
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.classList.remove('active');
        unlockScroll();
    }
}

function nextImage() {
    if (lightboxImages.length > 0) {
        currentImageIndex = (currentImageIndex + 1) % lightboxImages.length;
        openLightbox(lightboxImages[currentImageIndex], currentImageIndex);
    }
}

function prevImage() {
    if (lightboxImages.length > 0) {
        currentImageIndex = (currentImageIndex - 1 + lightboxImages.length) % lightboxImages.length;
        openLightbox(lightboxImages[currentImageIndex], currentImageIndex);
    }
}

