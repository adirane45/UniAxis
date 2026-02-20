// UniAxis Technologies - Optimized JavaScript
// ============= CORE UTILITIES =============

let scrollLockCount = 0;
function lockScroll(){scrollLockCount++;if(scrollLockCount===1){const e=window.scrollY;document.body.style.position="fixed";document.body.style.top=`-${e}px`;document.body.style.width="100%";document.body.classList.add("modal-open")}}
function unlockScroll(){scrollLockCount=Math.max(0,scrollLockCount-1);if(0===scrollLockCount){const e=document.body.style.top;document.body.style.position="";document.body.style.top="";document.body.style.width="";document.body.classList.remove("modal-open");window.scrollTo(0,parseInt(e||"0")*-1)}}
function debounce(e,t){let n;return function(...r){clearTimeout(n);n=setTimeout(()=>e.apply(this,r),t)}}
function throttle(e,t){let n;return function(...r){n||(e.apply(this,r),n=!0,setTimeout(()=>n=!1,t))}}

// ============= INITIALIZATION =============

document.addEventListener("DOMContentLoaded",function(){initThemeToggle();initMobileMenu();initScrollToTop();initFormHandling();initScrollAnimations();initTestimonialsCarousel();initCardHover();setupScrollEvents()});window.addEventListener("pageshow",function(){scrollLockCount=0;document.body.style.position="";document.body.style.top="";document.body.style.width="";document.body.classList.remove("modal-open","menu-open")});window.addEventListener("load",function(){document.body.classList.remove("preload")});

// ============= THEME TOGGLE =============

function initThemeToggle(){const e=document.getElementById("themeToggle");if(!e)return;const t=window.matchMedia("(prefers-color-scheme: dark)").matches,n=localStorage.getItem("theme");let r=n?"dark"===n:t;r&&document.body.classList.add("dark-mode");e.addEventListener("click",function(){r=!r;r?(document.body.classList.add("dark-mode"),localStorage.setItem("theme","dark")):(document.body.classList.remove("dark-mode"),localStorage.setItem("theme","light"))})}

// ============= MOBILE MENU =============

function initMobileMenu(){const e=document.getElementById("hamburger"),t=document.getElementById("navMenu");e&&t&&(e.addEventListener("click",function(){const n=e.classList.toggle("active");t.classList.toggle("active");n?(document.body.classList.add("menu-open"),lockScroll()):(document.body.classList.remove("menu-open"),unlockScroll())}),document.querySelectorAll(".nav-link").forEach(n=>{n.addEventListener("click",function(){e.classList.contains("active")&&(e.classList.remove("active"),t.classList.remove("active"),document.body.classList.remove("menu-open"),unlockScroll())})}),document.addEventListener("keydown",function(n){"Escape"===n.key&&e.classList.contains("active")&&(e.classList.remove("active"),t.classList.remove("active"),document.body.classList.remove("menu-open"),unlockScroll())}))}

// ============= SCROLL TO TOP =============

function initScrollToTop(){const e=document.getElementById("scrollToTop");e&&(window.addEventListener("scroll",throttle(function(){window.pageYOffset>300?e.classList.add("show"):e.classList.remove("show")},300),{passive:!0}),e.addEventListener("click",function(){window.scrollTo({top:0,behavior:"smooth"})}))}

// ============= FORM HANDLING =============

function initFormHandling(){const e=document.getElementById("contactForm");e&&e.addEventListener("submit",handleFormSubmit)}
function handleFormSubmit(e){e.preventDefault();const t=e.target,n=Object.fromEntries(new FormData(t));if(!n.name||!n.email||!n.subject||!n.message){showMessage("Please fill all fields","error");return}if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(n.email)){showMessage("Invalid email","error");return}if(n.message.trim().length<10){showMessage("Message too short","error");return}submitForm(t,n)}
function submitForm(e,t){const n=e.querySelector('[type="submit"]'),r=n.innerHTML;n.disabled=!0;n.innerHTML='<span style="display:inline-block;animation:spin 1s linear infinite">⟳</span> Sending...';fetch("/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)}).then(e=>e.json()).then(t=>{t.success?(showMessage("✓ Message sent!","success"),e.reset()):showMessage(t.message,"error")}).catch(t=>{const a=`mailto:info@uniaxis.tech?subject=${encodeURIComponent(t.subject)}`;window.location.href=a}).finally(()=>{n.disabled=!1;n.innerHTML=r})}
function showMessage(e,t){const n=document.getElementById("formMessage");n&&(n.textContent=e,n.className=`form-message ${t}`,n.style.display="block","success"===t&&setTimeout(()=>{n.style.display="none"},4e3))}

// ============= SCROLL ANIMATIONS =============

function initScrollAnimations(){const e={threshold:.1,rootMargin:"0px 0px -100px 0px"},t=new IntersectionObserver(function(e){e.forEach(e=>{if(e.isIntersecting){e.target.style.opacity="1";e.target.style.transform="translateY(0)";t.unobserve(e.target)}})},e);document.querySelectorAll(".service-card, .product-card, .internship-card, .stat-card, .team-card").forEach(n=>{n.style.opacity="0";n.style.transform="translateY(20px)";n.style.transition="opacity 0.6s ease, transform 0.6s ease";t.observe(n)})}

// ============= COUNTER ANIMATION =============

function animateCounters(){const e=document.querySelectorAll("[data-target]");e.forEach(e=>{if(!e.classList.contains("counted")){const t=parseInt(e.getAttribute("data-target")),n=2e3,r=t/(n/16);let a=0;const o=setInterval(()=>{a+=r;a>=t?(e.textContent=t,clearInterval(o),e.classList.add("counted")):e.textContent=Math.floor(a)},16)}})}

// ============= SCROLL EVENT HANDLERS =============

let scrollTicking=!1;function setupScrollEvents(){const e=document.querySelectorAll("section"),t=document.querySelectorAll(".nav-link");window.addEventListener("scroll",throttle(function(){let n="";e.forEach(e=>{window.scrollY>=e.offsetTop-200&&(n=e.getAttribute("id"))});t.forEach(e=>{e.classList.remove("active");`#${n}`===e.getAttribute("href")&&e.classList.add("active")})},200),{passive:!0});const n=document.querySelector(".hero");n&&window.addEventListener("scroll",throttle(function(){const e=window.scrollY;e<n.offsetHeight&&(n.style.backgroundPosition=`center ${.5*e}px`)},150),{passive:!0});document.querySelectorAll("[data-target]").length>0&&window.addEventListener("scroll",throttle(function(){document.querySelectorAll("[data-target]:not(.counted)").length>0&&animateCounters()},500),{passive:!0})}

// ============= SMOOTH SCROLL LINKS =============

document.querySelectorAll('a[href^="#"]').forEach(e=>{e.addEventListener("click",function(e){const t=this.getAttribute("href");if("#"!==t&&document.querySelector(t)){e.preventDefault();document.querySelector(t).scrollIntoView({behavior:"smooth",block:"start"})}},'

// ============= CARD HOVER EFFECTS =============

function initCardHover(){const e=document.querySelectorAll(".service-card, .team-card, .product-showcase");e.forEach(e=>{e.addEventListener("mouseenter",function(){this.style.transform="translateY(-8px)";this.style.boxShadow="0 20px 40px rgba(0,0,0,0.15)"}),e.addEventListener("mouseleave",function(){this.style.transform="translateY(0)";this.style.boxShadow=""})})}

// ============= TESTIMONIALS CAROUSEL =============

function initTestimonialsCarousel(){const e=document.querySelectorAll(".testimonial-card"),t=document.getElementById("testimonialDots");if(!e.length)return;let n=0;e.forEach((n,r)=>{const a=document.createElement("div");a.className=`carousel-dot ${0===r?"active":""}`;a.addEventListener("click",()=>showTestimonial(r));t?.appendChild(a)});const r=()=>{e.forEach(e=>e.classList.remove("active"));document.querySelectorAll(".carousel-dot").forEach(e=>e.classList.remove("active"));e[n].classList.add("active");document.querySelectorAll(".carousel-dot")[n].classList.add("active")};document.getElementById("prevTestimonial")?.addEventListener("click",()=>{n=(n-1+e.length)%e.length;r()});document.getElementById("nextTestimonial")?.addEventListener("click",()=>{n=(n+1)%e.length;r()});setInterval(()=>{n=(n+1)%e.length;r()},8e3);window.showTestimonial=r}

// ============= VISITOR COUNTER =============

function initVisitorCounter(){const e=document.querySelector(".visitor-count");if(e){const t=()=>{const e=localStorage.getItem("visitorCount");if(e){const t=JSON.parse(e);if(Date.now()-t.timestamp<3e4)return t.count}const n=Math.floor(15*Math.random())+15;return localStorage.setItem("visitorCount",JSON.stringify({count:n,timestamp:Date.now()})),n};e.textContent=t();setInterval(()=>e.textContent=t(),3e4)}}

// ============= SEARCH FUNCTIONALITY =============

function openSearch(){const e=document.getElementById("searchModal");e&&(e.classList.add("active"),lockScroll(),document.getElementById("searchInput")?.focus())}
function closeSearch(){const e=document.getElementById("searchModal");e&&(e.classList.remove("active"),unlockScroll())}

const searchInput=document.getElementById("searchInput");searchInput&&searchInput.addEventListener("input",function(e){const t=e.target.value.toLowerCase().trim(),n=document.querySelector(".search-results");if(t.length<2){n.innerHTML="";return}const r=[],a=document.querySelectorAll("section");a.forEach(e=>{const a=e.querySelector("h2")?.textContent||"",o=e.textContent.toLowerCase();if(o.includes(t)){const t=o.indexOf(t);let i=o.substring(Math.max(0,t-40),Math.min(o.length,t+t.length+40));r.push({title:a,excerpt:i,element:e})}});n.innerHTML=r.slice(0,8).map(e=>`<div class="search-result-item" style="padding:10px;cursor:pointer;border-bottom:1px solid var(--border-color)"><strong>${e.title}</strong><br><small>${e.excerpt.substring(0,80)}...</small></div>`).join("");document.querySelectorAll(".search-result-item").forEach((e,t)=>{e.addEventListener("click",()=>{r[t].element.scrollIntoView({behavior:"smooth",block:"start"});closeSearch()})})});

document.getElementById("searchModal")?.addEventListener("click",function(e){e.target===this&&closeSearch()});document.addEventListener("keydown",function(e){"Escape"===e.key&&document.getElementById("searchModal")?.classList.remove("active")});

// ============= IMAGE LAZY LOADING =============

if("IntersectionObserver"in window){const e=new IntersectionObserver((e,t)=>{e.forEach(e=>{if(e.isIntersecting){const n=e.target;n.dataset.src&&(n.src=n.dataset.src,n.classList.remove("lazy"));t.unobserve(n)}})});document.querySelectorAll("img[data-src]").forEach(t=>e.observe(t))}

// ============= BEFORE/AFTER SLIDERS =============

document.querySelectorAll(".comparison-slider").forEach(e=>{const t=e.querySelector(".slider-input"),n=e.querySelector(".after-image"),r=e.querySelector(".slider-button");t&&n&&(t.addEventListener("input",e=>{const t=e.target.value;n.style.clipPath=`inset(0 ${100-t}% 0 0)`;r.style.left=`${t}%`}),n.style.clipPath=`inset(0 ${100-t.value}% 0 0)`)});

// ============= INITIALIZATION ON LOAD =============

window.addEventListener("DOMContentLoaded",function(){initVisitorCounter()});document.addEventListener("DOMContentLoaded",function(){const e=document.createElement("style");e.textContent=`
@keyframes spin {from{transform:rotate(0deg);} to{transform:rotate(360deg);}}
@keyframes slideUp {from{opacity:0;transform:translateY(20px);} to{opacity:1;transform:translateY(0);}}  
.scrolling{scroll-behavior:auto!important}
`;document.head.appendChild(e)});

// ============= SERVICE WORKER =============

"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(e=>console.log("SW failed:",e))});

// ============= ERROR HANDLING & CLEANUP =============

window.addEventListener("beforeunload",function(){scrollLockCount=0;document.body.style.position="";document.body.style.top="";document.body.style.width="";document.body.classList.remove("modal-open","menu-open")});

console.log("%c✓ UniAxis loaded","color:#4f46e5;font-weight:bold;font-size:14px");