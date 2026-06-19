document.addEventListener('DOMContentLoaded', () => {
  // Flash message auto-dismiss
  const flashMessages = document.querySelectorAll('.flash-message');
  flashMessages.forEach(msg => {
    setTimeout(() => {
      msg.style.opacity = '0';
      msg.style.transition = 'opacity 0.5s ease';
      setTimeout(() => msg.remove(), 500);
    }, 5000);
  });

  // Mobile nav toggle
  const mobileToggle = document.querySelector('.mobile-nav-toggle');
  const mobileMenu = document.querySelector('.mobile-nav-menu');
  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }
});
