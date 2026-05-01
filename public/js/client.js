document.addEventListener('DOMContentLoaded', () => {
  // Comment voting
  document.querySelectorAll('.comment-vote').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const commentId = btn.dataset.commentId;
      const vote = btn.dataset.vote;
      try {
        const res = await fetch(`/api/comments/${commentId}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vote: parseInt(vote) })
        });
        const data = await res.json();
        if (data.action) {
          location.reload();
        }
      } catch (err) {
        console.error('Vote failed:', err);
      }
    });
  });

  // Comment flagging
  document.querySelectorAll('.comment-flag').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const commentId = btn.dataset.commentId;
      const reason = prompt('Flag reason (optional):');
      if (reason === null) return;
      try {
        await fetch(`/api/comments/${commentId}/flag`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: reason || '' })
        });
        alert('Comment flagged for review.');
      } catch (err) {
        console.error('Flag failed:', err);
      }
    });
  });

  // Reply buttons (toggle reply form)
  document.querySelectorAll('.comment-reply').forEach(btn => {
    btn.addEventListener('click', () => {
      const commentId = btn.dataset.commentId;
      const existingForm = document.getElementById(`reply-form-${commentId}`);
      if (existingForm) {
        existingForm.remove();
        return;
      }
      const form = document.createElement('form');
      form.id = `reply-form-${commentId}`;
      form.method = 'POST';
      form.action = window.location.pathname + '/comment';
      form.className = 'mt-3 ml-6';
      form.innerHTML = `
        <textarea name="content" rows="2" placeholder="Write a reply..." class="w-full bg-surface-container-low border-b border-outline-variant focus:border-[#CCFF00] text-on-surface p-3 transition-all input-glow" required></textarea>
        <input type="hidden" name="parentId" value="${commentId}"/>
        <div class="flex space-x-2 mt-2">
          <button type="submit" class="bg-[#CCFF00] text-black font-['Space_Grotesk'] uppercase tracking-wider text-xs font-bold px-4 py-1.5">Reply</button>
          <button type="button" class="text-slate-500 hover:text-white text-xs font-['Space_Grotesk'] uppercase tracking-wider" onclick="this.closest('form').remove()">Cancel</button>
        </div>
      `;
      btn.closest('.flex.items-center').after(form);
    });
  });

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
