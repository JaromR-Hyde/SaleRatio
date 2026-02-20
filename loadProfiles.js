fetch('profiles.txt')
  .then(response => response.text())
  .then(text => {
    const select = document.getElementById('profile');

    // Default option
    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = "Select Profile";
    select.appendChild(defaultOption);

    // Split text file into lines
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);

    lines.forEach(profile => {
      const option = document.createElement('option');
      option.value = profile.toLowerCase().replace(/\s+/g, '');
      option.textContent = profile;
      select.appendChild(option);
    });
  });
