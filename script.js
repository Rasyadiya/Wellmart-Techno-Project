// --- LOGIKA MEMBERSHIP & STATE ---
const ustadzMembers = ["Ustadz Arif Rosadi", "Ustadz Ja'far Rais", "Ustadz Ahmad", "Ustadz Budi", "Ustadz Hasan"];
let currentUser = ""; 
let tempProduct = null; 
let keranjang = []; // Array untuk menyimpan daftar belanjaan
let totalBelanjaKeranjang = 0;

let produkCMS = JSON.parse(localStorage.getItem('produkWelfmart')) || [
    { nama: "Nasi Uduk Spesial", harga: 12000 },
    { nama: "Air Mineral", harga: 4000 }
];

// FUNGSI NAVIGASI UMUM & MODAL
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    
    document.getElementById('loginStatus').innerText = '';
    if (pageId === 'dashboard') renderProdukUser();
    if (pageId === 'admin') renderProdukAdmin();
    if (pageId === 'transaction') renderKeranjang(); // Load keranjang saat buka kasir
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function showAnimatedPopup(title, message, icon = "✅") {
    document.getElementById('notifTitle').innerText = title;
    document.getElementById('notifMessage').innerText = message;
    document.getElementById('notifIcon').innerText = icon;
    document.getElementById('modalNotif').style.display = 'flex';
}

// 1. LOGIN SYSTEM & ENTER KEY EVENT
function login() {
    const inputNama = document.getElementById('username').value.trim();
    if (inputNama.toLowerCase() === 'admin') {
        currentUser = "Admin";
        document.getElementById('navAdmin').style.display = 'inline-block';
        document.getElementById('navAuth').style.display = 'none';
        document.getElementById('navLogout').style.display = 'inline-block';
        showPage('admin');
    } else if (inputNama) {
        currentUser = inputNama;
        document.getElementById('navDashboard').style.display = 'inline-block';
        document.getElementById('navTransaction').style.display = 'inline-block';
        document.getElementById('navAuth').style.display = 'none';
        document.getElementById('navLogout').style.display = 'inline-block';
        showPage('dashboard');
    } else {
        alert("Nama tidak boleh kosong!");
    }
}

// Fitur Tekan Enter saat Login
document.getElementById("username").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault(); // Mencegah reload halaman
        login();
    }
});

function logout() {
    currentUser = "";
    document.getElementById('username').value = "";
    kosongkanKeranjang();
    document.getElementById('strukTransaksi').style.display = 'none';
    
    document.getElementById('navAdmin').style.display = 'none';
    document.getElementById('navDashboard').style.display = 'none';
    document.getElementById('navTransaction').style.display = 'none';
    document.getElementById('navLogout').style.display = 'none';
    document.getElementById('navAuth').style.display = 'inline-block';
    showPage('landing');
}

// 2. READ: KATALOG & MODAL QUANTITY
function renderProdukUser() {
    const container = document.getElementById('product-list');
    container.innerHTML = '';
    
    produkCMS.forEach(item => {
        container.innerHTML += `
            <div class="product-card">
                <h3>${item.nama}</h3>
                <p style="margin-bottom: 10px; font-weight: bold; color: #555;">Rp ${item.harga.toLocaleString('id-ID')}</p>
                <button onclick="bukaModalQuantity('${item.nama}', ${item.harga})" class="btn-yellow" style="padding:8px;">+ Keranjang</button>
            </div>
        `;
    });
}

function bukaModalQuantity(nama, harga) {
    tempProduct = { nama, harga }; 
    document.getElementById('modalProductName').innerText = nama;
    document.getElementById('modalProductPrice').innerText = harga.toLocaleString('id-ID');
    document.getElementById('inputQty').value = 1; 
    document.getElementById('modalQuantity').style.display = 'flex';
}

function konfirmasiTambah() {
    let qty = parseInt(document.getElementById('inputQty').value);
    if (qty < 1 || isNaN(qty)) return alert("Jumlah minimal adalah 1!");
    
    // Cek apakah barang sudah ada di keranjang, jika ada tambahkan qty nya
    let existingItem = keranjang.find(item => item.nama === tempProduct.nama);
    if (existingItem) {
        existingItem.qty += qty;
        existingItem.subtotal = existingItem.qty * existingItem.harga;
    } else {
        // Jika belum ada, masukkan sebagai item baru
        keranjang.push({
            nama: tempProduct.nama,
            harga: tempProduct.harga,
            qty: qty,
            subtotal: tempProduct.harga * qty
        });
    }
    
    closeModal('modalQuantity');
    showAnimatedPopup("Berhasil!", `${qty}x ${tempProduct.nama} ditambahkan ke keranjang.`, "🛒");
}

// 3. LOGIKA KERANJANG & KASIR
function renderKeranjang() {
    const tbody = document.getElementById('tabelKeranjang');
    tbody.innerHTML = '';
    totalBelanjaKeranjang = 0;

    if (keranjang.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:red;">Keranjang Kosong</td></tr>';
    } else {
        keranjang.forEach(item => {
            totalBelanjaKeranjang += item.subtotal;
            tbody.innerHTML += `
                <tr>
                    <td>${item.nama}</td>
                    <td>x${item.qty}</td>
                    <td>Rp ${item.subtotal.toLocaleString('id-ID')}</td>
                </tr>
            `;
        });
    }
    
    // Update tampilan text total
    document.getElementById('textTotalBelanja').innerText = totalBelanjaKeranjang.toLocaleString('id-ID');
}

function kosongkanKeranjang() {
    keranjang = [];
    document.getElementById('strukTransaksi').style.display = 'none';
    renderKeranjang();
}

function prosesTransaksi() {
    if (keranjang.length === 0) return alert("Keranjang kosong! Silakan tambah produk dari katalog.");

    let isJamPadat = document.getElementById('isJamPadat').checked;
    let metodePengambilan = document.querySelector('input[name="metodeAmbil"]:checked').value; 
    
    let totalAkhir = totalBelanjaKeranjang;
    let diskon = 0;
    let biayaAntrean = 0;

    // Diskon 20% Membership Ustadz
    if (ustadzMembers.includes(currentUser)) {
        diskon = totalAkhir * 0.20;
        totalAkhir -= diskon;
    }

    // Biaya Antrean Jam Padat
    if (isJamPadat) {
        biayaAntrean = 2000;
        totalAkhir += biayaAntrean;
    }

    // Buat List Item untuk di Struk
    let listBeliStruk = keranjang.map(item => `- ${item.nama} (x${item.qty}) = Rp ${item.subtotal.toLocaleString('id-ID')}`).join('<br>');

    // Cetak Struk
    let strukHTML = `
        <p><strong>Pembeli:</strong> ${currentUser}</p>
        <p><strong>Pesanan:</strong><br> ${listBeliStruk}</p>
        <hr style="margin: 10px 0; border: 1px dashed var(--blue);">
        <p><strong>Subtotal:</strong> Rp ${totalBelanjaKeranjang.toLocaleString('id-ID')}</p>
        <p><strong>Diskon Member:</strong> - Rp ${diskon.toLocaleString('id-ID')}</p>
        <p><strong>Biaya Layanan/Antrean:</strong> + Rp ${biayaAntrean.toLocaleString('id-ID')}</p>
        <hr style="margin: 10px 0; border: 2px solid var(--blue);">
        <p style="font-size: 1.2rem; color: var(--blue);"><strong>TOTAL BAYAR: Rp ${totalAkhir.toLocaleString('id-ID')}</strong></p>
    `;
    document.getElementById('strukDetail').innerHTML = strukHTML;
    document.getElementById('strukTransaksi').style.display = 'block';

    // TRIGGER POP-UP ANIMASI PENGAMBILAN
    if (metodePengambilan === 'ambil') {
        showAnimatedPopup("Berhasil!", "Pesanan tercatat, silahkan ambil di tempat.", "🏪");
        setTimeout(() => {
            showAnimatedPopup("Pesanan Siap!", "Pesanan Anda sudah siap untuk diambil di kasir saat ini juga!", "🛍️");
            kosongkanKeranjang(); // Reset keranjang setelah selesai transaksi
        }, 5000);
    } else if (metodePengambilan === 'kirim') {
        showAnimatedPopup("Diproses!", "Pesanan sedang disiapkan, mohon tunggu kurir kami.", "🛵");
        setTimeout(() => {
            showAnimatedPopup("Sedang Diantar!", "Pesanan Anda sudah di jalan dan sedang diantar oleh kurir.", "🚚");
            kosongkanKeranjang(); 
        }, 5000);
    }
}

// 4. CMS ADMIN CRUD
function renderProdukAdmin() {
    const tbody = document.getElementById('adminProductList');
    tbody.innerHTML = '';
    produkCMS.forEach((item, index) => {
        tbody.innerHTML += `
            <tr>
                <td>${item.nama}</td>
                <td>Rp ${item.harga.toLocaleString('id-ID')}</td>
                <td>
                    <button onclick="siapkanEdit(${index})" style="background: var(--yellow); color: var(--blue); font-weight: bold; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;">Edit</button>
                    <button onclick="hapusProduk(${index})" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Hapus</button>
                </td>
            </tr>
        `;
    });
}

function simpanProduk() {
    const nama = document.getElementById('namaProduk').value;
    const harga = parseInt(document.getElementById('hargaProduk').value);
    const editIndex = document.getElementById('editIndex').value;
    const status = document.getElementById('adminStatus');
    
    if (nama && harga) {
        if (editIndex === "-1") {
            produkCMS.push({ nama, harga });
            status.innerText = "Produk berhasil ditambahkan!";
        } else {
            produkCMS[editIndex] = { nama, harga };
            status.innerText = "Produk berhasil diperbarui!";
            document.getElementById('editIndex').value = "-1"; 
            document.getElementById('btnSimpanProduk').innerText = "Tambah Produk";
        }
        localStorage.setItem('produkWelfmart', JSON.stringify(produkCMS));
        document.getElementById('namaProduk').value = '';
        document.getElementById('hargaProduk').value = '';
        renderProdukAdmin();
        setTimeout(() => { status.innerText = ''; }, 2000);
    } else {
        alert("Nama dan Harga produk harus diisi!");
    }
}

function siapkanEdit(index) {
    document.getElementById('namaProduk').value = produkCMS[index].nama;
    document.getElementById('hargaProduk').value = produkCMS[index].harga;
    document.getElementById('editIndex').value = index;
    document.getElementById('btnSimpanProduk').innerText = "Update Produk";
}

function hapusProduk(index) {
    if(confirm("Yakin ingin menghapus produk ini?")) {
        produkCMS.splice(index, 1);
        localStorage.setItem('produkWelfmart', JSON.stringify(produkCMS));
        renderProdukAdmin();
    }
}