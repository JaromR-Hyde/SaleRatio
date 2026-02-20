let profileData = [];

// Load JSON file
fetch('profiles.json')
  .then(response => response.json())
  .then(data => {
    profileData = data.profiles;
    populateMainDropdown();
  });

// Populate main dropdown
function populateMainDropdown() {
  const mainSelect = document.getElementById('mainProfile');

  // Default option
  mainSelect.innerHTML = `<option value="">Select Profile</option>`;

  profileData.forEach(profile => {
    const option = document.createElement('option');
    option.value = profile.code;
    option.textContent = `${profile.code} - ${profile.label}`;
    mainSelect.appendChild(option);
  });

  mainSelect.addEventListener('change', updateSubDropdown);
}

// Update sub dropdown based on main selection
function updateSubDropdown() {
  const mainSelect = document.getElementById('mainProfile');
  const subSelect = document.getElementById('subProfile');

  const selectedCode = mainSelect.value;

  // Clear previous subtypes
  subSelect.innerHTML = "";

  if (!selectedCode) {
    subSelect.disabled = true;
    return;
  }

  const selectedProfile = profileData.find(p => p.code === selectedCode);

  // If no subtypes, disable dropdown
  if (!selectedProfile.subtypes || selectedProfile.subtypes.length === 0) {
    subSelect.disabled = true;
    return;
  }

  // Enable dropdown
  subSelect.disabled = false;

  // Default option
  const defaultOption = document.createElement('option');
  defaultOption.value = "";
  defaultOption.textContent = "Select Sub Profile";
  subSelect.appendChild(defaultOption);

  // Add subtypes
  selectedProfile.subtypes.forEach(sub => {
    const option = document.createElement('option');
    option.value = sub.toLowerCase().replace(/\s+/g, '');
    option.textContent = sub;
    subSelect.appendChild(option);
  });
}
