/* ---------- utilidades globales ---------- */
function showOverlay(message) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay-success';
  overlay.innerHTML = `<h2>${message}</h2>`;
  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('show'), 50);
  setTimeout(() => {
    overlay.classList.remove('show');
    setTimeout(() => overlay.remove(), 500);
  }, 3000);
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast-custom';
  toast.innerText = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 600);
  }, 3000);
}

/* ---------- lógica principal ---------- */
document.addEventListener('DOMContentLoaded', () => {

  // Mostrar toast si viene error por acceso denegado
  const params = new URLSearchParams(window.location.search);
  if (params.get('error') === 'acceso_denegado') {
    showToast('❌ Acceso denegado');
    // Limpiar la query para no mostrarlo otra vez si recarga
    window.history.replaceState({}, document.title, window.location.pathname);
  }


  /* ----- PRODUCTOS (add / edit) ----- */
  const isEditPage = window.location.pathname.includes('edit');
  const productForm  = document.getElementById('productForm');
  const editForm     = document.getElementById('editForm');
  const tableBody    = document.querySelector('tbody');

  if (tableBody) loadProducts();

  /* Añadir producto */
  if (productForm) {
    productForm.addEventListener('submit', async e => {
      e.preventDefault();
      const name      = document.getElementById('productName').value.trim();
      const category  = document.getElementById('category').value;
      const quantity  = parseInt(document.getElementById('quantity').value, 10);
      const status    = document.getElementById('status').value;
      const provider  = document.getElementById('provider').value.trim();

      if (!name || !category || quantity < 1 || !status || !provider) {
        showToast('⚠️ ¡Por favor completa todos los campos!');
        return;
      }

      try {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, category, quantity, status, provider })
        });
        if (!res.ok) throw new Error();
        showOverlay(`✅ Producto "${name}" agregado con éxito`);
        productForm.reset();
        if (tableBody) loadProducts();
      } catch {
        showToast('❌ Error al agregar producto');
      }
    });
  }

  /* Tabla de edición/eliminación */
  if (isEditPage && tableBody) {
    tableBody.addEventListener('click', async e => {
      /* Eliminar */
      if (e.target.classList.contains('btn-delete')) {
        if (!confirm('¿Seguro que quieres eliminar este producto?')) return;
        const tr = e.target.closest('tr');
        const id = tr.dataset.id;
        try {
          const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error();
          tr.remove();
          showToast('🗑️ Producto eliminado');
        } catch {
          showToast('❌ Error al eliminar producto');
        }
      }

      /* Abrir modal de edición */
        if (e.target.classList.contains('btn-edit-prod')) {
          const tr = e.target.closest('tr');
          const id = tr?.dataset?.id;

          console.log('ID del producto:', id);

          try {
            const res = await fetch(`/api/products/${id}`);
            if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

            const prod = await res.json();

            if (!prod) throw new Error('Producto no encontrado');

            document.getElementById('editIndex').value     = id;
            document.getElementById('editName').value       = prod.name || '';
            document.getElementById('editCategory').value   = prod.category || '';
            document.getElementById('editQuantity').value   = prod.quantity || '';
            document.getElementById('editStatus').value     = prod.status || '';
            document.getElementById('editProvider').value   = prod.provider || '';

            new bootstrap.Modal(document.getElementById('editModal')).show();
          } catch (err) {
            console.error('❌ Error al cargar producto:', err);
            showToast('❌ Error al cargar datos del producto');
          }
        }
    });

    /* Guardar edición */
    if (editForm) {
      editForm.addEventListener('submit', async e => {
        e.preventDefault();
        const id = document.getElementById('editIndex').value;
        const updated = {
          name     : document.getElementById('editName').value.trim(),
          category : document.getElementById('editCategory').value,
          quantity : parseInt(document.getElementById('editQuantity').value, 10),
          status   : document.getElementById('editStatus').value,
          provider : document.getElementById('editProvider').value.trim()
        };
        try {
          const res = await fetch(`/api/products/${id}`, {
            method : 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body   : JSON.stringify(updated)
          });
          if (!res.ok) throw new Error();
          bootstrap.Modal.getInstance('#editModal').hide();
          loadProducts();
          showToast(`✏️ Producto "${updated.name}" actualizado`);
        } catch {
          showToast('❌ Error al actualizar producto');
        }
      });
    }
  }

  async function loadProducts() {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error();
      const products = await res.json();
      tableBody.innerHTML = '';
      products.forEach(p => {
        const row = document.createElement('tr');
        row.dataset.id = p._id;
        row.innerHTML = `
          <td>${p.name}</td>
          <td>${p.category}</td>
          <td>${p.quantity}</td>
          <td>${p.status}</td>
          <td>${p.provider}</td>
          <td>${new Date(p.date).toLocaleDateString()}</td>
          ${isEditPage ? `
            <td>
              <button class="btn btn-sm btn-edit me-1 btn-edit-prod">Editar</button>
              <button class="btn btn-sm btn-delete">Eliminar</button>
            </td>` : ''}
        `;
        tableBody.appendChild(row);
      });
    } catch {
      showToast('❌ Error cargando productos');
    }
  }

  /* ----- REGISTRO ----- */
const registerForm = document.getElementById('registerForm');

async function checkUserRole() {
  try {
    const res = await fetch('/api/auth/user', { credentials: 'include' })
    if (!res.ok) throw new Error('No autorizado');
    const data = await res.json();

    if (data.role !== 'admin') {
      // Ocultar formulario o mostrar mensaje
      if (registerForm) {
        registerForm.innerHTML = '<p>❌ No tienes permiso para registrar usuarios.</p>';
      }
      return false;
    }
    return true;
  } catch {
    if (registerForm) {
      registerForm.innerHTML = '<p>❌ Debes iniciar sesión para registrar usuarios.</p>';
    }
    return false;
  }
}

if (registerForm) {
  checkUserRole().then(canRegister => {
    if (!canRegister) return;

    registerForm.addEventListener('submit', async e => {
      e.preventDefault();
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;
      const role     = document.getElementById('role').value;

      if (!username || !password || !role) {
        showToast('⚠️ Completa todos los campos.');
        return;
      }

      try {
        const res = await fetch('/api/auth/register', {
          method : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body   : JSON.stringify({ username, password, role })
        });
        const data = await res.json();
        if (res.ok) {
          showToast('✅ Usuario registrado');
          registerForm.reset();
          setTimeout(() => window.location.href = '/login', 1200);
        } else {
          showToast(data.error || data.errors?.[0]?.msg || 'Error al registrar');
        }
      } catch (err) {
        console.error(err);
        showToast('❌ Error de conexión');
      }
    });
  });
}

/* ----- LOGIN ----- */
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        // Guardar token en cookie para que el backend lo reciba
        document.cookie = `token=${data.token}; path=/; max-age=3600`;

        // Opcional: guardar en localStorage si lo usas en el frontend
        localStorage.setItem('username', data.username);
        localStorage.setItem('role', data.role);

        showToast(data.message || 'Inicio de sesión exitoso');
        setTimeout(() => window.location.href = '/', 1200);
      } else {
        showToast(data.error || 'Credenciales inválidas');
      }
    } catch (err) {
      console.error(err);
      showToast('❌ Error de conexión');
    }
  });
}

  /* ----- BARRA DE BIENVENIDA + LOGOUT ----- */
  const logoutBtn   = document.getElementById('logoutBtn');
  const welcomeUser = document.getElementById('welcomeUser');
  const tokenLS     = localStorage.getItem('token');
  const userLS      = localStorage.getItem('username');

  if (logoutBtn && welcomeUser) {
    if (tokenLS && userLS) {
      logoutBtn.style.display  = 'inline-block';
      welcomeUser.textContent  = `Hola, ${userLS}`;
    } else {
      logoutBtn.style.display  = 'none';
      welcomeUser.textContent  = '';
    }

    logoutBtn.addEventListener('click', async () => {
      // Limpiar localStorage primero
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('role');

      // Llamar al backend para destruir la sesión y limpiar la cookie
      try {
        await fetch('/logout', { method: 'GET', credentials: 'include' });
      } catch (err) {
        console.error('❌ Error al cerrar sesión en el servidor', err);
      }

      // Redirigir
      window.location.href = '/';
    });
  }
});
