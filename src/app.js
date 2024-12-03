// app.js

let web3;
let fruitTracking;
let account;

// Định nghĩa các vai trò
const Role = {
  None: 0,
  Farmer: 1,
  Warehouse: 2,
  Delivery: 3,
  Admin: 4,
};

// Định nghĩa các trạng thái sản phẩm
const Status = {
  DangChuanBiHang: 0,
  DangChoGiaoDenKho: 1,
  DangVanChuyenDenKho: 2,
  DaDenKho: 3,
  DangPhanLoai: 4,
  DangKiemTraChatLuong: 5,
  HangLoi_DangTraVeTrangTrai: 6,
  DaTraVeTrangTraiThanhCong: 7,
  DonHangChoVanChuyen: 8,
  DangGiaoDenKhachHang: 9,
  GiaoHangThanhCong: 10,
  GiaoHangKhongThanhCong: 11,
  DangTraHangVeKho: 12,
  DaTraVeKho: 13,
  DaNhanHangTraVe: 14,
  DangTraVeTrangTrai: 15,
};

window.addEventListener('load', async () => {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      await initContract();
      await checkUserRole();
      await detectPage();
      await listenToEvents(); // Thêm lắng nghe sự kiện
    } catch (error) {
      console.error('Nguoi dung tu choi quyen truy cap tai khoan:', error);
      alert('Ban da tu choi quyen truy cap tai khoan.');
    }
  } else {
    alert('Ban can cai dat MetaMask de su dung ung dung nay.');
  }
});

// Hàm khởi tạo hợp đồng
async function initContract() {
  try {
    const response = await fetch('FruitTracking.json');
    if (!response.ok) {
      console.error('Khong the tai tep FruitTracking.json');
      alert('Khong the tai tep FruitTracking.json.');
      return;
    }
    const data = await response.json();
    const networkId = await web3.eth.net.getId();
    const deployedNetwork = data.networks[networkId];
    if (!deployedNetwork) {
      alert('Contract khong duoc trien khai tren mang hien tai.');
      console.error('Contract khong duoc trien khai tren mang ID:', networkId);
      return;
    }
    fruitTracking = new web3.eth.Contract(data.abi, deployedNetwork.address);
    const accounts = await web3.eth.getAccounts();
    account = accounts[0];
    console.log('Da ket noi den contract thanh cong. Tai khoan:', account);
  } catch (error) {
    console.error('Loi khi khoi tao contract:', error);
    alert('Co loi xay ra khi khoi tao contract.');
  }
}

// Hàm kiểm tra vai trò người dùng
async function checkUserRole() {
  if (!fruitTracking) {
    console.error('fruitTracking chua duoc khoi tao.');
    return;
  }
  if (!account) {
    console.error('account chua duoc khoi tao.');
    return;
  }
  try {
    const user = await fruitTracking.methods.getUser(account).call();
    console.log('Thong tin nguoi dung:', user);
    // Có thể thêm mã để hiển thị vai trò trên giao diện nếu cần
  } catch (error) {
    console.error('Loi khi lay thong tin nguoi dung:', error);
  }
}

// Hàm phát hiện trang và tải trang tương ứng
function detectPage() {
  const path = window.location.pathname;
  if (path.includes('index.html') || path === '/' || path === '') {
    loadHomePage();
  } else if (path.includes('admin.html')) {
    loadAdminPage();
  } else if (path.includes('farm.html')) {
    loadFarmPage();
  } else if (path.includes('warehouse.html')) {
    loadWarehousePage();
  } else if (path.includes('delivery.html')) {
    loadDeliveryPage();
  } else {
    loadHomePage();
  }
}

// ------------------- Hàm Lắng Nghe Sự Kiện -------------------
async function listenToEvents() {
  if (!fruitTracking) return;

  // Lắng nghe sự kiện HandlerAssigned
  fruitTracking.events.HandlerAssigned({
    fromBlock: 'latest',
  }, (error, event) => {
    if (!error) {
      console.log('HandlerAssigned su kien:', event);
      // Tải trang lại danh sách sản phẩm kho nếu người dùng là Warehouse
      const path = window.location.pathname;
      if (path.includes('warehouse.html')) {
        displayWarehouseProducts();
      }
      // Tải trang lại danh sách đơn hàng giao nếu người dùng là Delivery
      if (path.includes('delivery.html')) {
        displayDeliveryOrders();
      }
    } else {
      console.error('Loi khi lap nghe su kien HandlerAssigned:', error);
    }
  });

  // Lắng nghe sự kiện HandlerReset
  fruitTracking.events.HandlerReset({
    fromBlock: 'latest',
  }, (error, event) => {
    if (!error) {
      console.log('HandlerReset su kien:', event);
      // Tải trang lại danh sách sản phẩm kho nếu người dùng là Warehouse
      const path = window.location.pathname;
      if (path.includes('warehouse.html')) {
        displayWarehouseProducts();
      }
      // Tải trang lại danh sách đơn hàng giao nếu người dùng là Delivery
      if (path.includes('delivery.html')) {
        displayDeliveryOrders();
      }
    } else {
      console.error('Loi khi lap nghe su kien HandlerReset:', error);
    }
  });

  // Lắng nghe sự kiện StatusUpdated
  fruitTracking.events.StatusUpdated({
    fromBlock: 'latest',
  }, (error, event) => {
    if (!error) {
      console.log('StatusUpdated su kien:', event);
      const path = window.location.pathname;
      if (path.includes('index.html') || path === '/' || path === '') {
        // Nếu trang chủ đang hiển thị thông tin sản phẩm đã tìm, cập nhật lại
        // Có thể thêm logic để cập nhật UI nếu cần
      }
    } else {
      console.error('Loi khi lap nghe su kien StatusUpdated:', error);
    }
  });

  // Lắng nghe sự kiện DebugInfo
  fruitTracking.events.DebugInfo({
    fromBlock: 'latest',
  }, (error, event) => {
    if (!error) {
      console.log('DebugInfo su kien:', event.returnValues);
      // Có thể thêm logic để hiển thị thông tin trên giao diện nếu cần
    } else {
      console.error('Loi khi lap nghe su kien DebugInfo:', error);
    }
  });
}

// ------------------- Trang Chủ -------------------
async function loadHomePage() {
  const searchBtn = document.getElementById('searchBtn');
  if (searchBtn) {
    searchBtn.addEventListener('click', async () => {
      const fruitIdInput = document.getElementById('searchId').value;
      const fruitId = parseInt(fruitIdInput, 10); // Chuyển đổi sang số nguyên
      if (isNaN(fruitId) || fruitId <= 0) {
        alert('Vui lòng nhập ID sản phẩm hợp lệ.');
        return;
      }
      await searchFruit(fruitId);
    });
  }
}

// Hàm tìm kiếm sản phẩm theo ID
async function searchFruit(fruitId) {
  try {
    const fruit = await fruitTracking.methods.getFruit(fruitId).call();
    if (parseInt(fruit.id, 10) === 0) {
      alert('Không tìm thấy sản phẩm với id đã nhập.');
      return;
    }
    const history = await fruitTracking.methods.getUpdateHistory(fruitId).call();
    displayFruitInfo(fruit, history);
  } catch (error) {
    console.error('Loi khi tim kiem san pham:', error);
    alert('Không tồn tại sản phẩm');
  }
}

// Hàm hiển thị thông tin sản phẩm và lịch sử
function displayFruitInfo(fruit, history) {
  try {
    const statusText = getStatusText(parseInt(fruit.status, 10));
    const productionDate =
      parseInt(fruit.productionDate, 10) !== 0
        ? new Date(parseInt(fruit.productionDate, 10) * 1000).toLocaleDateString()
        : 'N/A';
    const expirationDate =
      parseInt(fruit.expirationDate, 10) !== 0
        ? new Date(parseInt(fruit.expirationDate, 10) * 1000).toLocaleDateString()
        : 'N/A';
    const infoDiv = document.getElementById('fruitInfo');
    if (!infoDiv) {
      console.error('Khong tim thay phan tu HTML co ID "fruitInfo".');
      return;
    }
    infoDiv.innerHTML = `
      <h3>Thong Tin San Pham</h3>
      <p><strong>ID:</strong> ${fruit.id}</p>
      <p><strong>Ten:</strong> ${fruit.name}</p>
      <p><strong>Gia:</strong> ${fruit.price}</p>
      <p><strong>So luong:</strong> ${fruit.quantity}</p>
      <p><strong>Nguon goc:</strong> ${fruit.origin}</p>
      <p><strong>Ngay san xuat:</strong> ${productionDate}</p>
      <p><strong>Ngay het han:</strong> ${expirationDate}</p>
      <p><strong>Trang thai hien tai:</strong> ${statusText}</p>
      <h4>Lich Su Trang Thai</h4>
    `;
    const historyList = document.createElement('ul');
    const statuses = history.statuses;
    const timestamps = history.timestamps;
    for (let i = 0; i < statuses.length; i++) {
      const status = getStatusText(parseInt(statuses[i], 10));
      const timestamp = new Date(parseInt(timestamps[i], 10) * 1000).toLocaleString();
      const listItem = document.createElement('li');
      listItem.textContent = `${status} - ${timestamp}`;
      historyList.appendChild(listItem);
    }
    infoDiv.appendChild(historyList);
  } catch (error) {
    console.error('Loi khi hien thi thong tin san pham:', error);
    alert('Có lỗi xảy ra khi hiển thị thông tin sản phẩm' + error.message);
  }
}

// ------------------- Trang Quản Trị Viên (Admin) -------------------
async function loadAdminPage() {
  const role = await fruitTracking.methods.getRole(account).call();
  const numericRole = parseInt(role, 10);
  if (numericRole !== Role.Admin) {
    alert('Bạn không có quyền truy cập trang này.');
    window.location.href = "index.html";
    return;
  }

  await displayUserAccounts();

  const addUserForm = document.getElementById('addUserForm');
  if (addUserForm) {
    addUserForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      await addUserAccount();
    });
  }
}

// Hàm hiển thị danh sách tài khoản người dùng
async function displayUserAccounts() {
  try {
    const userAddresses = await fruitTracking.methods.getAllUsers().call({ from: account });
    const userList = document.getElementById('userList');
    if (!userList) {
      console.error('Khong tim thay phan tu HTML co ID "userList".');
      return;
    }
    userList.innerHTML = '';
    for (let address of userAddresses) {
      const userInfo = await fruitTracking.methods.getUser(address).call();
      const roleValue = parseInt(userInfo[3], 10);
      const roleText = getRoleText(roleValue);
      const statusText = userInfo[4] ? 'Hoat dong' : 'Bi khoa';

      const userItem = document.createElement('div');
      userItem.className = 'user-item';
      userItem.innerHTML = `
        <p><strong>Dia chi vi:</strong> ${address}</p>
        <p><strong>Ten:</strong> ${userInfo[0]}</p>
        <p><strong>Email:</strong> ${userInfo[1]}</p>
        <p><strong>So dien thoai:</strong> ${userInfo[2]}</p>
        <p><strong>Vai tro:</strong> ${roleText}</p>
        <p><strong>Trang thai:</strong> ${statusText}</p>
      `;

      // if (address.toLowerCase() !== account.toLowerCase()) {
      //   const removeBtn = document.createElement('button');
      //   removeBtn.innerText = 'Xoa Tai Khoan';
      //   removeBtn.addEventListener('click', async () => {
      //     if (confirm('Ban co chac chan muon xoa tai khoan nay?')) {
      //       await removeUserAccount(address);
      //     }
      //   });
      //   userItem.appendChild(removeBtn);
      // }

      userList.appendChild(userItem);
    }
  } catch (error) {
    console.error('Loi khi hien thi danh sach tai khoan:', error);
    alert('Co loi xay ra khi hien thi danh sach tai khoan: ' + error.message);
  }
}

// Hàm thêm tài khoản người dùng mới
async function addUserAccount() {
  const userAddress = document.getElementById('userAddress').value;
  const roleInput = document.getElementById('userRole').value;
  const role = parseInt(roleInput, 10);
  const name = document.getElementById('userName').value;
  const email = document.getElementById('userEmail').value;
  const phoneNumber = document.getElementById('userPhone').value;

  if (
    userAddress.trim() === '' ||
    isNaN(role) ||
    name.trim() === '' ||
    email.trim() === '' ||
    phoneNumber.trim() === ''
  ) {
    alert('Vui lòng nhập đầy đủ thông tin tài khoản');
    return;
  }

  try {
    await fruitTracking.methods
      .addAccount(userAddress, role, name, email, phoneNumber)
      .send({ from: account });
    alert('Thêm tài khoản thành công!');
    document.getElementById('addUserForm').reset();
    await displayUserAccounts();
  } catch (error) {
    console.error('Lỗi khi thêm tài khoản ', error);
    const revertReason = extractRevertReason(error);
    alert(`Lỗi khi thêm tài khoản:  ${revertReason}`);
  }
}

// Hàm xóa tài khoản người dùng
async function removeUserAccount(address) {
  try {
    await fruitTracking.methods.removeAccount(address).send({ from: account });
    alert('Xoa tai khoan thanh cong!');
    await displayUserAccounts();
  } catch (error) {
    console.error('Loi khi xoa tai khoan:', error);
    const revertReason = extractRevertReason(error);
    alert(`Co loi xay ra khi xoa tai khoan: ${revertReason}`);
  }
}

// Hàm lấy tên vai trò từ giá trị số
function getRoleText(role) {
  switch (role) {
    case Role.Farmer:
      return 'Chủ nông trại';
    case Role.Warehouse:
      return 'Kho phân loại';
    case Role.Delivery:
      return 'Giao hàng';
    case Role.Admin:
      return 'Quản trị viên';
    default:
      return 'Không xác định';
  }
}

// ------------------- Trang Nông Trại (Farm) -------------------
async function loadFarmPage() {
  const role = await fruitTracking.methods.getRole(account).call();
  const numericRole = parseInt(role, 10);
  if (numericRole !== Role.Farmer) {
    alert('Bạn không có quyền truy cập trang này');
    window.location.href = "index.html";
    return;
  }

  const addProductBtn = document.getElementById('addProductBtn');
  if (addProductBtn) {
    addProductBtn.addEventListener('click', showAddProductForm);
  }
  const addProductForm = document.getElementById('addProductForm');
  if (addProductForm) {
    addProductForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      await addFruit();
    });
  }
  await displayFarmerProducts();
}

// Hàm hiển thị form thêm sản phẩm
function showAddProductForm() {
  const addProductForm = document.getElementById('addProductForm');
  if (addProductForm) {
    addProductForm.style.display = 'block';
  }
}

// Hàm thêm sản phẩm mới
async function addFruit() {
  const name = document.getElementById('name').value;
  const priceInput = document.getElementById('price').value;
  const quantityInput = document.getElementById('quantity').value;
  const origin = document.getElementById('origin').value;
  const productionDateInput = document.getElementById('productionDate').value;
  const expirationDateInput = document.getElementById('expirationDate').value;
  const destination = document.getElementById('destination').value;

  const price = parseInt(priceInput, 10);
  const quantity = parseInt(quantityInput, 10);
  const productionDate = productionDateInput
    ? Math.floor(new Date(productionDateInput).getTime() / 1000)
    : 0;
  const expirationDate = expirationDateInput
    ? Math.floor(new Date(expirationDateInput).getTime() / 1000)
    : 0;

  if (
    name.trim() === '' ||
    isNaN(price) ||
    isNaN(quantity) ||
    origin.trim() === '' ||
    destination.trim() === ''
  ) {
    alert('Vui lòng nhập đầy đủ thông tin sản phẩm');
    return;
  }

  try {
    await fruitTracking.methods
      .addFruit(
        name,
        price,
        quantity,
        origin,
        productionDate,
        expirationDate,
        destination
      )
      .send({ from: account });
    alert('Thêm sản phẩm thành công!');
    document.getElementById('addProductForm').reset();
    document.getElementById('addProductForm').style.display = 'none';
    await displayFarmerProducts();
  } catch (error) {
    console.error('Lỗi khi thêm sản phẩm:', error);
    const revertReason = extractRevertReason(error);
    alert(`Co loi xay ra khi them san pham: ${revertReason}`);
  }
}

// Hàm hiển thị danh sách sản phẩm của nông trại
async function displayFarmerProducts() {
  try {
    const fruitIds = await fruitTracking.methods.getFruitsByOwner(account).call();
    const productList = document.getElementById('productList');
    if (!productList) {
      console.error('Khong tim thay phan tu HTML co ID "productList".');
      return;
    }
    productList.innerHTML = '';

    for (let id of fruitIds) {
      // Convert id to Number to avoid BigInt
      const fruitId = parseInt(id, 10);
      const fruit = await fruitTracking.methods.getFruit(fruitId).call();
      const statusText = getStatusText(parseInt(fruit.status, 10));

      const productItem = document.createElement('div');
      productItem.className = 'product-item';
      productItem.innerHTML = `
        <p><strong>ID:</strong> ${fruit.id}</p>
        <p><strong>Ten:</strong> ${fruit.name}</p>
        <p><strong>Gia:</strong> ${fruit.price}</p>
        <p><strong>So luong:</strong> ${fruit.quantity}</p>
        <p><strong>Nguon goc:</strong> ${fruit.origin}</p>
        <p><strong>Trang thai:</strong> ${statusText}</p>
      `;

      if (parseInt(fruit.status, 10) === Status.DangChuanBiHang) {
        const updateBtn = document.createElement('button');
        updateBtn.innerText = 'Chuyen Trang Thai: Dang Cho Giao Den Kho Phan Loai';
        updateBtn.addEventListener('click', async () => {
          // Chuyển trạng thái từ 0 (DangChuanBiHang) sang 1 (DangChoGiaoDenKho)
          await updateStatus(fruit.id, Status.DangChoGiaoDenKho);
        });
        productItem.appendChild(updateBtn);
      }

      productList.appendChild(productItem);
    }
  } catch (error) {
    console.error('Loi khi hien thi danh sach san pham:', error);
    alert('Co loi xay ra khi hien thi danh sach san pham: ' + error.message);
  }
}

// Hàm cập nhật trạng thái sản phẩm (Farm)
async function updateStatus(fruitId, status) {
  // Ensure fruitId is a Number
  const numericFruitId = Number(fruitId);
  if (isNaN(numericFruitId)) {
    alert('Mã sản phẩm không hợp lệ.');
    return;
  }

  console.log('Cập nhật trạng thái sản phẩm (Farm):');
  console.log('Fruit ID:', numericFruitId);
  console.log('Trạng thái mới:', status);
  try {
    // Lấy trạng thái hiện tại của sản phẩm
    const fruit = await fruitTracking.methods.getFruit(numericFruitId).call();
    const currentStatus = parseInt(fruit.status, 10);

    // Kiểm tra tính hợp lệ của chuyển đổi trạng thái
    if (!isValidTransition(currentStatus, status)) {
      alert(`Không thể chuyển từ trạng thái "${getStatusText(currentStatus)}" sang "${getStatusText(status)}".`);
      return;
    }

    // Sử dụng estimateGas để ước tính gas trước khi gửi giao dịch
    const gasEstimate = await fruitTracking.methods
      .updateStatus(numericFruitId, status)
      .estimateGas({ from: account });
    console.log('Gas Estimate:', gasEstimate);

    // Chuyển gasEstimate từ BigInt sang Number trước khi cộng
    const totalGas = Number(gasEstimate) + 100000;

    await fruitTracking.methods
      .updateStatus(numericFruitId, status)
      .send({ from: account, gas: totalGas }); // Tăng thêm gas để đảm bảo
    alert('Cập nhật trạng thái thành công!');
    await displayFarmerProducts(); // Làm mới danh sách sản phẩm
  } catch (error) {
    console.error('Loi khi cap nhat trang thai:', error);
    const revertReason = extractRevertReason(error);
    alert(`Co loi xay ra khi cap nhat trang thai: ${revertReason}`);
  }
}

// ------------------- Trang Kho Phân Loại (Warehouse) -------------------
async function loadWarehousePage() {
  const role = await fruitTracking.methods.getRole(account).call();
  const numericRole = parseInt(role, 10);
  if (numericRole !== Role.Warehouse) {
    alert('Bạn không có quyền truy cập trang này.');
    window.location.href = "index.html";
    return;
  }

  await displayWarehouseProducts();
}

// Hàm hiển thị danh sách sản phẩm tại kho phân loại
async function displayWarehouseProducts() {
  try {
    const allFruitsCount = await fruitTracking.methods.fruitCount().call();
    const productList = document.getElementById('warehouseProductList');
    if (!productList) {
      console.error('Khong tim thay phan tu HTML co ID "warehouseProductList".');
      return;
    }
    productList.innerHTML = '';

    for (let id = 1; id <= parseInt(allFruitsCount, 10); id++) {
      const fruit = await fruitTracking.methods.getFruit(id).call();

      // Kiểm tra trạng thái sản phẩm và currentHandler
      const status = parseInt(fruit.status, 10);
      const isBeingHandled =
        fruit.currentHandler &&
        fruit.currentHandler.toLowerCase() !== '0x0000000000000000000000000000000000000000';
      const isCurrentUserHandler =
        fruit.currentHandler.toLowerCase() === account.toLowerCase();

      if (
        (status === Status.DangChoGiaoDenKho && !isBeingHandled) ||
        isCurrentUserHandler
      ) {
        const statusText = getStatusText(status);

        const productItem = document.createElement('div');
        productItem.className = 'product-item';
        productItem.innerHTML = `
          <p><strong>ID:</strong> ${fruit.id}</p>
          <p><strong>Tên:</strong> ${fruit.name}</p>
          <p><strong>Giá:</strong> ${fruit.price}</p>
          <p><strong>Số lượng:</strong> ${fruit.quantity}</p>
          <p><strong>Nguồn gốc:</strong> ${fruit.origin}</p>
          <p><strong>Trạng thái:</strong> ${statusText}</p>
        `;

        const actionBtn = document.createElement('button');

        if (status === Status.DangChoGiaoDenKho && !isBeingHandled) {
          actionBtn.innerText = 'Nhận sản phẩm';
          actionBtn.addEventListener('click', async () => {
            // Chuyển trạng thái từ 1 (DangChoGiaoDenKho) sang 2 (DangVanChuyenDenKho)
            await updateWarehouseStatus(fruit.id, Status.DangVanChuyenDenKho);
          });
        } else if (status === Status.DangVanChuyenDenKho) {
          actionBtn.innerText = 'Cập nhật: Đã đến kho';
          actionBtn.addEventListener('click', async () => {
            await updateWarehouseStatus(fruit.id, Status.DaDenKho);
          });
        } else if (status === Status.DaDenKho) {
          actionBtn.innerText = 'Cập nhật: Đang phân loại';
          actionBtn.addEventListener('click', async () => {
            await updateWarehouseStatus(fruit.id, Status.DangPhanLoai);
          });
        } else if (status === Status.DangPhanLoai) {
          actionBtn.innerText = 'Cập nhật: Đang kiểm tra chất lượng';
          actionBtn.addEventListener('click', async () => {
            await updateWarehouseStatus(fruit.id, Status.DangKiemTraChatLuong);
          });
        } else if (status === Status.DangKiemTraChatLuong) {
          // Quyết định xử lý sau khi kiểm tra chất lượng
          const faultyBtn = document.createElement('button');
          faultyBtn.innerText = 'Hàng Lỗi- Trả về trang trại';
          faultyBtn.addEventListener('click', async () => {
            await updateWarehouseStatus(fruit.id, Status.HangLoi_DangTraVeTrangTrai);
          });

          const readyForDeliveryBtn = document.createElement('button');
          readyForDeliveryBtn.innerText = 'Sẵn sàng vận chuyển';
          readyForDeliveryBtn.addEventListener('click', async () => {
            await updateWarehouseStatus(fruit.id, Status.DonHangChoVanChuyen);
          });

          productItem.appendChild(faultyBtn);
          productItem.appendChild(readyForDeliveryBtn);
        } else if (status === Status.HangLoi_DangTraVeTrangTrai) {
          // Cung cấp nút để cập nhật sang trạng thái 7
          actionBtn.innerText = 'Cập nhật: Da Tra Ve Trang Trai Thanh Cong';
          actionBtn.addEventListener('click', async () => {
            await updateWarehouseStatus(fruit.id, Status.DaTraVeTrangTraiThanhCong);
          });
          productItem.appendChild(actionBtn);
        } else if (status === Status.DaTraVeKho) {
          actionBtn.innerText = 'Cập nhật: Da Nhan Hang Tra Ve';
          actionBtn.addEventListener('click', async () => {
            await updateWarehouseStatus(fruit.id, Status.DaNhanHangTraVe);
          });
        } else if (status === Status.DaNhanHangTraVe) {
          const returnToFarmBtn = document.createElement('button');
          returnToFarmBtn.innerText = 'Tra Ve Trang Trai';
          returnToFarmBtn.addEventListener('click', async () => {
            await updateWarehouseStatus(fruit.id, Status.DangTraVeTrangTrai);
          });

          const reDeliverBtn = document.createElement('button');
          reDeliverBtn.innerText = 'Giao Lai Cho Khach Hang';
          reDeliverBtn.addEventListener('click', async () => {
            await updateWarehouseStatus(fruit.id, Status.DonHangChoVanChuyen);
          });

          productItem.appendChild(returnToFarmBtn);
          productItem.appendChild(reDeliverBtn);
        } else if (status === Status.DangTraVeTrangTrai) {
          actionBtn.innerText = 'Cap Nhat: Da Tra Ve Trang Trai Thanh Cong';
          actionBtn.addEventListener('click', async () => {
            await updateWarehouseStatus(fruit.id, Status.DaTraVeTrangTraiThanhCong);
          });
        }

        if (actionBtn.innerText) {
          productItem.appendChild(actionBtn);
        }

        productList.appendChild(productItem);
      }
    }
  } catch (error) {
    console.error('Loi khi hien thi danh sach san pham kho:', error);
    alert('Co loi xay ra khi hien thi danh sach san pham kho: ' + error.message);
  }
}

async function updateWarehouseStatus(fruitId, status) {
  // Ensure fruitId is a Number
  const numericFruitId = Number(fruitId);
  if (isNaN(numericFruitId)) {
    alert('Mã sản phẩm không hợp lệ.');
    return;
  }

  console.log('Cập nhật trạng thái kho:');
  console.log('Fruit ID:', numericFruitId);
  console.log('Trạng thái mới:', status);
  try {
    // Lấy trạng thái hiện tại của sản phẩm
    const fruit = await fruitTracking.methods.getFruit(numericFruitId).call();
    const currentStatus = parseInt(fruit.status, 10);
    
    // Kiểm tra tính hợp lệ của chuyển đổi trạng thái
    if (!isValidTransition(currentStatus, status)) {
      alert(`Không thể chuyển từ trạng thái "${getStatusText(currentStatus)}" sang "${getStatusText(status)}".`);
      return;
    }

    // Sử dụng estimateGas để ước tính gas trước khi gửi giao dịch
    const gasEstimate = await fruitTracking.methods
      .updateStatus(numericFruitId, status)
      .estimateGas({ from: account });
    console.log('Gas Estimate:', gasEstimate);

    // Chuyển gasEstimate từ BigInt sang Number trước khi cộng
    const totalGas = Number(gasEstimate) + 100000;

    await fruitTracking.methods
      .updateStatus(numericFruitId, status)
      .send({ from: account, gas: totalGas }); // Tăng thêm gas để đảm bảo
    alert('Cập nhật trạng thái thành công!');
    await displayWarehouseProducts();
    await checkFruitStatus(fruitId); // Kiểm tra trạng thái sau cập nhật
    await checkWarehouseMappings(account, fruitId); // Kiểm tra mapping
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái kho:', error);
    const revertReason = extractRevertReason(error);
    alert(`Có lỗi xảy ra khi cập nhật trạng thái kho: ${revertReason}`);
  }
}

// ------------------- Trang Giao Hàng (Delivery) -------------------
async function loadDeliveryPage() {
  const role = await fruitTracking.methods.getRole(account).call();
  const numericRole = parseInt(role, 10);
  if (numericRole !== Role.Delivery) {
      alert('Bạn không có quyền truy cập trang này.');
      window.location.href = "index.html";
      return;
  }

  await displayDeliveryOrders();
  await displayDeliveredOrders(); // Add this line to fetch delivered orders
}

async function displayDeliveryOrders() {
  try {
      const allFruitsCount = await fruitTracking.methods.fruitCount().call();
      const orderList = document.getElementById('deliveryOrderList');
      if (!orderList) {
          console.error('Không tìm thấy phần tử HTML có ID "deliveryOrderList".');
          return;
      }
      orderList.innerHTML = '';

      for (let id = 1; id <= parseInt(allFruitsCount, 10); id++) {
          const fruit = await fruitTracking.methods.getFruit(id).call();

          const status = parseInt(fruit.status, 10);
          const isBeingHandled =
              fruit.currentHandler &&
              fruit.currentHandler.toLowerCase() !== '0x0000000000000000000000000000000000000000';
          const isCurrentUserHandler =
              fruit.currentHandler.toLowerCase() === account.toLowerCase();

          if (
              (status === Status.DonHangChoVanChuyen && !isBeingHandled) ||
              isCurrentUserHandler
          ) {
              const statusText = getStatusText(status);

              const orderItem = document.createElement('div');
              orderItem.className = 'order-item';
              orderItem.innerHTML = `
                  <p><strong>ID:</strong> ${fruit.id}</p>
                  <p><strong>Tên:</strong> ${fruit.name}</p>
                  <p><strong>Giá:</strong> ${fruit.price}</p>
                  <p><strong>Số lượng:</strong> ${fruit.quantity}</p>
                  <p><strong>Điểm đến:</strong> ${fruit.destination}</p>
                  <p><strong>Trạng thái:</strong> ${statusText}</p>
              `;

              const actionBtn = document.createElement('button');

              if (status === Status.DonHangChoVanChuyen && !isBeingHandled) {
                  actionBtn.innerText = 'Nhận Đơn Hàng';
                  actionBtn.addEventListener('click', async () => {
                      // Chuyển trạng thái từ 8 (DonHangChoVanChuyen) sang 9 (DangGiaoDenKhachHang)
                      await updateDeliveryStatus(fruit.id, Status.DangGiaoDenKhachHang);
                  });
              } else if (status === Status.DangGiaoDenKhachHang) {
                  const successBtn = document.createElement('button');
                  successBtn.innerText = 'Giao Hàng Thành Công';
                  successBtn.addEventListener('click', async () => {
                      await updateDeliveryStatus(fruit.id, Status.GiaoHangThanhCong);
                  });

                  const failBtn = document.createElement('button');
                  failBtn.innerText = 'Giao Hàng Không Thành Công';
                  failBtn.addEventListener('click', async () => {
                      await updateDeliveryStatus(fruit.id, Status.GiaoHangKhongThanhCong);
                  });

                  orderItem.appendChild(successBtn);
                  orderItem.appendChild(failBtn);
              } else if (status === Status.GiaoHangKhongThanhCong) {
                  actionBtn.innerText = 'Cập Nhật: Đang Trả Hàng Về Kho';
                  actionBtn.addEventListener('click', async () => {
                      await updateDeliveryStatus(fruit.id, Status.DangTraHangVeKho);
                  });
              } else if (status === Status.DangTraHangVeKho) {
                  actionBtn.innerText = 'Cập Nhật: Đã Trả Về Kho';
                  actionBtn.addEventListener('click', async () => {
                      await updateDeliveryStatus(fruit.id, Status.DaTraVeKho);
                  });
              }

              if (actionBtn.innerText) {
                  orderItem.appendChild(actionBtn);
              }

              orderList.appendChild(orderItem);
          }
      }
  } catch (error) {
      console.error('Lỗi khi hiển thị danh sách đơn hàng giao:', error);
      alert('Có lỗi xảy ra khi hiển thị danh sách đơn hàng giao: ' + error.message);
  }
}

// New Function: Hàm hiển thị danh sách đơn hàng đã giao
async function displayDeliveredOrders() {
  try {
      const allFruitsCount = await fruitTracking.methods.fruitCount().call();
      const deliveredOrderList = document.getElementById('deliveredOrderList');
      if (!deliveredOrderList) {
          console.error('Không tìm thấy phần tử HTML có ID "deliveredOrderList".');
          return;
      }
      deliveredOrderList.innerHTML = '';

      for (let id = 1; id <= parseInt(allFruitsCount, 10); id++) {
          const fruit = await fruitTracking.methods.getFruit(id).call();
          const deliveryAssignment = await fruitTracking.methods.getDeliveryAssignment(id).call();
          const status = parseInt(fruit.status, 10);
          const isDelivered = (status === Status.GiaoHangThanhCong || status === Status.GiaoHangKhongThanhCong);
          
          if (deliveryAssignment.toLowerCase() === account.toLowerCase() && isDelivered) {
              const statusText = getStatusText(status);
              const deliveredDate = new Date(parseInt(fruit.expirationDate, 10) * 1000).toLocaleString(); // Adjust based on your data

              const orderItem = document.createElement('div');
              orderItem.className = 'order-item';
              orderItem.innerHTML = `
                  <p><strong>ID:</strong> ${fruit.id}</p>
                  <p><strong>Tên:</strong> ${fruit.name}</p>
                  <p><strong>Giá:</strong> ${fruit.price}</p>
                  <p><strong>Số lượng:</strong> ${fruit.quantity}</p>
                  <p><strong>Điểm đến:</strong> ${fruit.destination}</p>
                  <p><strong>Trạng thái:</strong> ${statusText}</p>
                  <p><strong>Ngày giao:</strong> ${deliveredDate}</p>
              `;

              deliveredOrderList.appendChild(orderItem);
          }
      }
  } catch (error) {
      console.error('Lỗi khi hiển thị danh sách đơn hàng đã giao:', error);
      alert('Có lỗi xảy ra khi hiển thị danh sách đơn hàng đã giao: ' + error.message);
  }
}
// Hàm cập nhật trạng thái giao hàng (Delivery)
async function updateDeliveryStatus(fruitId, status) {
  // Ensure fruitId is a Number
  const numericFruitId = Number(fruitId);
  if (isNaN(numericFruitId)) {
    alert('Ma san pham khong hop le.');
    return;
  }

  console.log('Cập nhật trạng thái giao hàng:');
  console.log('Fruit ID:', numericFruitId);
  console.log('Trạng thái mới:', status);
  try {
    // Lấy trạng thái hiện tại của sản phẩm
    const fruit = await fruitTracking.methods.getFruit(numericFruitId).call();
    const currentStatus = parseInt(fruit.status, 10);

    // Kiểm tra tính hợp lệ của chuyển đổi trạng thái
    if (!isValidTransition(currentStatus, status)) {
      alert(`Không thể chuyển từ trạng thái "${getStatusText(currentStatus)}" sang "${getStatusText(status)}".`);
      return;
    }

    // Sử dụng estimateGas để ước tính gas trước khi gửi giao dịch
    const gasEstimate = await fruitTracking.methods
      .updateStatus(numericFruitId, status)
      .estimateGas({ from: account });
    console.log('Gas Estimate:', gasEstimate);

    // Chuyển gasEstimate từ BigInt sang Number trước khi cộng
    const totalGas = Number(gasEstimate) + 100000;

    await fruitTracking.methods
      .updateStatus(numericFruitId, status)
      .send({ from: account, gas: totalGas }); // Tăng thêm gas để đảm bảo
    alert('Cập nhật trạng thái thành công!');
    await displayDeliveryOrders();
  } catch (error) {
    console.error('Loi khi cap nhat trang thai giao hang:', error);
    const revertReason = extractRevertReason(error);
    alert(`Co loi xay ra khi cap nhat trang thai giao hang: ${revertReason}`);
  }
}

// ------------------- Hàm Hỗ Trợ -------------------
// Hàm lấy tên trạng thái từ giá trị số
function getStatusText(status) {
  switch (status) {
    case Status.DangChuanBiHang:
      return 'Đang Chuẩn Bị Hàng';
    case Status.DangChoGiaoDenKho:
      return 'Đang Chờ Giao Đến Kho Phân Loại';
    case Status.DangVanChuyenDenKho:
      return 'Đang Vận Chuyển Đến Kho';
    case Status.DaDenKho:
      return 'Đã Đến Kho';
    case Status.DangPhanLoai:
      return 'Đang Phân Loại';
    case Status.DangKiemTraChatLuong:
      return 'Đang Kiểm Tra Chất Lượng';
    case Status.HangLoi_DangTraVeTrangTrai:
      return 'Hàng Lỗi - Đang Trả Về Trang Trại';
    case Status.DaTraVeTrangTraiThanhCong:
      return 'Đã Trả Về Trang Trại Thành Công';
    case Status.DonHangChoVanChuyen:
      return 'Đơn Hàng Chờ Vận Chuyển';
    case Status.DangGiaoDenKhachHang:
      return 'Đang Giao Đến Khách Hàng';
    case Status.GiaoHangThanhCong:
      return 'Giao Hàng Thành Công';
    case Status.GiaoHangKhongThanhCong:
      return 'Giao Hàng Không Thành Công';
    case Status.DangTraHangVeKho:
      return 'Đang Trả Hàng Về Kho';
    case Status.DaTraVeKho:
      return 'Đã Trả Hàng Về Kho';
    case Status.DaNhanHangTraVe:
      return 'Đã Nhận Hàng Trả Về';
    case Status.DangTraVeTrangTrai:
      return 'Đang Trả Về Trang Trai';
    default:
      return 'Khong Xac Dinh';
  }
}

// Hàm hỗ trợ trích xuất thông điệp revert từ lỗi
function extractRevertReason(error) {
  if (error && error.message) {
    const regex = /revert (.*)/;
    const match = error.message.match(regex);
    if (match && match.length > 1) {
      return match[1];
    }
    return error.message;
  }
  return 'Có lỗi xảy ra.';
}

// Hàm kiểm tra tính hợp lệ của chuyển đổi trạng thái
function isValidTransition(current, newStatus) {
  const validTransitions = {
    0: [1], // DangChuanBiHang -> DangChoGiaoDenKho
    1: [2], // DangChoGiaoDenKho -> DangVanChuyenDenKho
    2: [3], // DangVanChuyenDenKho -> DaDenKho
    3: [4], // DaDenKho -> DangPhanLoai
    4: [5], // DangPhanLoai -> DangKiemTraChatLuong
    5: [6, 8], // DangKiemTraChatLuong -> HangLoi_DangTraVeTrangTrai hoặc DonHangChoVanChuyen
    6: [7], // HangLoi_DangTraVeTrangTrai -> DaTraVeTrangTraiThanhCong
    8: [9], // DonHangChoVanChuyen -> DangGiaoDenKhachHang
    9: [10, 11], // DangGiaoDenKhachHang -> GiaoHangThanhCong hoặc GiaoHangKhongThanhCong
    11: [12], // GiaoHangKhongThanhCong -> DangTraHangVeKho
    12: [13], // DangTraHangVeKho -> DaTraVeKho
    13: [14], // DaTraVeKho -> DaNhanHangTraVe
    14: [15, 8], // DaNhanHangTraVe -> DangTraVeTrangTrai hoặc DonHangChoVanChuyen
    15: [7], // DangTraVeTrangTrai -> DaTraVeTrangTraiThanhCong
  };

  return validTransitions[current] && validTransitions[current].includes(newStatus);
}

// Hàm kiểm tra trạng thái và handler của sản phẩm
async function checkFruitStatus(fruitId) {
  try {
    const fruit = await fruitTracking.methods.getFruit(fruitId).call();
    console.log('Thong tin sau khi cap nhat:', fruit);
    // Hiển thị trên giao diện hoặc kiểm tra trong console
  } catch (error) {
    console.error('Loi khi kiem tra trang thai san pham:', error);
  }
}

// Hàm kiểm tra mappings của Warehouse
async function checkWarehouseMappings(warehouseAddress, fruitId) {
  try {
    const fruits = await fruitTracking.methods.getFruitsByWarehouse(warehouseAddress).call();
    console.log(`Fruits của Warehouse ${warehouseAddress}:`, fruits);
    if (fruits.includes(String(fruitId))) {
      console.log(`Fruit ID ${fruitId} vẫn nằm trong warehouseToFruits.`);
    } else {
      console.log(`Fruit ID ${fruitId} không nằm trong warehouseToFruits.`);
    }
  } catch (error) {
    console.error('Lỗi khi kiểm tra warehouseToFruits:', error);
  }
}