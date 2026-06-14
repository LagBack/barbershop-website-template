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
      span.addEventListener('click', () => openBooking(date));
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

  generateTimeSlots(date.getDay());
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// ===== GENERATE TIME SLOTS (8am-7pm) =====
function generateTimeSlots(dayOfWeek) {
  const morningContainer = document.getElementById('timeSlotsMorning');
  const afternoonContainer = document.getElementById('timeSlotsAfternoon');
  morningContainer.innerHTML = '';
  afternoonContainer.innerHTML = '';

  // Slots: every 30 minutes from 8am to 6:30pm (last slot is 1hr before close)
  const slots = [];
  for (let h = 8; h <= 18; h++) {
    slots.push({ hour: h, min: 0 });
    if (h < 19) slots.push({ hour: h, min: 30 });
  }

  // Remove any at/after 7pm
  const validSlots = slots.filter(s => {
    if (s.hour >= 19) return false;
    return true;
  });

  validSlots.forEach(slot => {
    const btn = document.createElement('button');
    btn.classList.add('time-slot');

    // Format time: 8:00 AM, 8:30 AM, etc.
    let displayHour = slot.hour > 12 ? slot.hour - 12 : slot.hour;
    const ampm = slot.hour >= 12 ? 'PM' : 'AM';
    const minStr = slot.min === 0 ? '00' : slot.min;
    btn.textContent = `${displayHour}:${minStr} ${ampm}`;
    btn.dataset.value = `${slot.hour}:${String(slot.min).padStart(2, '0')}`;

    btn.addEventListener('click', () => selectTime(btn));
    (slot.hour < 12 ? morningContainer : afternoonContainer).appendChild(btn);
  });
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
    const groups = document.querySelectorAll('#infoStep .form-group');
    groups.forEach((g, i) => {
      g.style.opacity = '0';
      g.style.transform = 'translateY(15px)';
      setTimeout(() => {
        g.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        g.style.opacity = '1';
        g.style.transform = 'translateY(0)';
      }, i * 80);
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

  // Parse time
  const [hour, min] = selectedTime.split(':').map(Number);
  let displayHour = hour > 12 ? hour - 12 : hour;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedTime = `${displayHour}:${String(min).padStart(2, '0')} ${ampm}`;

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

  // Log booking (in production this would POST to an API)
  console.log('📅 New Appointment Booked:', {
    date: selectedDate.toISOString(),
    time: selectedTime,
    name: `${firstName} ${lastName}`,
    email, phone, service: serviceName, notes
  });

  // Clear form
  document.getElementById('bookingForm').reset();
});

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

// ===== INIT =====
renderCalendar();
initScrollAnimations();
