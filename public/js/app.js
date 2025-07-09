document.addEventListener('DOMContentLoaded', () => {
    const isEditPage = window.location.pathname.includes('edit');
    const form = document.getElementById('productForm');
    const tableBody = document.querySelector('tbody');
    const editForm = document.getElementById('editForm');

    if (tableBody) loadProducts(tableBody, isEditPage);

    if (form) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            const name = document.getElementById('productName').value.trim();
            const category = document.getElementById('category').value;
            const quantity = parseInt(document.getElementById('quantity').value);
            const status = document.getElementById('status').value;
            const provider = document.getElementById('provider').value.trim();
            const date = new Date().toLocaleDateString();

            if (!name || !category || quantity < 1 || !status || !provider) {
                showToast('⚠️ ¡Por favor completa todos los campos!');
                return;
            }

            let products = JSON.parse(localStorage.getItem('products')) || [];
            products.push({ name, category, quantity, status, provider, date });
            localStorage.setItem('products', JSON.stringify(products));

            showOverlay(`✅ Producto "${name}" agregado con éxito`);
            form.reset();
            loadProducts(tableBody, isEditPage);
        });
    }

    if (isEditPage && tableBody) {
        tableBody.addEventListener('click', e => {
            if (e.target.classList.contains('btn-delete')) {
                if (confirm('¿Seguro que quieres eliminar este producto?')) {
                    let tr = e.target.closest('tr');
                    let name = tr.children[0].innerText;
                    let products = JSON.parse(localStorage.getItem('products')) || [];
                    products = products.filter(p => p.name !== name);
                    localStorage.setItem('products', JSON.stringify(products));
                    tr.classList.add('tr-fade-out');
                    setTimeout(() => {
                        tr.remove();
                        showToast(`🗑️ Producto "${name}" eliminado`);
                    }, 400);
                }
            }

            if (e.target.classList.contains('btn-edit-prod')) {
                let tr = e.target.closest('tr');
                let name = tr.children[0].innerText;
                let products = JSON.parse(localStorage.getItem('products')) || [];
                let index = products.findIndex(p => p.name === name);
                if (index === -1) return;
                const product = products[index];
                document.getElementById('editIndex').value = index;
                document.getElementById('editName').value = product.name;
                document.getElementById('editCategory').value = product.category;
                document.getElementById('editQuantity').value = product.quantity;
                document.getElementById('editStatus').value = product.status;
                document.getElementById('editProvider').value = product.provider;
                let editModal = new bootstrap.Modal(document.getElementById('editModal'));
                editModal.show();
            }
        });

        if (editForm) {
            editForm.addEventListener('submit', e => {
                e.preventDefault();
                let index = parseInt(document.getElementById('editIndex').value);
                let products = JSON.parse(localStorage.getItem('products')) || [];

                products[index] = {
                    name: document.getElementById('editName').value.trim(),
                    category: document.getElementById('editCategory').value.trim(),
                    quantity: parseInt(document.getElementById('editQuantity').value),
                    status: document.getElementById('editStatus').value.trim(),
                    provider: document.getElementById('editProvider').value.trim(),
                    date: products[index].date
                };

                localStorage.setItem('products', JSON.stringify(products));
                let modal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
                modal.hide();
                loadProducts(tableBody, true);
                highlightEditedRow(index);
                showToast(`✏️ Producto "${products[index].name}" actualizado`);
            });
        }
    }

    function loadProducts(tableBody, showActions = false) {
        tableBody.innerHTML = '';
        const products = JSON.parse(localStorage.getItem('products')) || [];

        products.forEach(prod => {
            const row = document.createElement('tr');
            row.classList.add('fade-in-row');
            row.innerHTML = `
                <td>${prod.name}</td>
                <td>${prod.category}</td>
                <td>${prod.quantity}</td>
                <td>${prod.status || ''}</td>
                <td>${prod.provider || ''}</td>
                <td>${prod.date || ''}</td>
                ${showActions ? `
                    <td>
                        <button class="btn btn-sm btn-edit me-1 btn-edit-prod">Editar</button>
                        <button class="btn btn-sm btn-delete">Eliminar</button>
                    </td>
                ` : ''}
            `;
            tableBody.appendChild(row);
        });
    }

    function highlightEditedRow(index) {
        let rows = document.querySelectorAll('tbody tr');
        if (rows[index]) {
            rows[index].classList.add('row-edited');
            setTimeout(() => {
                rows[index].classList.remove('row-edited');
            }, 1000);
        }
    }
});
function showOverlay(message) {
    let overlay = document.createElement('div');
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
