const loadUsersButton = document.getElementById("load-users");
const filterInput = document.getElementById("filter-input");
const statusMessage = document.getElementById("status");
const usersList = document.getElementById("users-list");

const USERS_URL = "https://jsonplaceholder.typicode.com/users";

let users = [];

async function loadUsers() {
  loadUsersButton.disabled = true;
  statusMessage.textContent = "Loading users...";
  usersList.replaceChildren();

  try {
    const response = await fetch(USERS_URL);

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    users = await response.json();

    renderUsers(getFilteredUsers());

    if (users.length === 0) {
      statusMessage.textContent = "No users were returned.";
    } else if (getFilteredUsers().length === 0) {
      statusMessage.textContent = "No users match your filter.";
    } else {
      statusMessage.textContent =
        `Loaded ${users.length} users successfully.`;
    }
  } catch (error) {
    users = [];
    usersList.replaceChildren();

    statusMessage.textContent =
      "Could not load users. Check your connection and try again.";

    console.error("Error loading users:", error);
  } finally {
    loadUsersButton.disabled = false;
  }
}

function renderUsers(list) {
  usersList.replaceChildren();

  if (list.length === 0) {
    statusMessage.textContent = "No users match your filter.";
    return;
  }

  list.forEach((user) => {
    const item = document.createElement("li");
    const name = document.createElement("h2");
    const email = document.createElement("p");
    const city = document.createElement("p");
    const company = document.createElement("p");

    name.textContent = user.name;
    email.textContent = `Email: ${user.email}`;
    city.textContent = `City: ${user.address.city}`;
    company.textContent = `Company: ${user.company.name}`;

    item.append(name, email, city, company);
    usersList.appendChild(item);
  });
}

function getFilteredUsers() {
  const searchText = filterInput.value.trim().toLowerCase();

  return users.filter((user) =>
    user.name.toLowerCase().includes(searchText)
  );
}

loadUsersButton.addEventListener("click", loadUsers);

filterInput.addEventListener("input", () => {
  if (users.length === 0) {
    return;
  }

  const filteredUsers = getFilteredUsers();
  renderUsers(filteredUsers);

  if (filteredUsers.length === 0) {
    statusMessage.textContent = "No users match your filter.";
  } else {
    statusMessage.textContent =
      `Showing ${filteredUsers.length} of ${users.length} users.`;
  }
});