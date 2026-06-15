// ===== UTILITY HELPERS =====
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_SUN = new Set([0]); // Sunday index

function formatDate(date) {
  const d = date.getDate();
  return `${MONTH_NAMES[date.getMonth()]} ${d}, ${date.getFullYear()}`;
}

function getWeekDayName(date) {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
}

// ===== BOOKING STORAGE (localStorage) =====
const BOOKING_STORAGE_KEY = 'obriens_bookings';

function getBookedSlots() {
  try {
    const data = JSON.parse(localStorage.getItem(BOOKING_STORAGE_KEY) || '[]');
    return new Set(data.map(b => `${b.dateKey} ${b.time}`));
  } catch {
    return new Set();
  }
}

function saveBooking(date, time, name, email, phone, service, notes) {
  const data = JSON.parse(localStorage.getItem(BOOKING_STORAGE_KEY) || '[]');
  date = new Date(date); // normalize
  const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  data.push({
    dateKey,
    time,
    name,
    email,
    phone,
    service,
    notes: notes || '',
    bookedAt: new Date().toISOString()
  });
  localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(data));
}

function isSlotBooked(date, time) {
  const d = new Date(date);
  const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return getBookedSlots().has(`${dateKey} ${time}`);
}

function getAvailableSlotsCount(date) {
  const d = new Date(date);
  const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  let count = 0;
  for (let h = 8; h <= 17; h++) {
    const base = `${dateKey} ${h}:00`;
    if (!getBookedSlots().has(base)) count++;
    const half = `${dateKey} ${h}:30`;
    if (!getBookedSlots().has(half)) count++;
  }
  // Also check 18:00
  const sixPM = `${dateKey} 18:00`;
  if (!getBookedSlots().has(sixPM)) count++;
  return count;
}

function isDayFullyBooked(date) {
  return getAvailableSlotsCount(date) === 0;
}

// ===== CALENDAR STATE =====
let calendarDate = new Date(); // shows current month
let selectedDate = null;
let selectedTime = null;

// ===== GENERATE CALENDAR =====
function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Update title
  document.getElementById('calendarTitle').textContent = `${MONTH_NAMES[month]} ${year}`;

  const daysContainer = document.getElementById('calendarDays');
  daysContainer.innerHTML = '';

  // First day of month (0-6, where 0=Sunday)
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Previous month filler days
  for (let i = 0; i < firstDay; i++) {
    const span = document.createElement('span');
    span.classList.add('calendar-day', 'empty');
    daysContainer.appendChild(span);
  }

  // Actual days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    const isPast = date < today;
    const isSunday = DAYS_SUN.has(dayOfWeek);
    const isToday = date.getTime() === today.getTime();
    const isSelectable = !isPast && !isSunday;

    const span = document.createElement('span');
    span.classList.add('calendar-day');
    span.textContent = day;
    span.dataset.date = date.toISOString();

    if (isToday) {
      span.classList.add('today');
    }

    if (isSelectable) {
      span.classList.add('available');
      const availableCount = getAvailableSlotsCount(date);
      if (isDayFullyBooked(date)) {
        span.classList.add('full-day');
        // Add FULL badge via attribute so CSS can style it
        span.setAttribute('data-status', 'full');
        span.addEventListener('click', () => openBooking(date));
      } else if (availableCount <= 4 && availableCount > 0) {
        span.classList.add('limited');
        span.setAttribute('data-status', 'limited');
        span.textContent = `${day} <span style="font-size:0.55rem;display:block;opacity:0.7">(${availableCount} left)</span>`;
        span.addEventListener('click', () => openBooking(date));
      } else {
        span.addEventListener('click', () => openBooking(date));
      }
    } else if (isPast) {
      span.classList.add('past');
    } else {
      span.classList.add('sunday');
    }

    daysContainer.appendChild(span);
  }
}

// ===== NAV MONTHS =====
document.getElementById('prevMonth').addEventListener('click', () => {
  calendarDate.setMonth(calendarDate.getMonth() - 1);
  renderCalendar();
});

document.getElementById('nextMonth').addEventListener('click', () => {
  calendarDate.setMonth(calendarDate.getMonth() + 1);
  renderCalendar();
});

// ===== OPEN BOOKING MODAL =====
function openBooking(date) {
  selectedDate = date;
  selectedTime = null;

  const overlay = document.getElementById('modalOverlay');
  const modalDateEl = document.getElementById('modalDate');
  const timeStep = document.getElementById('timeStep');
  const infoStep = document.getElementById('infoStep');
  const confirmStep = document.getElementById('confirmStep');

  // Reset to step 1
  timeStep.classList.remove('hidden');
  infoStep.classList.add('hidden');
  confirmStep.classList.add('hidden');

  modalDateEl.textContent = formatDate(date);

  // Check if day is fully booked — show sold-out message
  const slotsContainer = timeStep.querySelector('.time-slots-container');
  if (isDayFullyBooked(date)) {
    slotsContainer.innerHTML = `
      <div class="sold-out-message">
        <span class="sold-out-icon">&#x1f512;</span>
        <h4 class="sold-out-title">SOLD OUT</h4>
        <p class="sold-out-desc">This day is fully booked.<br>Please select another date.</p>
      </div>`;
  } else {
    // Restore container structure for normal days
    slotsContainer.innerHTML = `
      <div class="time-period-group">
        <h4>Morning</h4>
        <div class="time-slots" id="timeSlotsMorning"></div>
      </div>
      <div class="time-period-group">
        <h4>Afternoon</h4>
        <div class="time-slots" id="timeSlotsAfternoon"></div>
      </div>`;
    generateTimeSlots(date.getDay());
  }
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// ===== GENERATE TIME SLOTS (8am-6pm, 30-min intervals) =====
function generateTimeSlots(dayOfWeek) {
  const morningContainer = document.getElementById('timeSlotsMorning');
  const afternoonContainer = document.getElementById('timeSlotsAfternoon');
  morningContainer.innerHTML = '';
  afternoonContainer.innerHTML = '';

  // Generate slots: 8:00 AM through 6:00 PM in 30-min increments (19 total)
  for (let h = 8; h <= 17; h++) {
    generateSlot(h, 0);
    generateSlot(h, 30);
  }
  generateSlot(18, 0);

  function generateSlot(hour, minute) {
    const value = `${hour}:${String(minute).padStart(2, '0')}`;
    const isBooked = isSlotBooked(selectedDate, value);

    const btn = document.createElement('button');
    btn.classList.add('time-slot');

    // Format display time: 8:00 AM, 1:30 PM, etc.
    let displayHour = hour > 12 ? hour - 12 : hour;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const minStr = minute === 0 ? '00' : minute;
    btn.textContent = isBooked ? 'Booked' : `${displayHour}:${minStr} ${ampm}`;
    btn.dataset.value = value;

    if (isBooked) {
      btn.classList.add('booked');
      btn.disabled = true;
    } else {
      btn.addEventListener('click', () => selectTime(btn));
    }

    // Morning: 8-11, Afternoon: 12-18
    const container = hour <= 11 ? morningContainer : afternoonContainer;
    container.appendChild(btn);
  }
}

function formatDateKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ===== SELECT TIME SLOT =====
function selectTime(el) {
  // Remove previous selection
  document.querySelectorAll('.time-slot.selected').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  selectedTime = el.dataset.value;

  const [hour, min] = selectedTime.split(':').map(Number);
  let displayHour = hour > 12 ? hour - 12 : hour;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedTime = `${displayHour}:${String(min).padStart(2, '0')} ${ampm}`;

  // Show info step after a short delay for visual transition
  setTimeout(() => {
    document.getElementById('timeStep').classList.add('hidden');
    document.getElementById('infoStep').classList.remove('hidden');
    const dateTimeEl = document.getElementById('selectedDateTime');
    dateTimeEl.textContent = `${getWeekDayName(selectedDate)}, ${formatDate(selectedDate)} at ${formattedTime}`;

    // Re-trigger animations on form elements
    const groups = document.querySelectorAll('#infoStep .form-group, #infoStep .btn-block');
    groups.forEach((g, i) => {
      g.style.opacity = '0';
      g.style.transform = 'translateY(12px)';
      setTimeout(() => {
        g.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
        g.style.opacity = '1';
        g.style.transform = 'translateY(0)';
      }, i * 70);
    });
  }, 250);
}

// ===== CLOSE MODAL =====
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  document.body.style.overflow = '';
  // Reset after close animation
  setTimeout(() => {
    selectedDate = null;
    selectedTime = null;
  }, 400);
}

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal();
});

// ===== BOOKING FORM SUBMIT =====
document.getElementById('bookingForm').addEventListener('submit', (e) => {
  e.preventDefault();

  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const service = document.getElementById('service');
  const serviceName = service.options[service.selectedIndex].text;
  const notes = document.getElementById('notes').value.trim();

  if (!firstName || !lastName || !email || !phone || !service.value) return;

  // Defensive: check slot is still available (someone may have booked it in another tab)
  if (isSlotBooked(selectedDate, selectedTime)) {
    showBookingError('Sorry, this time slot was just taken. Please choose a different time.');
    return;
  }

  // Parse time
  const [hour, min] = selectedTime.split(':').map(Number);
  let displayHour = hour > 12 ? hour - 12 : hour;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedTime = `${displayHour}:${String(min).padStart(2, '0')} ${ampm}`;

  // Save booking to localStorage
  saveBooking(selectedDate, selectedTime, firstName, lastName, email, phone, serviceName, notes);

  // Show confirmation step
  document.getElementById('infoStep').classList.add('hidden');
  const confirmStep = document.getElementById('confirmStep');
  confirmStep.classList.remove('hidden');

  document.getElementById('confirmationDetails').innerHTML = `
    <p><strong>Date:</strong> ${getWeekDayName(selectedDate)}, ${formatDate(selectedDate)}</p>
    <p><strong>Time:</strong> ${formattedTime}</p>
    <p><strong>Name:</strong> ${firstName} ${lastName}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Phone:</strong> ${phone}</p>
    <p><strong>Service:</strong> ${serviceName}</p>
    ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
  `;

  // Animate confirmation details
  const detailItems = confirmStep.querySelectorAll('.confirmation-details p');
  detailItems.forEach((item, i) => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(10px)';
    setTimeout(() => {
      item.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
      item.style.opacity = '1';
      item.style.transform = 'translateY(0)';
    }, 200 + i * 80);
  });

  // Clear form
  document.getElementById('bookingForm').reset();

  // Re-render calendar to update availability indicators
  renderCalendar();
});

// ===== SHOW BOOKING ERROR =====
function showBookingError(message) {
  const infoStep = document.getElementById('infoStep');
  const errorEl = document.createElement('div');
  errorEl.className = 'booking-error';
  errorEl.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;padding:14px 16px;background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;color:#DC2626;font-size:0.9rem;">
      <span style="font-size:1.3rem;">⚠</span>
      <span>${message}</span>
    </div>`;

  // Insert before the back button if it exists, otherwise after modal subtitle
  const backBtn = document.getElementById('backToTimeBtn');
  if (backBtn) {
    infoStep.insertBefore(errorEl, backBtn);
  } else {
    infoStep.insertBefore(errorEl, infoStep.firstChild);
  }

  // Auto-remove after 5 seconds
  setTimeout(() => errorEl.remove(), 5000);
}

// Close confirmation modal
document.getElementById('closeConfirm').addEventListener('click', closeModal);

// Back to time selection step
document.getElementById('backToTimeBtn')?.addEventListener('click', () => {
  document.getElementById('infoStep').classList.add('hidden');
  document.getElementById('timeStep').classList.remove('hidden');
});

// ===== NAVBAR SCROLL EFFECT =====
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (window.scrollY > 80) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// ===== MOBILE NAV TOGGLE =====
document.getElementById('navToggle').addEventListener('click', () => {
  document.querySelector('.nav-links').classList.toggle('mobile-open');
});

// Close mobile nav when clicking a link
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelector('.nav-links').classList.remove('mobile-open');
  });
});

// ===== SCROLL ANIMATIONS (Intersection Observer) =====
function initScrollAnimations() {
  const animElements = [
    ...document.querySelectorAll('.fade-in-up'),
    ...document.querySelectorAll('.fade-in-left'),
    ...document.querySelectorAll('.fade-in-right'),
    ...document.querySelectorAll('.fade-in')
  ];

  // Elements inside sections that shouldn't animate on load
  const sectionChildren = document.querySelectorAll(
    '.about-grid, .services-grid, .gallery-grid, .testimonials-grid, .footer-grid'
  );

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('anim-visible');
        // Don't unobserve so it animates each time - actually, let's keep persistent
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  animElements.forEach(el => observer.observe(el));
}

// ===== KEYBOARD ACCESSIBILITY =====
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
});

// ===== GALLERY IMAGE FALLBACKS =====
function initGalleryImages() {
  const galleryItems = document.querySelectorAll('.gallery-item');
  galleryItems.forEach(item => {
    const img = item.querySelector('img');
    if (!img) return;

    // Mark as loading until it confirms ready
    img.classList.add('loading');

    img.addEventListener('load', () => {
      img.classList.remove('loading');
      img.classList.add('loaded');
    }, { once: true });

    img.addEventListener('error', () => {
      // Remove broken image — the fallback is always in place behind it
      img.style.display = 'none';
      item.classList.add('img-error');
    }, { once: true });
  });
}

// ===== INIT =====
renderCalendar();
initScrollAnimations();
initGalleryImages();
