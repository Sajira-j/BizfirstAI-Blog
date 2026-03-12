// get the newsletter form elements
const form = document.getElementById("newsletter");
const form_email = document.getElementById("newsletter_email");
const form_status = document.getElementById("newsletter_status");

// Success, Loading and Error functions
function successNewsletter(message) {
  form_status.innerHTML = `<div class="newsletter-msg bg-success"><div class="m-auto">${message}</div></div>`;
  setTimeout(() => {
    resetNewsletter();
  }, 2000);
}

function loadingNewsletter() {
  form_status.innerHTML = '<div class="newsletter-msg"><div class="m-auto spinner-border" role="status"></div></div>';
}

function errorNewsletter(message) {
  form_status.innerHTML = `<div class="newsletter-msg bg-danger"><div class="m-auto">${message}</div></div>`;
}

function resetNewsletter() {
  form.reset();
  form_status.innerHTML = "";
}

function subscribeNewsletter(url, data) {
  var options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  };

  fetch(url, options)
    .then((response) => {
      if (response.status === 200) {
        successNewsletter('Thank You ! You are subscribed!');
      } else if (response.status === 400) {
        errorNewsletter('Email is already subscribed.');
      } else {
        errorNewsletter('Oops Something went wrong.');
      }
    })
    .catch((err) => {
      errorNewsletter(err.message);
    });
}

form.addEventListener("submit", function (e) {
  e.preventDefault();
  loadingNewsletter();
  var subscriber_data = {
    Email: form_email.value,
    Ip: "unknown",
    Country: "unknown",
    Region: "unknown"
  };

  subscribeNewsletter(form.action, subscriber_data);
});

// search modal auto focus
var myModal = document.getElementById('searchModal');
if (myModal) {
  myModal.addEventListener('shown.bs.modal', function () {
    document.getElementById('searchFormInput').focus()
  })
}

// Mobile menu toggle functionality
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const headerNavItems = document.getElementById('headerNavItems');

if (mobileMenuToggle && headerNavItems) {
  mobileMenuToggle.addEventListener('click', function(e) {
    e.stopPropagation();
    headerNavItems.classList.toggle('active');

    // Update ARIA attribute for accessibility
    const isExpanded = headerNavItems.classList.contains('active');
    mobileMenuToggle.setAttribute('aria-expanded', isExpanded);
  });

  // Close menu when clicking outside
  document.addEventListener('click', function(e) {
    if (!headerNavItems.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
      headerNavItems.classList.remove('active');
      mobileMenuToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Close menu when clicking on a navigation link
  const navLinks = headerNavItems.querySelectorAll('a:not(.dropdown-toggle)');
  navLinks.forEach(link => {
    link.addEventListener('click', function() {
      headerNavItems.classList.remove('active');
      mobileMenuToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Close menu on window resize if going from mobile to desktop
  let previousWidth = window.innerWidth;
  window.addEventListener('resize', function() {
    const currentWidth = window.innerWidth;
    if (previousWidth < 768 && currentWidth >= 768) {
      headerNavItems.classList.remove('active');
      mobileMenuToggle.setAttribute('aria-expanded', 'false');
    }
    previousWidth = currentWidth;
  });
}