let billItems = [];
let people = [];
let selectedFile = null;

const fileInput = document.getElementById('fileInput');
const chooseImageBtn = document.getElementById('chooseImageBtn');
const uploadArea = document.getElementById('upload-area');
const imagePreview = document.getElementById('image-preview');
const previewImg = document.getElementById('preview-img');
const extractBtn = document.getElementById('extractBtn');
const uploadSection = document.getElementById('upload-section');
const billSection = document.getElementById('bill-section');
const itemsList = document.getElementById('items-list');
const addItemBtn = document.getElementById('addItemBtn');
const peopleSection = document.getElementById('people-section');
const newPersonName = document.getElementById('newPersonName');
const addPersonBtn = document.getElementById('addPersonBtn');
const peopleList = document.getElementById('people-list');
const summarySection = document.getElementById('summary-section');
const summaryCards = document.getElementById('summary-cards');
const totalBill = document.getElementById('total-bill');
const resetBtn = document.getElementById('resetBtn');

// Image upload
chooseImageBtn.onclick = () => fileInput.click();
uploadArea.onclick = () => fileInput.click();

fileInput.onchange = (e) => {
  const file = e.target.files[0];
  if (file) {
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (ev) => {
      previewImg.src = ev.target.result;
      imagePreview.style.display = '';
    };
    reader.readAsDataURL(file);
  }
};

// Extract bill items from backend
extractBtn.onclick = async () => {
  if (!selectedFile) return;
  extractBtn.disabled = true;
  extractBtn.textContent = 'Processing...';
  const formData = new FormData();
  formData.append('image', selectedFile);
  try {
    const res = await fetch('/api/extract-bill', { method: 'POST', body: formData });
    const data = await res.json();
    billItems = Array.isArray(data.items)
      ? data.items.map((item, i) => ({
          id: `item-${i}`,
          name: item.name,
          price: item.price,
          assignedTo: []
        }))
      : [];
    if (people.length === 0) {
      people = [
        { id: 'person-1', name: 'Person 1' },
        { id: 'person-2', name: 'Person 2' }
      ];
    }
    showBillSection();
  } catch (e) {
    alert('Error processing bill');
  }
  extractBtn.disabled = false;
  extractBtn.textContent = 'Extract Items';
};

function showBillSection() {
  uploadSection.style.display = 'none';
  billSection.style.display = '';
  peopleSection.style.display = '';
  summarySection.style.display = '';
  renderItems();
  renderPeople();
  renderSummary();
}

function renderItems() {
  itemsList.innerHTML = '';
  billItems.forEach(item => {
    const div = document.createElement('div');
    div.className = 'item-card';
    div.innerHTML = `
      <div class="item-info">
        <input class="item-name" value="${item.name}" data-id="${item.id}">
        <input class="item-price" type="number" step="0.01" value="${item.price !== null ? item.price : ''}" data-id="${item.id}">
      </div>
      <div class="assignment-section">
        <p>Assigned to:</p>
        <div class="person-chips" id="chips-${item.id}"></div>
        <select class="person-select" data-id="${item.id}">
          <option value="">Add person...</option>
          ${people.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
        </select>
      </div>
    `;
    itemsList.appendChild(div);

    // Name and price editing
    div.querySelector('.item-name').oninput = (e) => {
      item.name = e.target.value;
      renderSummary();
    };
    div.querySelector('.item-price').oninput = (e) => {
      item.price = parseFloat(e.target.value) || null;
      renderSummary();
    };

    // Assign person
    div.querySelector('.person-select').onchange = (e) => {
      const personId = e.target.value;
      if (personId && !item.assignedTo.includes(personId)) {
        item.assignedTo.push(personId);
        renderItems();
        renderSummary();
      }
      e.target.value = '';
    };

    // Render chips
    renderChips(item);
  });
}

function renderChips(item) {
  const chipsDiv = document.getElementById(`chips-${item.id}`);
  chipsDiv.innerHTML = '';
  item.assignedTo.forEach(pid => {
    const span = document.createElement('span');
    span.className = 'person-chip';
    span.textContent = getPersonName(pid) + ' ×';
    span.onclick = () => {
      item.assignedTo = item.assignedTo.filter(id => id !== pid);
      renderItems();
      renderSummary();
    };
    chipsDiv.appendChild(span);
  });
}

addItemBtn.onclick = () => {
  billItems.push({
    id: `item-${Date.now()}`,
    name: '',
    price: null,
    assignedTo: []
  });
  renderItems();
  renderSummary();
};

function renderPeople() {
  peopleList.innerHTML = '';
  people.forEach(person => {
    const div = document.createElement('div');
    div.className = 'person-item';
    div.innerHTML = `
      <span>${person.name}</span>
      <button class="btn-danger">Remove</button>
    `;
    div.querySelector('button').onclick = () => {
      people = people.filter(p => p.id !== person.id);
      billItems.forEach(item => {
        item.assignedTo = item.assignedTo.filter(id => id !== person.id);
      });
      renderItems();
      renderPeople();
      renderSummary();
    };
    peopleList.appendChild(div);
  });
}

addPersonBtn.onclick = () => {
  const name = newPersonName.value.trim();
  if (name) {
    people.push({ id: `person-${Date.now()}`, name });
    newPersonName.value = '';
    renderPeople();
    renderItems();
    renderSummary();
  }
};

newPersonName.onkeyup = (e) => {
  if (e.key === 'Enter') addPersonBtn.onclick();
};

function getPersonName(personId) {
  const p = people.find(p => p.id === personId);
  return p ? p.name : '';
}

function calculatePersonTotal(personId) {
  let total = 0;
  billItems.forEach(item => {
    if (item.assignedTo.includes(personId) && typeof item.price === 'number' && item.assignedTo.length) {
      total += item.price / item.assignedTo.length;
    }
  });
  return total;
}

// Add this at the beginning of your JavaScript file
document.addEventListener('DOMContentLoaded', function() {
  // Dark mode toggle
  const darkModeToggle = document.getElementById('dark-mode');
  
  // Check for saved theme preference or prefer-color-scheme
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('theme');
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.body.setAttribute('data-theme', 'dark');
    darkModeToggle.checked = true;
  }
  
  // Toggle theme
  darkModeToggle.addEventListener('change', () => {
    if (darkModeToggle.checked) {
      document.body.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  });
});

function getTotalBill() {
  return billItems.reduce((total, item) => total + (typeof item.price === 'number' ? item.price : 0), 0);
}

function renderSummary() {
  summaryCards.innerHTML = '';
  people.forEach(person => {
    const div = document.createElement('div');
    div.className = 'summary-card';
    div.innerHTML = `
      <h4>${person.name}</h4>
      <p class="amount">Rs ${calculatePersonTotal(person.id).toFixed(2)}</p>
    `;
    summaryCards.appendChild(div);
  });
  totalBill.textContent = getTotalBill().toFixed(2);
}

resetBtn.onclick = () => {
  billItems = [];
  people = [];
  selectedFile = null;
  fileInput.value = '';
  previewImg.src = '';
  imagePreview.style.display = 'none';
  uploadSection.style.display = '';
  billSection.style.display = 'none';
  peopleSection.style.display = 'none';
  summarySection.style.display = 'none';
};