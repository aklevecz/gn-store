# Enhanced Technical Design Specification: Good Neighbor Music Website Theme for Hydrogen

Based on the complete HTML structure and design patterns, here's a comprehensive technical specification for implementing this vibrant music industry aesthetic in Hydrogen:

## Project Overview
This specification creates a Hydrogen-based e-commerce site that captures Good Neighbor's bold, eco-friendly music industry aesthetic. The design emphasizes sustainability messaging, interactive elements, large typography, and a playful color system that rotates through vibrant vinyl record-inspired colors.

## Complete Color System

### CSS Custom Properties
```css
:root {
  --white-label: #f4f4f4;     /* Primary background */
  --black-wax: #141412;       /* Primary text/borders */
  --light-purple: #e6dfff;    /* Card backgrounds */
  --aqua-blue: #59a0c4;       /* Navigation/accent */
  --neon-plum: #9e80ff;       /* Navigation/accent */
  --sage-green: #99caa9;      /* Success states/accent */
  --yellow-sunburst: #fed141; /* Primary CTA color */
  --orange: #fe6844;          /* Secondary CTA color */
  --off-white: #fffbef;       /* Alternative background */
  --white: #ffffff;           /* Pure white */
  --black-wax-grey: #1414121a; /* Transparent overlay */
}
```

### Vinyl Record Colors (Product Showcase)
```css
/* Additional colors for product variants */
:root {
  --cosmic-black: #1a1a1a;
  --purple-haze: #8b5fbf;
  --ocean-floor: #2c5f6f;
  --sky-blue: #87ceeb;
  --salsa-verde: #4a7c59;
  --limoncello: #fff700;
  --habanero: #ff6b35;
  --red-alert: #ff4444;
  --hibiscus: #ff69b4;
  --lightning: #ffff00;
  --glassy-ice: rgba(255, 255, 255, 0.8);
}
```

## Typography System

### Font Loading Strategy
```css
@font-face {
  font-family: 'ITC Avant Garde Pro';
  src: url('/fonts/ITCAVANTGARDEPRO-BOLD.OTF') format('opentype');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Doyle';
  src: url('/fonts/Doyle-Regular.otf') format('opentype');
  font-weight: 400;
  font-style: normal;
  font-display: block;
}

@font-face {
  font-family: 'Doyle';
  src: url('/fonts/Doyle-Bold.otf') format('opentype');
  font-weight: 700;
  font-style: normal;
  font-display: block;
}
```

### Typography Scale with Responsive Scaling
```css
/* Base font size: 10px for easy rem calculations */
html { font-size: 10px; }

/* Hero/Display Typography */
.hero-title {
  font-size: 6rem;
  font-weight: 700;
  line-height: 100%;
  text-transform: uppercase;
  text-align: center;
  font-family: 'Doyle', sans-serif;
}

/* Tagline with Image Fill Effect */
.tagline {
  font-size: 8rem;
  font-family: 'ITC Avant Garde Pro', sans-serif;
  font-weight: 700;
  background-image: url('/images/texture-bg.jpg');
  background-position: 50%;
  background-size: cover;
  background-attachment: fixed;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

/* Section Headings */
.section-heading {
  font-size: 4.4rem;
  line-height: 130%;
  font-family: 'Doyle', sans-serif;
  font-weight: 700;
  margin-bottom: 1.6rem;
}

/* Card Headings */
.card-heading {
  font-size: 3.8rem;
  font-family: 'ITC Avant Garde Pro', sans-serif;
  font-weight: 700;
}

/* Body Text */
.body-text {
  font-size: 2.4rem;
  line-height: 130%;
  font-family: 'Doyle', sans-serif;
  color: var(--black-wax);
}

/* Product Names */
.product-name {
  font-size: clamp(1.6rem, 2.5vw, 3.2rem);
  font-family: 'ITC Avant Garde Pro', sans-serif;
  font-weight: 700;
  line-height: 117%;
}

/* Mobile Typography Adjustments */
@media (max-width: 767px) {
  .hero-title { font-size: 3.2rem; }
  .tagline { font-size: 3.6rem; }
  .section-heading { font-size: 2.4rem; }
  .body-text { font-size: 1.6rem; }
  .card-heading { font-size: 2.8rem; }
}
```

## Advanced Button System

### Base Button with Hover Animations
```css
.button {
  background-color: var(--black-wax);
  color: var(--white);
  border-radius: 4.8rem;
  padding: 1.6rem 3.4rem;
  font-family: 'ITC Avant Garde Pro', sans-serif;
  font-size: 1.6rem;
  line-height: 100%;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  box-shadow: 0 0 transparent;
}

.button:hover {
  transform: scale(1.25);
  box-shadow: 0 0 0 0 rgba(0,0,0,0.1);
}

/* Button text positioning fix */
.button span {
  display: inline-block;
  transform: translateY(0.15rem);
}
```

### Color Variant System
```css
.button--blue { background-color: var(--aqua-blue); }
.button--purple { background-color: var(--neon-plum); }
.button--green { background-color: var(--sage-green); }
.button--pink { background-color: #ff8082; }
.button--bright-pink { background-color: #ff80bf; }
.button--orange { background-color: var(--orange); }

.button--yellow { 
  background-color: var(--yellow-sunburst);
  color: var(--black-wax);
}
```

### Large CTA Buttons
```css
.button--large {
  width: 100%;
  padding: 2.8rem;
  font-size: 3.2rem;
  margin-top: 3.2rem;
}

.button--large:hover {
  transform: scale(1.05);
}

/* Mobile adjustments */
@media (max-width: 767px) {
  .button--large {
    padding: 2.4rem;
    font-size: 2.8rem;
    margin-top: 2rem;
  }
}
```

## Card Component System

### Primary Contact Card
```css
.contact-card {
  background-color: var(--light-purple);
  border-radius: 4rem;
  padding: 2rem;
  box-shadow: 
    0px 178px 50px 0px rgba(0, 0, 0, 0.00),
    0px 114px 46px 0px rgba(0, 0, 0, 0.03),
    0px 64px 38px 0px rgba(0, 0, 0, 0.10),
    0px 28px 28px 0px rgba(0, 0, 0, 0.17),
    0px 7px 16px 0px rgba(0, 0, 0, 0.20);
}

.contact-card__inner {
  border: 6px solid var(--black-wax);
  border-radius: 2rem;
  padding: 2rem;
  display: flex;
  flex-wrap: wrap-reverse;
  justify-content: center;
  align-items: center;
  gap: 2rem;
}

.contact-card__copy {
  color: var(--black-wax);
  font-family: 'ITC Avant Garde Pro', sans-serif;
  font-size: 3.2rem;
  line-height: 110%;
  text-align: center;
  flex: 2 1 0;
  margin-bottom: 20px;
}

/* Responsive card adjustments */
@media (max-width: 991px) {
  .contact-card__copy { font-size: 2.4rem; }
}

@media (max-width: 767px) {
  .contact-card { padding: 1.2rem; }
  .contact-card__inner { padding: 2rem; }
  .contact-card__copy { flex-grow: 1; }
}
```

## Modal System

### Base Modal Structure
```css
.modal-container {
  z-index: 110;
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
}

.modal-container.hidden {
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s ease;
  transform: translate(0, 50%);
}

.modal {
  background-color: var(--yellow-sunburst);
  border-radius: 3.6rem;
  padding: 8rem;
  position: relative;
  max-width: 800px;
  width: 100%;
  box-shadow: 
    0px 128px 36px 0px rgba(0, 0, 0, 0.00),
    0px 82px 33px 0px rgba(0, 0, 0, 0.01),
    0px 46px 28px 0px rgba(0, 0, 0, 0.05),
    0px 20px 20px 0px rgba(0, 0, 0, 0.09),
    0px 5px 11px 0px rgba(0, 0, 0, 0.10);
}

.modal--orange {
  background-color: var(--orange);
}

/* Mobile modal adjustments */
@media (max-width: 767px) {
  .modal-container {
    justify-content: center;
    align-items: flex-end;
  }
  
  .modal {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    padding: 5rem 4rem 4rem;
  }
}
```

## Product Gallery System

### Vinyl Grid Layout
```css
.vinyl-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4rem;
  justify-content: center;
  align-items: flex-start;
  padding-bottom: 6rem;
}

.product-wrapper {
  flex: 0 30%;
  position: relative;
  transition: all 0.3s ease;
}

.product-image {
  transition: all 0.2s ease;
  filter: drop-shadow(0 0 0 transparent);
  will-change: filter;
  position: relative;
  z-index: 0;
}

.product-wrapper:hover .product-image {
  z-index: 1;
  transform: scale(1.2);
  transition: all 0.3s ease;
  filter: 
    drop-shadow(0px 37px 15px rgba(0, 0, 0, 0.1))
    drop-shadow(0px 21px 13px rgba(0, 0, 0, 0.2));
}

.product-name {
  z-index: 2;
  color: var(--black-wax);
  width: 100%;
  max-width: 90%;
  margin: 10px auto 20px;
  font-family: 'ITC Avant Garde Pro', sans-serif;
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

.product-wrapper:hover .product-name {
  opacity: 1;
}

/* Responsive grid adjustments */
@media (max-width: 991px) {
  .vinyl-grid { gap: 2rem; }
  .product-wrapper { flex: 0 calc(33.333% - 1.5rem); }
}

@media (max-width: 767px) {
  .product-wrapper { flex: 0 calc(50% - 1rem); }
}
```

## FAQ Accordion System

### Interactive FAQ Structure
```css
.faq-item {
  border-top: 8px solid var(--black-wax);
  border-left: 8px solid var(--black-wax);
  border-right: 8px solid var(--black-wax);
}

.faq-question {
  padding: 3rem 4rem 3rem 18rem;
  position: relative;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.faq-question.open {
  background-color: var(--sage-green);
}

.faq-question::before {
  content: 'Q:';
  position: absolute;
  left: 0;
  top: 0;
  transform: translate(-100%, 0);
  padding-right: 4rem;
  font-weight: 700;
}

.faq-answer {
  padding-left: 18rem;
  padding-right: 6rem;
  transition: height 0.3s ease;
  position: relative;
  overflow: hidden;
}

.faq-answer.collapsed {
  height: 0;
}

.faq-answer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 8px;
  width: 100%;
  background-color: var(--black-wax);
}

.faq-answer-copy::before {
  content: 'A:';
  position: absolute;
  left: 0;
  top: 0;
  transform: translate(-100%, 0);
  padding-right: 4rem;
  font-weight: 700;
  line-height: 130%;
}

/* Mobile FAQ adjustments */
@media (max-width: 767px) {
  .faq-item {
    border-top-width: 3px;
    border-left: 3px solid var(--black-wax);
    border-right: 3px solid var(--black-wax);
  }
  
  .faq-question {
    padding: 2.4rem 2.4rem 2.4rem 5.6rem;
  }
  
  .faq-answer {
    padding-left: 5.6rem;
    padding-right: 4rem;
  }
  
  .faq-question::before,
  .faq-answer-copy::before {
    padding-right: 1.6rem;
  }
  
  .faq-answer::before {
    height: 3px;
  }
}
```

## Form System

### Input Styling
```css
.input {
  border: none;
  border-bottom: 2px solid var(--black-wax);
  background-color: transparent;
  border-radius: 0;
  margin-bottom: 3rem;
  font-size: 2.4rem;
  line-height: 150%;
  padding: 1rem 0;
  color: var(--black-wax);
}

.input::placeholder {
  color: rgba(20, 20, 18, 0.5);
}

.input:focus {
  border-color: var(--black-wax);
  outline: none;
}

.textarea {
  border: 2px solid var(--black-wax);
  background-color: transparent;
  border-radius: 0.8rem;
  min-height: 14rem;
  font-size: 2rem;
  line-height: 150%;
  padding: 1rem;
  resize: vertical;
}

/* Mobile form adjustments */
@media (max-width: 767px) {
  .input {
    font-size: 2rem;
    margin-bottom: 2rem;
  }
  
  .textarea {
    min-height: 12rem;
    font-size: 1.6rem;
  }
}
```

## Navigation System

### Fixed Navigation with Scroll Behavior
```css
.nav-buttons {
  z-index: 5;
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  align-items: center;
  max-width: calc(100% - 51vw);
  position: fixed;
  top: 15rem;
  right: 14vw;
  transform: translate(0, -50%);
  transition: all 0.3s ease;
}

.nav-buttons.scrolled {
  top: 6rem;
  transform: translate(0);
}

/* Mobile navigation */
@media (max-width: 991px) {
  .nav-buttons {
    z-index: 2;
    width: auto;
    max-width: 120px;
    height: 4.8rem;
    top: 10rem;
    right: 3rem;
    transform: translate(0);
  }
  
  .nav-buttons.scrolled {
    top: 4rem;
  }
}
```

## Background Effects

### Parallax Background System
```css
.hero-background {
  background-image: url('/images/hero-bg.jpg');
  background-position: 50%;
  background-repeat: no-repeat;
  background-size: cover;
  background-attachment: fixed;
  padding: 6rem;
}

.text-with-image-fill {
  background-image: url('/images/texture-bg.jpg');
  background-position: 50% 100%;
  background-size: cover;
  background-attachment: fixed;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Mobile background adjustments */
@media (max-width: 767px) {
  .hero-background {
    background-position: 50% 0;
    background-size: contain;
    background-attachment: scroll; /* Fixed attachment can cause issues on mobile */
    padding: 4rem 3rem;
  }
}
```

## Interactive Features

### Image Rotation Animation
```javascript
// Vinyl record rotation animation
const rotateImages = () => {
  const images = document.querySelectorAll('.rotating-vinyl');
  let currentIndex = 0;
  
  setInterval(() => {
    // Hide current image
    if (currentIndex > 0) {
      images[currentIndex - 1].style.opacity = 0;
    }
    
    // Show next image
    images[currentIndex].style.opacity = 1;
    
    // Reset index if at end
    currentIndex = (currentIndex + 1) % images.length;
  }, 3000);
};
```

### FAQ Accordion Functionality
```javascript
// Dynamic height calculation for FAQ accordion
const setupFAQAccordion = () => {
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    
    // Calculate and store natural height
    answer.style.height = 'auto';
    const naturalHeight = answer.scrollHeight;
    answer.setAttribute('data-height', naturalHeight);
    answer.style.height = '0';
    answer.classList.add('collapsed');
    
    question.addEventListener('click', () => {
      const isOpen = answer.classList.contains('collapsed');
      
      // Close all other FAQs
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          const otherAnswer = otherItem.querySelector('.faq-answer');
          const otherQuestion = otherItem.querySelector('.faq-question');
          otherAnswer.style.height = '0';
          otherAnswer.classList.add('collapsed');
          otherQuestion.classList.remove('open');
        }
      });
      
      // Toggle current FAQ
      if (isOpen) {
        answer.style.height = naturalHeight + 'px';
        answer.classList.remove('collapsed');
        question.classList.add('open');
      } else {
        answer.style.height = '0';
        answer.classList.add('collapsed');
        question.classList.remove('open');
      }
    });
  });
};
```

## Layout Containers

### Responsive Container System
```css
.central-container {
  background-image: url('/images/main-bg.jpg');
  background-position: 50%;
  background-repeat: no-repeat;
  background-size: cover;
  background-attachment: fixed;
  padding: 0 6rem;
}

.central-wrapper {
  background-color: var(--white-label);
  max-width: 1024px;
  margin: 0 auto;
  padding: 0 4rem;
}

.central-wrapper--wide {
  max-width: 2400px;
  padding: 0;
}

/* Mobile container adjustments */
@media (max-width: 767px) {
  .central-container {
    padding: 0;
  }
  
  .central-wrapper {
    border-top-left-radius: 6rem;
    border-top-right-radius: 6rem;
    margin: 0;
    padding: 0 3rem;
  }
  
  .central-wrapper--wide {
    padding: 0;
  }
}
```

## Implementation Strategy for Hydrogen

### Component Architecture
1. **Hero Section**: Large typography with rotating vinyl images
2. **Product Grid**: Hover-interactive vinyl color showcase
3. **Contact Cards**: Multi-use card system for CTAs
4. **FAQ Accordion**: Dynamic height management
5. **Modal System**: Form overlays with custom styling
6. **Navigation**: Fixed position with scroll behavior

### Key JavaScript Integrations
- Image rotation animations
- FAQ accordion functionality  
- Modal open/close management
- Scroll-based navigation positioning
- Form validation and submission
- Mobile menu toggle behavior

### Performance Considerations
- Lazy load vinyl record images
- Use `transform` for hover animations (GPU acceleration)
- Implement `will-change` for elements that animate
- Use `font-display: swap` for custom fonts
- Optimize background images for different screen sizes

This comprehensive design system captures the bold, sustainable, and interactive essence of Good Neighbor's brand while providing a solid foundation for Hydrogen e-commerce functionality.