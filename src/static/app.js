document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const messageDiv = document.getElementById("message");
  const registrationModal = document.getElementById("registration-modal");
  const modalActivityName = document.getElementById("modal-activity-name");
  const signupForm = document.getElementById("signup-form");
  const activityInput = document.getElementById("activity");
  const closeRegistrationModal = document.querySelector(".close-modal");

  const searchInput = document.getElementById("activity-search");
  const searchButton = document.getElementById("search-button");
  const categoryFilters = document.querySelectorAll(".category-filter");
  const dayFilters = document.querySelectorAll(".day-filter");
  const timeFilters = document.querySelectorAll(".time-filter");

  const loginButton = document.getElementById("login-button");
  const userInfo = document.getElementById("user-info");
  const displayName = document.getElementById("display-name");
  const logoutButton = document.getElementById("logout-button");
  const loginModal = document.getElementById("login-modal");
  const loginForm = document.getElementById("login-form");
  const closeLoginModal = document.querySelector(".close-login-modal");
  const loginMessage = document.getElementById("login-message");

  const announcementBanner = document.getElementById("announcement-banner");
  const announcementText = document.getElementById("announcement-text");
  const manageAnnouncementsButton = document.getElementById(
    "manage-announcements-button"
  );
  const announcementsModal = document.getElementById("announcements-modal");
  const closeAnnouncementsModal = document.querySelector(
    ".close-announcements-modal"
  );
  const announcementsList = document.getElementById("announcements-list");
  const announcementForm = document.getElementById("announcement-form");
  const announcementFormId = document.getElementById("announcement-id");
  const announcementFormMessage = document.getElementById(
    "announcement-message"
  );
  const announcementFormStartDate = document.getElementById(
    "announcement-start-date"
  );
  const announcementFormExpirationDate = document.getElementById(
    "announcement-expiration-date"
  );
  const announcementCancelEdit = document.getElementById(
    "announcement-cancel-edit"
  );
  const announcementSubmit = document.getElementById("announcement-submit");
  const announcementManagerMessage = document.getElementById(
    "announcement-manager-message"
  );

  const activityTypes = {
    sports: { label: "Sports", color: "#e8f5e9", textColor: "#2e7d32" },
    arts: { label: "Arts", color: "#f3e5f5", textColor: "#7b1fa2" },
    academic: { label: "Academic", color: "#e3f2fd", textColor: "#1565c0" },
    community: { label: "Community", color: "#fff3e0", textColor: "#e65100" },
    technology: { label: "Technology", color: "#e8eaf6", textColor: "#3949ab" },
  };

  const timeRanges = {
    morning: { start: "06:00", end: "08:00" },
    afternoon: { start: "15:00", end: "18:00" },
    weekend: { days: ["Saturday", "Sunday"] },
  };

  let allActivities = {};
  let activeAnnouncements = [];
  let managerAnnouncements = [];
  let currentFilter = "all";
  let searchQuery = "";
  let currentDay = "";
  let currentTimeRange = "";
  let currentUser = null;

  function escapeHtml(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDateForDisplay(dateValue) {
    if (!dateValue) {
      return "Starts immediately";
    }

    const date = new Date(`${dateValue}T00:00:00`);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function initializeFilters() {
    const activeDayFilter = document.querySelector(".day-filter.active");
    if (activeDayFilter) {
      currentDay = activeDayFilter.dataset.day;
    }

    const activeTimeFilter = document.querySelector(".time-filter.active");
    if (activeTimeFilter) {
      currentTimeRange = activeTimeFilter.dataset.time;
    }
  }

  function updateAuthBodyClass() {
    if (currentUser) {
      document.body.classList.remove("not-authenticated");
      return;
    }
    document.body.classList.add("not-authenticated");
  }

  function resetAnnouncementForm() {
    announcementForm.reset();
    announcementFormId.value = "";
    announcementCancelEdit.classList.add("hidden");
    announcementSubmit.textContent = "Save Announcement";
  }

  function showManagerMessage(text, type) {
    announcementManagerMessage.textContent = text;
    announcementManagerMessage.className = `message ${type}`;
    announcementManagerMessage.classList.remove("hidden");

    setTimeout(() => {
      announcementManagerMessage.classList.add("hidden");
    }, 4000);
  }

  async function fetchAnnouncements(includeExpired = false) {
    try {
      const params = new URLSearchParams();
      if (includeExpired) {
        params.set("include_expired", "true");
        if (currentUser?.username) {
          params.set("teacher_username", currentUser.username);
        }
      }
      const query = params.toString() ? `?${params.toString()}` : "";
      const response = await fetch(`/announcements${query}`);
      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error fetching announcements:", error);
      return [];
    }
  }

  async function refreshAnnouncementBanner() {
    activeAnnouncements = await fetchAnnouncements(false);

    if (activeAnnouncements.length === 0) {
      announcementBanner.classList.add("hidden");
      announcementText.textContent = "";
      return;
    }

    const bannerCopy = activeAnnouncements
      .slice(0, 3)
      .map((item) => item.message)
      .join("  •  ");

    announcementText.textContent = bannerCopy;
    announcementBanner.classList.remove("hidden");
  }

  async function refreshManagerAnnouncements() {
    managerAnnouncements = await fetchAnnouncements(true);
    renderAnnouncementManagerList();
  }

  function renderAnnouncementManagerList() {
    if (managerAnnouncements.length === 0) {
      announcementsList.innerHTML = `
        <div class="announcement-empty-state">
          <h5>No announcements yet</h5>
          <p>Add your first announcement using the form above.</p>
        </div>
      `;
      return;
    }

    announcementsList.innerHTML = managerAnnouncements
      .map((item) => {
        const safeId = escapeHtml(item.id);
        const safeMessage = escapeHtml(item.message || "");
        const startLabel = item.start_date
          ? formatDateForDisplay(item.start_date)
          : "Immediate";
        const expirationLabel = formatDateForDisplay(item.expiration_date);

        return `
          <article class="announcement-item" data-announcement-id="${safeId}">
            <p class="announcement-item-message">${safeMessage}</p>
            <div class="announcement-item-meta">
              <span><strong>Starts:</strong> ${startLabel}</span>
              <span><strong>Expires:</strong> ${expirationLabel}</span>
            </div>
            <div class="announcement-item-actions">
              <button class="announcement-edit-button" data-announcement-id="${safeId}">Edit</button>
              <button class="announcement-delete-button" data-announcement-id="${safeId}">Delete</button>
            </div>
          </article>
        `;
      })
      .join("");

    announcementsList
      .querySelectorAll(".announcement-edit-button")
      .forEach((button) => {
        button.addEventListener("click", () => {
          startEditingAnnouncement(button.dataset.announcementId);
        });
      });

    announcementsList
      .querySelectorAll(".announcement-delete-button")
      .forEach((button) => {
        button.addEventListener("click", () => {
          deleteAnnouncement(button.dataset.announcementId);
        });
      });
  }

  function startEditingAnnouncement(announcementId) {
    const current = managerAnnouncements.find((item) => item.id === announcementId);
    if (!current) {
      return;
    }

    announcementFormId.value = current.id;
    announcementFormMessage.value = current.message || "";
    announcementFormStartDate.value = current.start_date || "";
    announcementFormExpirationDate.value = current.expiration_date || "";
    announcementCancelEdit.classList.remove("hidden");
    announcementSubmit.textContent = "Update Announcement";
    announcementFormMessage.focus();
  }

  async function saveAnnouncement(event) {
    event.preventDefault();

    if (!currentUser) {
      showManagerMessage("Please sign in to manage announcements.", "error");
      return;
    }

    const message = announcementFormMessage.value.trim();
    const startDate = announcementFormStartDate.value;
    const expirationDate = announcementFormExpirationDate.value;

    if (!message || !expirationDate) {
      showManagerMessage("Message and expiration date are required.", "error");
      return;
    }

    const editingId = announcementFormId.value;
    const query = new URLSearchParams({
      message,
      expiration_date: expirationDate,
      teacher_username: currentUser.username,
    });

    if (startDate) {
      query.set("start_date", startDate);
    }

    const endpoint = editingId
      ? `/announcements/${encodeURIComponent(editingId)}?${query.toString()}`
      : `/announcements?${query.toString()}`;
    const method = editingId ? "PUT" : "POST";

    try {
      const response = await fetch(endpoint, { method });
      const result = await response.json();

      if (!response.ok) {
        showManagerMessage(result.detail || "Unable to save announcement.", "error");
        return;
      }

      showManagerMessage(
        editingId ? "Announcement updated." : "Announcement created.",
        "success"
      );
      resetAnnouncementForm();
      await refreshManagerAnnouncements();
      await refreshAnnouncementBanner();
    } catch (error) {
      console.error("Error saving announcement:", error);
      showManagerMessage("Unable to save announcement right now.", "error");
    }
  }

  async function deleteAnnouncement(announcementId) {
    if (!currentUser) {
      showManagerMessage("Please sign in to manage announcements.", "error");
      return;
    }

    showConfirmationDialog("Delete this announcement?", async () => {
      try {
        const query = new URLSearchParams({
          teacher_username: currentUser.username,
        });
        const response = await fetch(
          `/announcements/${encodeURIComponent(announcementId)}?${query.toString()}`,
          { method: "DELETE" }
        );
        const result = await response.json();

        if (!response.ok) {
          showManagerMessage(result.detail || "Unable to delete announcement.", "error");
          return;
        }

        showManagerMessage("Announcement deleted.", "success");
        if (announcementFormId.value === announcementId) {
          resetAnnouncementForm();
        }
        await refreshManagerAnnouncements();
        await refreshAnnouncementBanner();
      } catch (error) {
        console.error("Error deleting announcement:", error);
        showManagerMessage("Unable to delete announcement right now.", "error");
      }
    });
  }

  function openAnnouncementsModal() {
    if (!currentUser) {
      showMessage("Please sign in to manage announcements.", "error");
      return;
    }

    announcementsModal.classList.remove("hidden");
    setTimeout(() => {
      announcementsModal.classList.add("show");
    }, 10);
    resetAnnouncementForm();
    refreshManagerAnnouncements();
  }

  function closeAnnouncementsModalHandler() {
    announcementsModal.classList.remove("show");
    setTimeout(() => {
      announcementsModal.classList.add("hidden");
      resetAnnouncementForm();
    }, 300);
  }

  function setDayFilter(day) {
    currentDay = day;
    dayFilters.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.day === day);
    });
    fetchActivities();
  }

  function setTimeRangeFilter(timeRange) {
    currentTimeRange = timeRange;
    timeFilters.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.time === timeRange);
    });
    fetchActivities();
  }

  function checkAuthentication() {
    const savedUser = localStorage.getItem("currentUser");
    if (!savedUser) {
      updateAuthUI();
      return;
    }

    try {
      currentUser = JSON.parse(savedUser);
      updateAuthUI();
      validateUserSession(currentUser.username);
    } catch (error) {
      console.error("Error parsing saved user", error);
      logout(false);
    }
  }

  async function validateUserSession(username) {
    try {
      const response = await fetch(
        `/auth/check-session?username=${encodeURIComponent(username)}`
      );

      if (!response.ok) {
        logout(false);
        return;
      }

      const userData = await response.json();
      currentUser = userData;
      localStorage.setItem("currentUser", JSON.stringify(userData));
      updateAuthUI();
    } catch (error) {
      console.error("Error validating session:", error);
    }
  }

  function updateAuthUI() {
    if (currentUser) {
      loginButton.classList.add("hidden");
      userInfo.classList.remove("hidden");
      manageAnnouncementsButton.classList.remove("hidden");
      displayName.textContent = currentUser.display_name;
    } else {
      loginButton.classList.remove("hidden");
      userInfo.classList.add("hidden");
      manageAnnouncementsButton.classList.add("hidden");
      displayName.textContent = "";

      if (!announcementsModal.classList.contains("hidden")) {
        closeAnnouncementsModalHandler();
      }
    }

    updateAuthBodyClass();
    fetchActivities();
  }

  async function login(username, password) {
    try {
      const response = await fetch(
        `/auth/login?username=${encodeURIComponent(
          username
        )}&password=${encodeURIComponent(password)}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();
      if (!response.ok) {
        showLoginMessage(data.detail || "Invalid username or password", "error");
        return false;
      }

      currentUser = data;
      localStorage.setItem("currentUser", JSON.stringify(data));
      updateAuthUI();
      closeLoginModalHandler();
      showMessage(`Welcome, ${currentUser.display_name}!`, "success");
      return true;
    } catch (error) {
      console.error("Error during login:", error);
      showLoginMessage("Login failed. Please try again.", "error");
      return false;
    }
  }

  function logout(showStatusMessage = true) {
    currentUser = null;
    localStorage.removeItem("currentUser");
    updateAuthUI();

    if (showStatusMessage) {
      showMessage("You have been logged out.", "info");
    }
  }

  function showLoginMessage(text, type) {
    loginMessage.textContent = text;
    loginMessage.className = `message ${type}`;
    loginMessage.classList.remove("hidden");
  }

  function openLoginModal() {
    loginModal.classList.remove("hidden");
    loginModal.classList.add("show");
    loginMessage.classList.add("hidden");
    loginForm.reset();
  }

  function closeLoginModalHandler() {
    loginModal.classList.remove("show");
    setTimeout(() => {
      loginModal.classList.add("hidden");
      loginForm.reset();
    }, 300);
  }

  function showLoadingSkeletons() {
    activitiesList.innerHTML = "";
    for (let i = 0; i < 9; i += 1) {
      const skeletonCard = document.createElement("div");
      skeletonCard.className = "skeleton-card";
      skeletonCard.innerHTML = `
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line skeleton-text short"></div>
        <div style="margin-top: 8px;">
          <div class="skeleton-line" style="height: 6px;"></div>
          <div class="skeleton-line skeleton-text short" style="height: 8px; margin-top: 3px;"></div>
        </div>
        <div style="margin-top: auto;">
          <div class="skeleton-line" style="height: 24px; margin-top: 8px;"></div>
        </div>
      `;
      activitiesList.appendChild(skeletonCard);
    }
  }

  function formatSchedule(details) {
    if (details.schedule_details) {
      const days = details.schedule_details.days.join(", ");
      const formatTime = (time24) => {
        const [hours, minutes] = time24.split(":").map(Number);
        const period = hours >= 12 ? "PM" : "AM";
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
      };

      return `${days}, ${formatTime(details.schedule_details.start_time)} - ${formatTime(
        details.schedule_details.end_time
      )}`;
    }

    return details.schedule;
  }

  function getActivityType(activityName, description) {
    const name = activityName.toLowerCase();
    const desc = description.toLowerCase();

    if (
      name.includes("soccer") ||
      name.includes("basketball") ||
      name.includes("sport") ||
      name.includes("fitness") ||
      desc.includes("team") ||
      desc.includes("game") ||
      desc.includes("athletic")
    ) {
      return "sports";
    }

    if (
      name.includes("art") ||
      name.includes("music") ||
      name.includes("theater") ||
      name.includes("drama") ||
      desc.includes("creative") ||
      desc.includes("paint")
    ) {
      return "arts";
    }

    if (
      name.includes("science") ||
      name.includes("math") ||
      name.includes("academic") ||
      name.includes("study") ||
      name.includes("olympiad") ||
      desc.includes("learning") ||
      desc.includes("education") ||
      desc.includes("competition")
    ) {
      return "academic";
    }

    if (
      name.includes("volunteer") ||
      name.includes("community") ||
      desc.includes("service") ||
      desc.includes("volunteer")
    ) {
      return "community";
    }

    if (
      name.includes("computer") ||
      name.includes("coding") ||
      name.includes("tech") ||
      name.includes("robotics") ||
      desc.includes("programming") ||
      desc.includes("technology") ||
      desc.includes("digital") ||
      desc.includes("robot")
    ) {
      return "technology";
    }

    return "academic";
  }

  async function fetchActivities() {
    showLoadingSkeletons();

    try {
      const queryParams = [];

      if (currentDay) {
        queryParams.push(`day=${encodeURIComponent(currentDay)}`);
      }

      if (currentTimeRange) {
        const range = timeRanges[currentTimeRange];
        if (currentTimeRange !== "weekend" && range) {
          queryParams.push(`start_time=${encodeURIComponent(range.start)}`);
          queryParams.push(`end_time=${encodeURIComponent(range.end)}`);
        }
      }

      const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
      const response = await fetch(`/activities${queryString}`);
      const activities = await response.json();
      allActivities = activities;
      displayFilteredActivities();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  function displayFilteredActivities() {
    activitiesList.innerHTML = "";
    const filteredActivities = {};

    Object.entries(allActivities).forEach(([name, details]) => {
      const activityType = getActivityType(name, details.description);
      if (currentFilter !== "all" && activityType !== currentFilter) {
        return;
      }

      if (currentTimeRange === "weekend" && details.schedule_details) {
        const isWeekendActivity = details.schedule_details.days.some((day) =>
          timeRanges.weekend.days.includes(day)
        );

        if (!isWeekendActivity) {
          return;
        }
      }

      const searchableContent = [
        name.toLowerCase(),
        details.description.toLowerCase(),
        formatSchedule(details).toLowerCase(),
      ].join(" ");

      if (searchQuery && !searchableContent.includes(searchQuery.toLowerCase())) {
        return;
      }

      filteredActivities[name] = details;
    });

    if (Object.keys(filteredActivities).length === 0) {
      activitiesList.innerHTML = `
        <div class="no-results">
          <h4>No activities found</h4>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      `;
      return;
    }

    Object.entries(filteredActivities).forEach(([name, details]) => {
      renderActivityCard(name, details);
    });
  }

  function renderActivityCard(name, details) {
    const activityCard = document.createElement("div");
    activityCard.className = "activity-card";

    const totalSpots = details.max_participants;
    const takenSpots = details.participants.length;
    const spotsLeft = totalSpots - takenSpots;
    const capacityPercentage = (takenSpots / totalSpots) * 100;
    const isFull = spotsLeft <= 0;

    let capacityStatusClass = "capacity-available";
    if (isFull) {
      capacityStatusClass = "capacity-full";
    } else if (capacityPercentage >= 75) {
      capacityStatusClass = "capacity-near-full";
    }

    const activityType = getActivityType(name, details.description);
    const typeInfo = activityTypes[activityType];

    activityCard.innerHTML = `
      <span class="activity-tag" style="background-color: ${typeInfo.color}; color: ${typeInfo.textColor}">
        ${typeInfo.label}
      </span>
      <h4>${name}</h4>
      <p>${details.description}</p>
      <p class="tooltip">
        <strong>Schedule:</strong> ${formatSchedule(details)}
        <span class="tooltip-text">Regular meetings at this time throughout the semester</span>
      </p>
      <div class="capacity-container ${capacityStatusClass}">
        <div class="capacity-bar-bg">
          <div class="capacity-bar-fill" style="width: ${capacityPercentage}%"></div>
        </div>
        <div class="capacity-text">
          <span>${takenSpots} enrolled</span>
          <span>${spotsLeft} spots left</span>
        </div>
      </div>
      <div class="participants-list">
        <h5>Current Participants:</h5>
        <ul>
          ${details.participants
            .map(
              (email) => `
            <li>
              ${email}
              ${
                currentUser
                  ? `
                <span class="delete-participant tooltip" data-activity="${name}" data-email="${email}">
                  ✖
                  <span class="tooltip-text">Unregister this student</span>
                </span>
              `
                  : ""
              }
            </li>
          `
            )
            .join("")}
        </ul>
      </div>
      <div class="activity-card-actions">
        ${
          currentUser
            ? `<button class="register-button" data-activity="${name}" ${
                isFull ? "disabled" : ""
              }>${isFull ? "Activity Full" : "Register Student"}</button>`
            : '<div class="auth-notice">Teachers can register students.</div>'
        }
      </div>
    `;

    activityCard.querySelectorAll(".delete-participant").forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });

    if (currentUser && !isFull) {
      activityCard.querySelector(".register-button").addEventListener("click", () => {
        openRegistrationModal(name);
      });
    }

    activitiesList.appendChild(activityCard);
  }

  function openRegistrationModal(activityName) {
    modalActivityName.textContent = activityName;
    activityInput.value = activityName;
    registrationModal.classList.remove("hidden");
    setTimeout(() => {
      registrationModal.classList.add("show");
    }, 10);
  }

  function closeRegistrationModalHandler() {
    registrationModal.classList.remove("show");
    setTimeout(() => {
      registrationModal.classList.add("hidden");
      signupForm.reset();
    }, 300);
  }

  function showConfirmationDialog(message, confirmCallback) {
    let confirmDialog = document.getElementById("confirm-dialog");
    if (!confirmDialog) {
      confirmDialog = document.createElement("div");
      confirmDialog.id = "confirm-dialog";
      confirmDialog.className = "modal hidden";
      confirmDialog.innerHTML = `
        <div class="modal-content">
          <h3>Confirm Action</h3>
          <p id="confirm-message"></p>
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
            <button id="cancel-button" class="secondary-button">Cancel</button>
            <button id="confirm-button" class="danger-button">Confirm</button>
          </div>
        </div>
      `;
      document.body.appendChild(confirmDialog);
    }

    document.getElementById("confirm-message").textContent = message;
    confirmDialog.classList.remove("hidden");
    setTimeout(() => {
      confirmDialog.classList.add("show");
    }, 10);

    const cancelButton = document.getElementById("cancel-button");
    const confirmButton = document.getElementById("confirm-button");

    const cancelClone = cancelButton.cloneNode(true);
    const confirmClone = confirmButton.cloneNode(true);
    cancelButton.parentNode.replaceChild(cancelClone, cancelButton);
    confirmButton.parentNode.replaceChild(confirmClone, confirmButton);

    cancelClone.addEventListener("click", () => {
      confirmDialog.classList.remove("show");
      setTimeout(() => {
        confirmDialog.classList.add("hidden");
      }, 300);
    });

    confirmClone.addEventListener("click", () => {
      confirmCallback();
      confirmDialog.classList.remove("show");
      setTimeout(() => {
        confirmDialog.classList.add("hidden");
      }, 300);
    });
  }

  async function handleUnregister(event) {
    if (!currentUser) {
      showMessage("You must be logged in as a teacher to unregister students.", "error");
      return;
    }

    const trigger = event.currentTarget;
    const activity = trigger.dataset.activity;
    const email = trigger.dataset.email;

    showConfirmationDialog(
      `Are you sure you want to unregister ${email} from ${activity}?`,
      async () => {
        try {
          const response = await fetch(
            `/activities/${encodeURIComponent(
              activity
            )}/unregister?email=${encodeURIComponent(
              email
            )}&teacher_username=${encodeURIComponent(currentUser.username)}`,
            { method: "POST" }
          );

          const result = await response.json();
          if (response.ok) {
            showMessage(result.message, "success");
            fetchActivities();
            return;
          }

          showMessage(result.detail || "An error occurred", "error");
        } catch (error) {
          showMessage("Failed to unregister. Please try again.", "error");
          console.error("Error unregistering:", error);
        }
      }
    );
  }

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  loginButton.addEventListener("click", openLoginModal);
  logoutButton.addEventListener("click", () => logout(true));
  closeLoginModal.addEventListener("click", closeLoginModalHandler);
  manageAnnouncementsButton.addEventListener("click", openAnnouncementsModal);
  closeAnnouncementsModal.addEventListener("click", closeAnnouncementsModalHandler);
  closeRegistrationModal.addEventListener("click", closeRegistrationModalHandler);

  window.addEventListener("click", (event) => {
    if (event.target === loginModal) {
      closeLoginModalHandler();
    }

    if (event.target === registrationModal) {
      closeRegistrationModalHandler();
    }

    if (event.target === announcementsModal) {
      closeAnnouncementsModalHandler();
    }

    const confirmDialog = document.getElementById("confirm-dialog");
    if (confirmDialog && event.target === confirmDialog) {
      confirmDialog.classList.remove("show");
      setTimeout(() => {
        confirmDialog.classList.add("hidden");
      }, 300);
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    await login(username, password);
  });

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!currentUser) {
      showMessage("You must be logged in as a teacher to register students.", "error");
      return;
    }

    const email = document.getElementById("email").value;
    const activity = activityInput.value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(
          email
        )}&teacher_username=${encodeURIComponent(currentUser.username)}`,
        { method: "POST" }
      );

      const result = await response.json();
      if (response.ok) {
        showMessage(result.message, "success");
        closeRegistrationModalHandler();
        fetchActivities();
        return;
      }

      showMessage(result.detail || "An error occurred", "error");
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  announcementForm.addEventListener("submit", saveAnnouncement);
  announcementCancelEdit.addEventListener("click", resetAnnouncementForm);

  searchInput.addEventListener("input", (event) => {
    searchQuery = event.target.value;
    displayFilteredActivities();
  });

  searchButton.addEventListener("click", (event) => {
    event.preventDefault();
    searchQuery = searchInput.value;
    displayFilteredActivities();
  });

  categoryFilters.forEach((button) => {
    button.addEventListener("click", () => {
      categoryFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      currentFilter = button.dataset.category;
      displayFilteredActivities();
    });
  });

  dayFilters.forEach((button) => {
    button.addEventListener("click", () => {
      dayFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      currentDay = button.dataset.day;
      fetchActivities();
    });
  });

  timeFilters.forEach((button) => {
    button.addEventListener("click", () => {
      timeFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      currentTimeRange = button.dataset.time;
      fetchActivities();
    });
  });

  window.activityFilters = {
    setDayFilter,
    setTimeRangeFilter,
  };

  checkAuthentication();
  initializeFilters();
  fetchActivities();
  refreshAnnouncementBanner();
});
