let withdrawInProgress = false;
const apiUrl = 'https://api.robux-paradise.com:8310';
const rewards = [0, 2, 5, 10, 25, 50, 100, 200];
const probabilities = [10, 29.95, 20, 25, 8, 6, 1, 0.05];

const probTable = document.getElementById('probability-rows');
if (probTable) {
  rewards.forEach((value, i) => {
    const row = document.createElement('tr');
    const rewardCell = document.createElement('td');
    const chanceCell = document.createElement('td');

    rewardCell.textContent = `${value} R$`;
    chanceCell.textContent = `${probabilities[i]} %`;

    row.appendChild(rewardCell);
    row.appendChild(chanceCell);
    probTable.appendChild(row);
  });
}

async function loadAdminLogs() {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const list = document.getElementById("admin-logs-list");
  if (!storedUser || !list) return;

  try {
    const res = await fetch(`${apiUrl}/admin/logs`, {
      headers: {
        "x-admin-id": storedUser.id
      }
    });
    if (!res.ok) throw new Error("Request failed");

    const logs = await res.json();
    list.innerHTML = "";

    if (logs.length === 0) {
      list.innerHTML = "<li>No logs yet.</li>";
      return;
    }

    for (const log of logs) {
      const date = new Date(log.timestamp).toLocaleString();
      const li = document.createElement("li");
      li.textContent = `[${date}] ${log.adminId} → ${log.action} ${log.target}${log.details ? ` (${log.details})` : ""}`;
      list.appendChild(li);
    }
  } catch (err) {
    console.error("❌ Failed to load admin logs:", err);
    list.innerHTML = "<li>❌ Failed to load logs.</li>";
  }
}

async function loadAdminStats() {
  try {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const res = await fetch(`${apiUrl}/admin/stats`, {
      headers: { "x-admin-id": storedUser.id }
    });
    if (!res.ok) throw new Error("Failed to fetch stats");
    const stats = await res.json();

    document.getElementById("stats-total-users").textContent = stats.total_users;
    document.getElementById("stats-total-balance").textContent = `${stats.total_balance} R$`;
    document.getElementById("stats-total-messages").textContent = stats.total_messages;
    document.getElementById("stats-recent-users").textContent = stats.recent_users;

    const inviterList = document.getElementById("stats-top-inviters");
    const vcList = document.getElementById("stats-top-vc");
    inviterList.innerHTML = "";
    vcList.innerHTML = "";

    stats.top_invites.forEach(({ name, avatar, invites }) => {
      const li = document.createElement("li");
      li.style.display = "flex";
      li.style.alignItems = "center";
      li.style.gap = "10px";

      const img = document.createElement("img");
      img.src = avatar || "https://cdn.discordapp.com/embed/avatars/0.png";
      img.alt = name;
      img.width = 32;
      img.height = 32;
      img.style.borderRadius = "50%";

      const span = document.createElement("span");
      span.textContent = `${name} – ${invites} invites`;

      li.appendChild(img);
      li.appendChild(span);
      inviterList.appendChild(li);
    });


    stats.top_vc.forEach(({ name, avatar, time }) => {
      const li = document.createElement("li");
      li.style.display = "flex";
      li.style.alignItems = "center";
      li.style.gap = "10px";

      const img = document.createElement("img");
      img.src = avatar || "https://cdn.discordapp.com/embed/avatars/0.png"; // fallback avatar
      img.alt = name;
      img.width = 32;
      img.height = 32;
      img.style.borderRadius = "50%";

      const span = document.createElement("span");
      span.textContent = `${name} – ${time}`;

      li.appendChild(img);
      li.appendChild(span);
      vcList.appendChild(li);
    });
  } catch (err) {
    console.error("❌ Failed to load admin stats", err);
    showErrorModal("Failed to load admin statistics.");
  }
}

window.closeCodeVerificationModal = function () {
  const modal = document.getElementById("code-verification-modal");
  if (modal) modal.classList.add("hidden");
};

function openBanReasonModal(onConfirm) {
  const modal = document.getElementById("ban-reason-modal");
  const select = document.getElementById("ban-reason-select");
  const confirmBtn = document.getElementById("confirm-ban-reason-btn");

  modal.classList.remove("hidden");
  select.selectedIndex = 0;

  const newBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);

  newBtn.addEventListener("click", () => {
    const reason = select.value;
    modal.classList.add("hidden");
    onConfirm(reason);
  });
}

function closeBanReasonModal() {
  const modal = document.getElementById("ban-reason-modal");
  if (modal) modal.classList.add("hidden");
}

    function toggleDropdown() {
      document.getElementById('profile-dropdown').classList.toggle('hidden');
    }

  function closeWithdrawModal() {
    document.getElementById('withdraw-modal').classList.add('hidden');
  }

  function closeConfirmWithdrawDropdown() {
    document.getElementById("confirm-withdraw-modal").classList.add("hidden");
  }

document.addEventListener("click", (e) => {
  const dropdown = document.getElementById("profile-dropdown");
  const profileIcon = document.getElementById("profile-icon");

  if (
    dropdown &&
    !dropdown.contains(e.target) &&
    !profileIcon.contains(e.target)
  ) {
    dropdown.classList.add("hidden");
  }
});

function openLoginModal() {
  document.getElementById('login-modal').classList.remove('hidden');
}

async function loginUser() {
  const username = document.getElementById("discord-id").value;
  const token = grecaptcha.getResponse();

  if (!token || !username) {
    showErrorModal("Please enter your Discord Username and complete the captcha.");
    grecaptcha.reset();
    return;
  }

  const loginBtn = document.querySelector('#login-modal button.btn');
  const originalText = loginBtn.textContent;
  loginBtn.textContent = "Waiting for approval... Check your DMs on Discord!";
  loginBtn.disabled = true;

  try {
    const res = await fetch(`${apiUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: username, token })
    });

    const data = await res.json();

    if (res.ok && data.balance !== undefined) {
      const userData = {
        name: data.name,
        balance: data.balance,
        avatar: data.avatar || "https://cdn.discordapp.com/embed/avatars/0.png",
        id: data.id
      };
      localStorage.setItem("user", JSON.stringify(userData));
      renderUser(userData);
      closeLoginModal();
    } else {
      if (res.status === 429) {
        const blockedUntil = Date.now() + 600000;
        localStorage.setItem("blockUntil", blockedUntil);
        startBlockCountdown(600);
      } else if (data.message === "Could not send DM") {
        showErrorModal("❌ We couldn’t send you a message on Discord. Please check your DM settings and try again.");
      } else if (data.message === "Timeout: no response") {
        showErrorModal("⏳ Login timed out. Please check your Discord DMs and try again.");
      } else if (data.message === "Login rejected.") {
        showErrorModal("❌ You declined the login request. Try again if this was a mistake.");
      } else {
        showErrorModal(data.message || "Login failed.");
      }
    }
  } catch (err) {
    console.error(err);
    showErrorModal("Login failed. Please try again.");
  } finally {
    grecaptcha.reset();
    loginBtn.textContent = originalText;
    loginBtn.disabled = false;
  }
}

      function closeConfirmWithdrawModal() {
        const modal = document.getElementById("confirm-withdraw-modal");
        if (modal) {
          modal.classList.add("hidden");
        }
      }

  function closeProfileDropdown() {
      document.getElementById('profile-dropdown').classList.add('hidden');
  }

    function closeLoginModal() {
      document.getElementById('login-modal').classList.add('hidden');
    }


    function renderUser(user) {
      const dropdown = document.getElementById("profile-dropdown");
      if (dropdown) dropdown.classList.add("hidden");

      const loginBtn = document.getElementById("login-btn");
      if (loginBtn) loginBtn.style.display = "none";

      const profileIcon = document.getElementById("profile-icon");
      if (profileIcon) {
        profileIcon.src = user.avatar;
        profileIcon.classList.remove("hidden");
      }

      const avatar = document.getElementById("dropdown-avatar");
      const name = document.getElementById("dropdown-name");
      const balance = document.getElementById("dropdown-balance");

      if (avatar) avatar.src = user.avatar;
      if (name) name.textContent = user.name;
      if (balance) balance.textContent = `Balance : ${user.balance} R$`;
    }

    async function refreshBalance() {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) return;

    try {
        const res = await fetch(`${apiUrl}/balance?useraid=${storedUser.id}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });

        const data = await res.json();
        if (data.balance !== undefined) {
            const updatedUser = {
                ...storedUser,
                balance: data.balance,
                avatar: data.avatar,
                name: data.name
            };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            document.getElementById("dropdown-balance").textContent = `Balance : ${data.balance} R$`;
            document.getElementById("dropdown-avatar").src = data.avatar;
            document.getElementById("dropdown-name").textContent = data.name;
        }
    } catch (error) {
        console.error("Error during balance update :", error);
    }
  }

    async function updateDailyWithdrawDisplay() {
      const displayElement = document.getElementById('dailyWithdrawAmount');
      if (!displayElement) return;

      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) return;

        const response = await fetch(`${apiUrl}/withdraw/daily-total?useraid=${user.id}`);
        const data = await response.json();

        const amount = typeof data.total === "number" ? data.total : 0;
        displayElement.textContent = `${amount} / 150 R$`;
      } catch (error) {
        console.error("Failed to update daily withdraw display:", error);
      }
    }

  async function checkDailyWithdrawTotal(useraid) {
    try {
      const res = await fetch(`${apiUrl}/withdraw/daily-total?useraid=${useraid}`);
      if (!res.ok) throw new Error('Could not check daily total');
      const data = await res.json();
      return data.total || 0;
    } catch (err) {
      console.error('Error checking daily total:', err);
      return 0;
    }
  }

  async function checkWithdrawStatus(useraid) {
    try {
      const res = await fetch(`${apiUrl}/withdraw/status?useraid=${useraid}`);
      if (!res.ok) throw new Error('Failed to check status');
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('Error checking withdraw status:', err);
      return { active: false };
    }
  }

  async function refreshRobloxUsername() {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) return null;

    try {
      const res = await fetch(`${apiUrl}/rbxusername?useraid=${storedUser.id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      const data = await res.json();
      if (data.robloxUsername !== undefined) {
        const updatedUser = {
          ...storedUser,
          robloxUsername: data.robloxUsername || storedUser.robloxUsername
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        return updatedUser.robloxUsername;
      }
    } catch (error) {
      console.error("Error during Roblox Username update:", error);
    }
    return null;
  }

  function updateRobloxUsernameField() {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser || !storedUser.robloxUsername) return;

    const input = document.getElementById('roblox-pseudo');
    if (input) {
      input.value = storedUser.robloxUsername;
      input.disabled = true;
    }
  }

async function launchWithdraw(useraid, pseudo, amount) {
  const statusDiv = document.getElementById("queue-status");
  const errorDiv = document.getElementById("withdraw-error");
  const confirmBtn = document.getElementById("confirm-withdraw-btn");

  confirmBtn.disabled = true;
  confirmBtn.innerHTML = '<span class="spinner"></span>';
  statusDiv.textContent = "⏳ Sending your withdrawal request...";
  errorDiv.textContent = "";

  let pollingActive = true;

  const poll = setInterval(async () => {
    if (!pollingActive) return;
    try {
      const [posRes, statusRes] = await Promise.all([
        fetch(apiUrl + "/withdraw/position?useraid=" + useraid),
        fetch(apiUrl + "/withdraw/status?useraid=" + useraid)
      ]);
      const pos = await posRes.json();
      const status = await statusRes.json();

      if (!status.active && pos.position === null) {
        clearInterval(poll);
        statusDiv.textContent = "✅ Withdraw completed!";
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = "CONFIRM";
        return;
      }

      if (pos.position === 0) {
        statusDiv.textContent = "🟢 Processing your withdrawal...";
      } else if (pos.position !== null) {
        statusDiv.textContent = `⏳ You are #${pos.position} in the queue...`;
      } else {
        statusDiv.textContent = "⌛ Waiting for your position...";
      }
    } catch (err) {
      clearInterval(poll);
      statusDiv.textContent = "❌ Error polling queue.";
      errorDiv.textContent = err.message;
    }
  }, 3000);

  try {
    const res = await fetch(apiUrl + "/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pseudo, amount, useraid })
    });

    const data = await res.json();

    if (!res.ok) {
      pollingActive = false;
      clearInterval(poll);
      throw new Error(data.error || data.message || "Withdraw request rejected.");
    }

  } catch (err) {
    pollingActive = false;
    clearInterval(poll);
    statusDiv.textContent = "❌ Withdraw failed.";
    errorDiv.textContent = err.message || "Unexpected error.";
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = "CONFIRM";
  }
}

async function prepareWithdraw() {
  const pseudo = document.getElementById("roblox-pseudo").value.trim();
  const amount = parseInt(document.getElementById("robux-amount").value);
  const queueStatus = document.getElementById("queue-status");
  const errorDiv = document.getElementById("withdraw-error");

  if (!pseudo || isNaN(amount) || amount < 10 || amount > user.balance || amount > 150) {
    showErrorModal("Please enter a valid username and amount ≥ 10 and amount ≤ 150.");
    return;
  }

  document.getElementById("confirm-original-amount").textContent = amount;
  document.getElementById("confirm-final-amount").textContent = Math.ceil(amount * (1 / 0.7));
  document.getElementById("withdraw-modal").classList.add("hidden");
  document.getElementById("confirm-withdraw-modal").classList.remove("hidden");

  const confirmBtn = document.getElementById("confirm-withdraw-btn");
  confirmBtn.disabled = false;
  confirmBtn.innerHTML = "CONFIRM";
  confirmBtn.onclick = () => launchWithdraw(user.id, pseudo, amount);
}

  function backToWithdrawModal() {

    document.getElementById("confirm-withdraw-modal").classList.add("hidden");

    document.getElementById("withdraw-modal").classList.remove("hidden");

    document.getElementById("queue-status").textContent = "";
    document.getElementById("withdraw-error").textContent = "";

    if (user && user.id) {
      navigator.sendBeacon(`${apiUrl}/withdraw/cancel`, JSON.stringify({ useraid: user.id }));
    }
  }

const spinBtn = document.getElementById('spin-btn');
const wheel = document.getElementById('wheel');
const result = document.getElementById('spin-result');
const timerDisplay = document.getElementById('spin-timer');

let timerInterval = null;

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function startSpinTimer(endTimestamp) {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const now = Date.now();
    const remaining = endTimestamp - now;
    if (remaining <= 0) {
      clearInterval(timerInterval);
      timerDisplay.textContent = '';
      spinBtn.disabled = false;
    } else {
      if (!timerDisplay) return;
      timerDisplay.textContent = `Next spin in ${formatTime(remaining)}`;
      spinBtn.disabled = true;
    }
  }, 1000);
}

const visualOrder = [100, 50, 25, 10, 5, 2, 0, 200];


function getRotationAngleForReward(amount) {
  const index = visualOrder.indexOf(amount);
  if (index === -1) return 0;

  const segmentAngle = 360 / visualOrder.length;
  const fullSpins = 360 * 5;
  const offset = segmentAngle / 2;

  const adjustedIndex = (index + visualOrder.length - 1) % visualOrder.length;

  return fullSpins + adjustedIndex * segmentAngle + offset;
}

async function checkSpinAvailability() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) return;

  try {
    const res = await fetch(apiUrl + `/wheel/reward/status?useraid=${user.id}`);
    const data = await res.json();

    if (data.canSpin) {
      if (!spinBtn) return;
      spinBtn.disabled = false;
      timerDisplay.textContent = '';
    } else if (data.nextTry) {
      const next = new Date(data.nextTry).getTime();
      startSpinTimer(next);
    } else {
      if (!spinBtn) return;
      spinBtn.disabled = true;
      timerDisplay.textContent = 'Please wait before spinning again.';
    }
  } catch (e) {
    console.error("Error checking spin status", e);
    spinBtn.disabled = true;
    timerDisplay.textContent = 'Error loading spin timer.';
  }
}

async function loadWheelHistory() {
  const container = document.getElementById("wheel-history");
  if (!container) return;

  try {
    const res = await fetch(`${apiUrl}/wheel/history`);
    if (!res.ok) throw new Error("Failed to load history");

    const history = await res.json();
    container.innerHTML = "";

    history.forEach(entry => {
      const div = document.createElement("div");
      div.className = "history-entry";
      div.innerHTML = `
        <img src="${entry.avatar}" alt="${entry.name}" class="history-avatar" />
        <span><strong>${entry.name}</strong> won <span class="history-amount">${entry.amount} R$</span></span>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    console.error("Error loading wheel history:", err);
    container.textContent = "❌ Could not load history.";
  }
}

if (spinBtn) {
  spinBtn.addEventListener('click', async () => {
    const token = grecaptcha.getResponse();
    if (!token) {
      showErrorModal("Please complete the captcha first.");
      return;
    }
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return showErrorModal("You must be logged in.");

    spinBtn.disabled = true;
    result.textContent = '';

    try {
      const res = await fetch(apiUrl + '/wheel/reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useraid: user.id, captchaToken: token })
      });

      const data = await res.json();

      if (!data.success) {
        result.textContent = data.message || "❌ Already spun recently.";
        spinBtn.disabled = false;
        return;
      }

      const targetAngle = getRotationAngleForReward(data.amount, rewards);

      const canvas = document.getElementById("wheel-canvas");
      canvas.style.transition = "transform 4s cubic-bezier(0.33, 1, 0.68, 1)";
      canvas.style.transform = `rotate(${targetAngle}deg)`;
      
      setTimeout(() => {
        const canvas = document.getElementById("wheel-canvas");
        if (canvas) {
          canvas.style.transition = "transform 5s ease-in-out";
          canvas.style.transform = "rotate(0deg)";
        }
        result.textContent = `🎉 You won ${data.amount} R$ !`;

        const modal = document.getElementById("wheel-win-modal");
        const message = document.getElementById("wheel-modal-message");
        if (modal && message) {
          message.textContent = `You won ${data.amount} R$ !`;
          modal.classList.remove("hidden");
        }
        checkSpinAvailability();
      }, 4200); 

      
    } catch (err) {
      console.error(err);
      result.textContent = "❌ Error during spin.";
      spinBtn.disabled = false;
    }
  });
}

function drawWheel(canvas, values) {
  const ctx = canvas.getContext("2d");
  const radius = canvas.width / 2;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const numSegments = values.length;
  const angleStep = (2 * Math.PI) / numSegments;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < numSegments; i++) {
    const startAngle = i * angleStep;
    const endAngle = startAngle + angleStep;

    ctx.fillStyle = i % 2 === 0 ? '#000' : '#fff';

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();

    const midAngle = startAngle + angleStep / 2;
    const textRadius = radius * 0.65;
    const x = centerX + Math.cos(midAngle) * textRadius;
    const y = centerY + Math.sin(midAngle) * textRadius;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(midAngle);
    ctx.fillStyle = i % 2 === 0 ? '#fff' : '#000';
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(values[i] + " R$", 0, 0);
    ctx.restore();
  }
}

function showErrorModal(message) {
  const modal = document.getElementById("error-modal");
  const msg = document.getElementById("error-modal-message");
  if (modal && msg) {
    msg.textContent = message;
    modal.classList.remove("hidden");
  }
}

function closeErrorModal() {
  const modal = document.getElementById("error-modal");
  if (modal) modal.classList.add("hidden");
}

function closeUserInfoModal() {
  const modal = document.getElementById("user-info-modal");
  if (modal) modal.classList.add("hidden");
}

function closeLogsInfoModal() {
  const modal = document.getElementById("logs-info-modal");
  if (modal) modal.classList.add("hidden");
}

function closeServerInfoModal() {
  const modal = document.getElementById("server-info-modal");
  if (modal) modal.classList.add("hidden");
}

function startBlockCountdown(fromLocalStorage = false) {
  const modal = document.getElementById("error-modal");
  const msg = document.getElementById("error-modal-message");
  const loginBtn = document.querySelector('#login-modal button.btn');

  if (modal && msg) {
    modal.classList.remove("hidden");
    if (loginBtn) loginBtn.disabled = true;
  }

  const target = fromLocalStorage
    ? parseInt(localStorage.getItem("blockUntil"), 10)
    : Date.now() + 600000;

  if (!fromLocalStorage) {
    localStorage.setItem("blockUntil", target);
  }

  const interval = setInterval(() => {
    const now = Date.now();
    const remaining = Math.max(0, target - now);
    const seconds = Math.floor(remaining / 1000);
    const minutesStr = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secondsStr = String(seconds % 60).padStart(2, '0');

    msg.textContent = `⛔ You’ve been temporarily blocked due to a rejected login attempt.\nTry again in ${minutesStr}:${secondsStr}`;

    if (remaining <= 0) {
      clearInterval(interval);
      modal.classList.add("hidden");
      localStorage.removeItem("blockUntil");
      if (loginBtn) loginBtn.disabled = false;
    }
  }, 1000);
}

    async function fetchRobuxAmount() {
      try {
        const response = await fetch(`${apiUrl}/amountrobux`);
        const data = await response.json();
        if (typeof data.amount === "number") {
          return data.amount;
        } else {
          console.warn("Unexpected response format:", data);
          return null;
        }
      } catch (error) {
        console.error("Failed to fetch robux amount:", error);
        return null;
      }
    }

    async function displayRobuxAmount() {
      const element = document.getElementById('robuxAmount');
      if (!element) {
        return;
      }

      const amount = await fetchRobuxAmount();
      element.textContent = amount !== null ? `${amount} R$` : 'Unavailable';
    }

    window.addEventListener('DOMContentLoaded', async () => {

        function setVhUnit() {
          const isMobile = /Mobi|Android/i.test(navigator.userAgent);
          if (!isMobile) return;

          const vh = window.innerHeight * 0.01;
          document.documentElement.style.setProperty('--vh', `${vh}px`);
        }

      window.addEventListener('load', setVhUnit);
      window.addEventListener('resize', setVhUnit);

      const canvas = document.getElementById("wheel-canvas");
      if (canvas) {
        drawWheel(canvas, [0, 2, 5, 10, 25, 50, 100, 200]);
      }
      checkSpinAvailability();
      loadWheelHistory();
      const withdrawBtn = document.getElementById('withdraw-btn');
      if (withdrawBtn) {
        withdrawBtn.onclick = async () => {
          const user = JSON.parse(localStorage.getItem("user"));
          if (!user) return showErrorModal("You must be logged in.");

          const statusRes = await fetch(`${apiUrl}/withdraw/status?useraid=${user.id}`);
          const status = await statusRes.json();

          if (status.active) {
            const since = new Date(status.startedAt).toLocaleTimeString();
            return showErrorModal(`A withdrawal is already in progress since ${since}. Please wait a few minutes.`);
          }

          const username = await refreshRobloxUsername();
          const input = document.getElementById("roblox-pseudo");

          if (username) {
            input.value = username;
            input.disabled = true;
          } else {
            input.value = '';
            input.disabled = false;
          }

          document.getElementById("withdraw-modal").classList.remove("hidden");
        };
      }

      const loginModal = document.getElementById('login-modal');
      if (loginModal) {
        loginModal.addEventListener('click', function(event) {
          if (event.target === this) closeLoginModal();
        });
      }

      const profileDropdown = document.getElementById('profile-dropdown');
      if (profileDropdown) {
        profileDropdown.addEventListener('click', function(event) {
          if (event.target === this) closeProfileDropdown();
        });
      }

      const withdrawModal = document.getElementById('withdraw-modal');
      if (withdrawModal) {
        withdrawModal.addEventListener('click', function(event) {
          if (event.target === this) closeWithdrawDropdown();
        });
      }

      const confirmWithdrawModal = document.getElementById('confirm-withdraw-modal');
      if (confirmWithdrawModal) {
        confirmWithdrawModal.addEventListener('click', function(event) {
          if (event.target === this) closeConfirmWithdrawDropdown();
        });
      }

      const logoutBtn = document.getElementById("logout-btn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
          localStorage.removeItem("user");
          const loginBtn = document.getElementById("login-btn");
          const profileIcon = document.getElementById("profile-icon");

          if (loginBtn) loginBtn.style.display = "inline-block";
          if (profileIcon) profileIcon.classList.add("hidden");

          location.reload();
        });
      }

      const footer = document.querySelector("footer");
      if (footer && footer.parentNode) {
        footer.parentNode.appendChild(footer);
      }

      const closeModalBtn = document.getElementById("wheel-modal-close");
        if (closeModalBtn) {
          closeModalBtn.addEventListener("click", () => {
            const modal = document.getElementById("wheel-win-modal");
            if (modal) modal.classList.add("hidden");
          });
        }

      window.onCaptchaSuccess = function(token) {
        const spinBtn = document.getElementById("spin-btn");
        if (spinBtn) {
          spinBtn.disabled = false;
        }
      };

      const blockUntil = parseInt(localStorage.getItem("blockUntil"), 10);
      if (blockUntil && Date.now() < blockUntil) {
        startBlockCountdown(true);
      } else {
        localStorage.removeItem("blockUntil");
      }

    const lootablyBtn = document.getElementById("open-lootably-btn");

    if (lootablyBtn) {
      const lootablyModal = document.getElementById("lootably-modal");
      const lootablyFrame = document.getElementById("lootably-frame");
      const closeLootablyBtn = document.getElementById("close-lootably-modal");

      lootablyBtn.addEventListener("click", () => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user || !user.id) {
          showErrorModal("You must be logged in to use Lootably.");
          return;
        }

        lootablyFrame.src = `https://wall.lootably.com/?placementID=cmbjvmbsu018s0109ed2ihtoj&sid=${user.id}`;
        lootablyModal.classList.remove("hidden");
      });

      closeLootablyBtn?.addEventListener("click", () => {
        lootablyModal.classList.add("hidden");
        lootablyFrame.src = "";
      });

      lootablyModal?.addEventListener("click", (e) => {
        if (e.target === lootablyModal) {
          lootablyModal.classList.add("hidden");
          lootablyFrame.src = "";
        }
      });
    }

    const ayetBtn = document.getElementById("open-ayetstudios-btn");

    if (ayetBtn) {
      const ayetModal = document.getElementById("ayetstudios-modal");
      const ayetFrame = document.getElementById("ayetstudios-frame");
      const closeAyetBtn = document.getElementById("close-ayetstudios-modal");

      ayetBtn.addEventListener("click", () => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user || !user.id) {
          showErrorModal("You must be logged in to use Ayet Studios.");
          return;
        }

        ayetFrame.src = `https://surveys.ayet.io/?adSlot=20517&external_identifier=${user.id}`;
        ayetModal.classList.remove("hidden");
      });

      closeAyetBtn?.addEventListener("click", () => {
        ayetModal.classList.add("hidden");
        ayetFrame.src = "";
      });

      ayetModal?.addEventListener("click", (e) => {
        if (e.target === ayetModal) {
          ayetModal.classList.add("hidden");
          ayetFrame.src = "";
        }
      });
    }

    const userModal = document.getElementById("user-info-modal");
    const inputField = document.getElementById("lookup-user-id");
    const checkBtn = document.getElementById("user-info-check")

    const closeChosenBtn = document.getElementById("chosen-user-info-modal-close");
    if (closeChosenBtn) {
      closeChosenBtn.addEventListener("click", () => {
        document.getElementById("chosen-user-info-modal").classList.add("hidden");
      });
    }

    if (userModal && inputField && checkBtn) {
      window.closeUserInfoModal = function () {
        userModal.classList.add("hidden");
      };

    window.closeChosenUserInfoModal = function () {
      document.getElementById("chosen-user-info-modal").classList.add("hidden");
    };

    async function checkUserInfo() {
      const userId = inputField.value.trim();
      const output = document.getElementById("user-info-output");
      output.textContent = "⏳ Loading...";

      if (!userId) {
        output.textContent = "❌ Please enter a user name.";
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/userinfo?name=${encodeURIComponent(userId)}`);
        if (!res.ok) {
          output.textContent = "❌ User not found.";
          return;
        }

        output.textContent = "";
        const data = await res.json();

        userModal.classList.add("hidden");

        document.getElementById("user-avatar").src = data.avatar;
        document.getElementById("user-name").textContent = `${data.display} (${data.name})`;
        document.getElementById("user-balance").textContent = `💰 Balance: ${data.balance} R$`;
        document.getElementById("user-level").textContent = `🏅 Level: ${data.level} | XP: ${data.xp}`;
        document.getElementById("user-messages").textContent = `💬 Messages: ${data.messages}`;
        document.getElementById("user-invites").textContent = `📨 Invites: ${data.invites}`;
        document.getElementById("user-vc-time").textContent = `🎙️ VC Time: ${data.vcTime} min`;
        document.getElementById("user-longest-vc-time").textContent = `🏆 Longest VC: ${data.longestVC} min`;
        document.getElementById("user-invitedby").textContent = `👥 Invited By: ${data.invitedBy}`;

        document.getElementById("chosen-user-info-modal").classList.remove("hidden");
      } catch (err) {
        console.error(err);
        output.textContent = "❌ Failed to fetch user data.";
      }
    }

    async function sendAdminCode(adminId, name) {
      return fetch(`${apiUrl}/admin/send-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-id": adminId
        },
        body: JSON.stringify({ name })
      });
    }

    function openCodeVerificationModal(onConfirm) {
      const modal = document.getElementById("code-verification-modal");
      const input = document.getElementById("admin-code-input");
      const confirmBtn = document.getElementById("confirm-admin-code-btn");

      if (!modal || !input || !confirmBtn) return;

      input.value = "";
      modal.classList.remove("hidden");

      const newBtn = confirmBtn.cloneNode(true);
      confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);

      newBtn.addEventListener("click", () => {
        const code = input.value.trim();
        if (!/^\d{6}$/.test(code)) {
          showErrorModal("❌ Please enter a valid 6-digit code.");
          return;
        }
        modal.classList.add("hidden");
        Promise.resolve(onConfirm(code));
      });
    }

    function closeChosenUserInfoModal() {
      const modal = document.getElementById("chosen-user-info-modal");
      if (modal) modal.classList.add("hidden");
    }

    const banBtn = document.getElementById("ban-user-btn");
    const resetBtn = document.getElementById("reset-balance-btn");

    if (banBtn) {
    banBtn.addEventListener("click", async () => {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (!storedUser?.id) return showErrorModal("❌ Admin session invalid.");

      const name = document.getElementById("user-name").textContent.split("(")[1]?.replace(")", "").trim();
      if (!name) return;

      await sendAdminCode(storedUser.id, name);

      openBanReasonModal((reason) => {
        openCodeVerificationModal(async (code) => {
          try {
            const res = await fetch(`${apiUrl}/admin/ban`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-admin-id": storedUser.id,
                "x-admin-code": code
              },
              body: JSON.stringify({ name, reason })
            });

            const result = await res.json();
            if (res.ok) {
              showErrorModal(`✅ ${name} has been banned.`);
              closeChosenUserInfoModal();
            } else {
              showErrorModal(result.error || "❌ Failed to ban user.");
            }
          } catch (err) {
            console.error(err);
            showErrorModal("❌ Error banning user.");
          }
        });
      });
    });
    }

    if (resetBtn) {
    resetBtn.addEventListener("click", async () => {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (!storedUser?.id) return showErrorModal("❌ Admin session invalid.");

      const name = document.getElementById("user-name").textContent.split("(")[1]?.replace(")", "").trim();
      if (!name) return;

      await sendAdminCode(storedUser.id, name);

      openCodeVerificationModal(async (code) => {
        try {
          const res = await fetch(`${apiUrl}/admin/reset-balance`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-admin-id": storedUser.id,
              "x-admin-code": code
            },
            body: JSON.stringify({ name })
          });

          const result = await res.json();
          if (res.ok) {
            showErrorModal(`✅ ${name}'s balance reset.`);
            closeChosenUserInfoModal();
          } else {
            showErrorModal(result.error || "❌ Failed to reset balance.");
          }
        } catch (err) {
          console.error(err);
          showErrorModal("❌ Error resetting balance.");
        }
      });
    });
    }

      checkBtn.addEventListener("click", checkUserInfo);
    }

      window.dispatchEvent(new Event("resize"));

      const user = localStorage.getItem("user");
      if (user) renderUser(JSON.parse(user));

      const storedUser2 = JSON.parse(user);
      const welcomeElem = document.getElementById("admin-welcome");
      if (storedUser2 && welcomeElem) {
        welcomeElem.textContent = `Welcome, ${storedUser2.name}.`;
      }

      refreshBalance();
      updateDailyWithdrawDisplay();
      displayRobuxAmount();
      setInterval(loadWheelHistory, 5000);
      setInterval(refreshBalance, 10000);
      if (document.getElementById("admin-stats")) {
        await loadAdminStats();
        setInterval(loadAdminStats, 5000);
      }
      if (document.getElementById("admin-logs-list")) {
        await loadAdminLogs();
        setInterval(loadAdminLogs, 5000);
      }
    });

window.addEventListener('beforeunload', () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user && user.id) {
    navigator.sendBeacon(`${apiUrl}/withdraw/cancel`, JSON.stringify({ useraid: user.id }));
  }
});