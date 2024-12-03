// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FruitTracking {
    // Enum định nghĩa các trạng thái của sản phẩm
    enum Status {
        DangChuanBiHang,               // 0 - Đang Chuẩn Bị Hàng
        DangChoGiaoDenKho,             // 1 - Đang Chờ Giao Đến Kho Phân Loại
        DangVanChuyenDenKho,           // 2 - Đang Vận Chuyển Đến Kho
        DaDenKho,                      // 3 - Đã Đến Kho
        DangPhanLoai,                  // 4 - Đang Phân Loại
        DangKiemTraChatLuong,          // 5 - Đang Kiểm Tra Chất Lượng
        HangLoi_DangTraVeTrangTrai,    // 6 - Hàng Lỗi - Đang Trả Về Trang Trại
        DaTraVeTrangTraiThanhCong,     // 7 - Đã Trả Về Trang Trại Thành Công
        DonHangChoVanChuyen,           // 8 - Đơn Hàng Chờ Vận Chuyển
        DangGiaoDenKhachHang,          // 9 - Đang Giao Đến Khách Hàng
        GiaoHangThanhCong,             // 10 - Giao Hàng Thành Công
        GiaoHangKhongThanhCong,        // 11 - Giao Hàng Không Thành Công
        DangTraHangVeKho,              // 12 - Đang Trả Hàng Về Kho
        DaTraVeKho,                    // 13 - Đã Trả Hàng Về Kho
        DaNhanHangTraVe,               // 14 - Đã Nhận Hàng Trả Về
        DangTraVeTrangTrai             // 15 - Đang Trả Về Trang Trại
    }

    // Enum định nghĩa các vai trò người dùng
    enum Role {
        None,       // 0
        Farmer,     // 1
        Warehouse,  // 2
        Delivery,   // 3
        Admin       // 4
    }

    // Struct lưu trữ lịch sử cập nhật trạng thái
    struct UpdateHistory {
        Status status;
        uint256 timestamp;
        address executor;
    }

    // Struct lưu trữ thông tin sản phẩm
    struct Fruit {
        uint256 id;
        address owner;
        string name;
        uint256 price;
        uint256 quantity;
        string origin;
        uint256 productionDate;
        uint256 expirationDate;
        string destination;
        Status status;
        UpdateHistory[] history;
        address currentHandler;
        Role currentRole;
    }

    // Struct lưu trữ thông tin người dùng
    struct User {
        string name;
        string email;
        string phoneNumber;
        Role role;
        bool isActive;
    }

    // Mapping lưu trữ thông tin sản phẩm theo ID
    mapping(uint256 => Fruit) public fruits;
    uint256 public fruitCount;

    // Mapping lưu trữ thông tin người dùng theo địa chỉ
    mapping(address => User) public users;
    address public owner;

    // Mapping lưu trữ danh sách sản phẩm của từng người dùng
    mapping(address => uint256[]) public ownerToFruits;
    mapping(address => uint256[]) public warehouseToFruits;
    mapping(uint256 => address) public deliveryAssignments;

    address[] public userAddresses;

    // Các sự kiện
    event FruitAdded(uint256 id, string name);
    event StatusUpdated(uint256 id, Status status, address executor);
    event UserAdded(address indexed account, Role role);
    event UserRemoved(address indexed account);
    event UserRoleUpdated(address indexed account, Role newRole);
    event HandlerAssigned(uint256 indexed fruitId, address indexed handler, Role role);
    event HandlerReset(uint256 indexed fruitId);
    event DebugInfo(
        string message,
        uint256 currentStatus,
        Status newStatus,
        Role userRole,
        address currentHandler,
        Role currentRole
    );

    // Modifiers kiểm tra quyền hạn
    modifier onlyOwner() {
        require(msg.sender == owner, "Chi chu so huu moi co quyen");
        _;
    }

    modifier onlyActiveUser() {
        require(users[msg.sender].isActive, "Tai khoan bi khoa");
        _;
    }

    modifier onlyRole(Role _role) {
        require(users[msg.sender].role == _role, "Khong co quyen");
        _;
    }

    modifier onlyAdmin() {
        require(
            users[msg.sender].role == Role.Admin && users[msg.sender].isActive,
            "Khong co quyen"
        );
        _;
    }

    // Constructor thiết lập người chủ sở hữu ban đầu
    constructor() {
        owner = msg.sender;
        users[owner] = User({
            name: "Admin",
            email: "",
            phoneNumber: "",
            role: Role.Admin,
            isActive: true
        });
        userAddresses.push(owner);
        emit UserAdded(owner, Role.Admin);
    }

    // Hàm thêm tài khoản mới
    function addAccount(
        address _account,
        Role _role,
        string memory _name,
        string memory _email,
        string memory _phoneNumber
    ) public onlyAdmin {
        require(_role != Role.None, "Vai tro khong hop le");
        require(users[_account].role == Role.None, "Tai khoan da ton tai");
        users[_account] = User({
            name: _name,
            email: _email,
            phoneNumber: _phoneNumber,
            role: _role,
            isActive: true
        });
        userAddresses.push(_account);
        emit UserAdded(_account, _role);
    }

    // Hàm xóa tài khoản (khóa tài khoản)
    function removeAccount(address _account) public onlyAdmin {
        require(users[_account].role != Role.None, "Tai khoan khong ton tai");
        users[_account].isActive = false;
        emit UserRemoved(_account);
    }

    // Hàm cập nhật vai trò người dùng
    function updateUserRole(address _account, Role _newRole) public onlyAdmin {
        require(users[_account].role != Role.None, "Tai khoan khong ton tai");
        require(_newRole != Role.None, "Vai tro moi khong hop le");
        users[_account].role = _newRole;
        emit UserRoleUpdated(_account, _newRole);
    }

    // Hàm lấy vai trò của tài khoản
    function getRole(address _account) public view returns (Role) {
        return users[_account].role;
    }

    // Hàm lấy thông tin người dùng
    function getUser(
        address _account
    )
        public
        view
        returns (string memory, string memory, string memory, Role, bool)
    {
        User memory user = users[_account];
        return (
            user.name,
            user.email,
            user.phoneNumber,
            user.role,
            user.isActive
        );
    }

    // Hàm lấy danh sách tất cả người dùng (chỉ Admin)
    function getAllUsers() public view onlyAdmin returns (address[] memory) {
        return userAddresses;
    }

    // Hàm thêm sản phẩm mới (chỉ Farmer)
    function addFruit(
        string memory _name,
        uint256 _price,
        uint256 _quantity,
        string memory _origin,
        uint256 _productionDate,
        uint256 _expirationDate,
        string memory _destination
    ) public onlyActiveUser onlyRole(Role.Farmer) {
        require(_productionDate < _expirationDate, "Ngay san xuat phai truoc ngay het han");

        fruitCount++;
        Fruit storage newFruit = fruits[fruitCount];
        newFruit.id = fruitCount;
        newFruit.owner = msg.sender;
        newFruit.name = _name;
        newFruit.price = _price;
        newFruit.quantity = _quantity;
        newFruit.origin = _origin;
        newFruit.productionDate = _productionDate;
        newFruit.expirationDate = _expirationDate;
        newFruit.destination = _destination;
        newFruit.status = Status.DangChuanBiHang;
        newFruit.currentHandler = address(0);
        newFruit.currentRole = Role.None;
        newFruit.history.push(
            UpdateHistory({
                status: Status.DangChuanBiHang,
                timestamp: block.timestamp,
                executor: msg.sender
            })
        );

        ownerToFruits[msg.sender].push(fruitCount);

        emit FruitAdded(fruitCount, _name);
    }

    // Hàm cập nhật trạng thái sản phẩm
   function updateStatus(uint256 _id, Status _status) public onlyActiveUser {
    require(_id > 0 && _id <= fruitCount, "Ma san pham khong hop le");

    Fruit storage fruit = fruits[_id];
    Role userRole = users[msg.sender].role;

    // Phát ra sự kiện DebugInfo trước khi kiểm tra chuyển đổi trạng thái
    emit DebugInfo(
        "Before isValidTransition",
        uint256(fruit.status),
        _status,
        userRole,
        fruit.currentHandler,
        fruit.currentRole
    );

    require(
        isValidTransition(fruit.status, _status),
        "Chuyen doi trang thai khong hop le"
    );

    if (userRole == Role.Farmer) {
        // Farmer có thể chuyển từ 0 sang 1
        require(fruit.owner == msg.sender, "Khong phai chu san pham");
        require(
            fruit.status == Status.DangChuanBiHang &&
                _status == Status.DangChoGiaoDenKho,
            "Chi duoc cap nhat tu 'DangChuanBiHang' sang 'Dang Cho Giao Den Kho Phan Loai'"
        );
        // Thiết lập currentHandler và currentRole
        _resetHandler(fruit);
    } else if (userRole == Role.Warehouse) {
        require(
            fruit.currentRole == Role.None || fruit.currentRole == Role.Warehouse,
            "San pham dang duoc xu ly boi vai tro khac"
        );

        if (
            fruit.status == Status.DangChoGiaoDenKho &&
            _status == Status.DangVanChuyenDenKho
        ) {
            fruit.currentHandler = msg.sender;
            fruit.currentRole = Role.Warehouse;
            warehouseToFruits[msg.sender].push(_id);
            emit HandlerAssigned(_id, msg.sender, Role.Warehouse);

            // Cập nhật trạng thái ngay lập tức và ghi lại lịch sử
            fruit.status = _status;
            fruit.history.push(
                UpdateHistory({
                    status: _status,
                    timestamp: block.timestamp,
                    executor: msg.sender
                })
            );
            emit StatusUpdated(_id, _status, msg.sender);

            // Thoát khỏi hàm sau khi xử lý chuyển đổi hợp lệ
            return;
        } else {
            require(
                fruit.currentHandler == msg.sender,
                "Khong duoc phep cap nhat san pham nay"
            );
        }

        // Xử lý các chuyển đổi trạng thái khác
        if (
            fruit.status == Status.DangVanChuyenDenKho &&
            _status == Status.DaDenKho
        ) {
            // Đã đến kho
        } else if (
            fruit.status == Status.DaDenKho &&
            _status == Status.DangPhanLoai
        ) {
            // Đang phân loại
        } else if (
            fruit.status == Status.DangPhanLoai &&
            _status == Status.DangKiemTraChatLuong
        ) {
            // Đang kiểm tra chất lượng
        } else if (
            fruit.status == Status.DangKiemTraChatLuong &&
            _status == Status.HangLoi_DangTraVeTrangTrai
        ) {
            // Hàng lỗi - Đang trả về trang trại
            // Không reset handler ở đây để giữ vai trò Warehouse tiếp tục xử lý
        } else if (
            fruit.status == Status.DangKiemTraChatLuong &&
            _status == Status.DonHangChoVanChuyen
        ) {
            // Đơn hàng chờ vận chuyển
            _resetHandler(fruit);
        } else if (
            fruit.status == Status.HangLoi_DangTraVeTrangTrai &&
            _status == Status.DaTraVeTrangTraiThanhCong
        ) {
            // Đã trả về trang trại thành công
            _resetHandler(fruit);
        } else if (
            fruit.status == Status.DaTraVeKho &&
            _status == Status.DaNhanHangTraVe
        ) {
            // Đã trả về kho và đã nhận hàng trả về
        } else if (
            fruit.status == Status.DaNhanHangTraVe &&
            (_status == Status.DangTraVeTrangTrai ||
                _status == Status.DonHangChoVanChuyen)
        ) {
            // Đang trả về trang trại hoặc đơn hàng sẵn sàng vận chuyển
            _resetHandler(fruit);
        } else if (
            fruit.status == Status.DangTraVeTrangTrai &&
            _status == Status.DaTraVeTrangTraiThanhCong
        ) {
            // Đã trả về trang trại thành công
            _resetHandler(fruit);
        } else {
            // Phát ra sự kiện DebugInfo khi sai thứ tự cập nhật trạng thái
            emit DebugInfo(
                "Sai thu tu cap nhat trang thai",
                uint256(fruit.status),
                _status,
                userRole,
                fruit.currentHandler,
                fruit.currentRole
            );
            revert("Sai thu tu cap nhat trang thai");
        }
    } else if (userRole == Role.Delivery) {
        require(
            fruit.currentRole == Role.None || fruit.currentRole == Role.Delivery,
            "San pham dang duoc xu ly boi vai tro khac"
        );

        if (
            fruit.status == Status.DonHangChoVanChuyen &&
            _status == Status.DangGiaoDenKhachHang
        ) {
            fruit.currentHandler = msg.sender;
            fruit.currentRole = Role.Delivery;
            deliveryAssignments[_id] = msg.sender;
            emit HandlerAssigned(_id, msg.sender, Role.Delivery);

            // Cập nhật trạng thái ngay lập tức và ghi lại lịch sử
            fruit.status = _status;
            fruit.history.push(
                UpdateHistory({
                    status: _status,
                    timestamp: block.timestamp,
                    executor: msg.sender
                })
            );
            emit StatusUpdated(_id, _status, msg.sender);

            // Thoát khỏi hàm sau khi xử lý chuyển đổi hợp lệ
            return;
        } else {
            require(
                fruit.currentHandler == msg.sender,
                "Khong duoc phep cap nhat san pham nay"
            );
        }

        // Xử lý các chuyển đổi trạng thái khác
        if (
            fruit.status == Status.DangGiaoDenKhachHang &&
            (_status == Status.GiaoHangThanhCong ||
                _status == Status.GiaoHangKhongThanhCong)
        ) {
            // Giao hàng thành công hoặc không thành công
            _resetHandler(fruit);
        } else if (
            fruit.status == Status.GiaoHangKhongThanhCong &&
            _status == Status.DangTraHangVeKho
        ) {
                warehouseToFruits[msg.sender].push(_id);
        } else if (
            fruit.status == Status.DangTraHangVeKho &&
            _status == Status.DaTraVeKho
        ) {
            // Đã trả về kho
            _resetHandler(fruit);
        } else {
            // Phát ra sự kiện DebugInfo khi sai thứ tự cập nhật trạng thái
            emit DebugInfo(
                "Sai thu tu cap nhat trang thai",
                uint256(fruit.status),
                _status,
                userRole,
                fruit.currentHandler,
                fruit.currentRole
            );
            revert("Sai thu tu cap nhat trang thai");
        }
    } else {
        // Phát ra sự kiện DebugInfo khi không có quyền cập nhật
        emit DebugInfo(
            "Khong co quyen cap nhat",
            uint256(fruit.status),
            _status,
            userRole,
            fruit.currentHandler,
            fruit.currentRole
        );
        revert("Khong co quyen cap nhat");
    }

    // Cập nhật trạng thái sản phẩm
    fruit.status = _status;
    // Ghi lại lịch sử cập nhật
    fruit.history.push(
        UpdateHistory({
            status: _status,
            timestamp: block.timestamp,
            executor: msg.sender
        })
    );
    emit StatusUpdated(_id, _status, msg.sender);
}


    // Hàm reset handler
function _resetHandler(Fruit storage fruit) internal {
    fruit.currentHandler = address(0);
    fruit.currentRole = Role.None;
    emit HandlerReset(fruit.id);
}

    // Hàm kiểm tra chuyển đổi trạng thái hợp lệ
    function isValidTransition(
        Status _current,
        Status _new
    ) internal pure returns (bool) {
        if (
            _current == Status.DangChuanBiHang &&
            _new == Status.DangChoGiaoDenKho
        ) return true;
        if (
            _current == Status.DangChoGiaoDenKho &&
            _new == Status.DangVanChuyenDenKho
        ) return true;
        if (_current == Status.DangVanChuyenDenKho && _new == Status.DaDenKho)
            return true;
        if (_current == Status.DaDenKho && _new == Status.DangPhanLoai)
            return true;
        if (
            _current == Status.DangPhanLoai &&
            _new == Status.DangKiemTraChatLuong
        ) return true;
        if (
            _current == Status.DangKiemTraChatLuong &&
            (_new == Status.HangLoi_DangTraVeTrangTrai ||
                _new == Status.DonHangChoVanChuyen)
        ) return true;
        if (
            _current == Status.HangLoi_DangTraVeTrangTrai &&
            _new == Status.DaTraVeTrangTraiThanhCong
        ) return true;
        if (
            _current == Status.DonHangChoVanChuyen &&
            _new == Status.DangGiaoDenKhachHang
        ) return true;
        if (
            _current == Status.DangGiaoDenKhachHang &&
            (_new == Status.GiaoHangThanhCong ||
                _new == Status.GiaoHangKhongThanhCong)
        ) return true;
        if (
            _current == Status.GiaoHangKhongThanhCong &&
            _new == Status.DangTraHangVeKho
        ) return true;
        if (_current == Status.DangTraHangVeKho && _new == Status.DaTraVeKho)
            return true;
        if (_current == Status.DaTraVeKho && _new == Status.DaNhanHangTraVe)
            return true;
        if (
            _current == Status.DaNhanHangTraVe &&
            (_new == Status.DangTraVeTrangTrai ||
                _new == Status.DonHangChoVanChuyen)
        ) return true;
        if (
            _current == Status.DangTraVeTrangTrai &&
            _new == Status.DaTraVeTrangTraiThanhCong
        ) return true;
        return false;
    }

    // Hàm lấy thông tin sản phẩm theo ID
    function getFruit(uint256 _id) public view returns (Fruit memory) {
        require(_id > 0 && _id <= fruitCount, "Ma san pham khong hop le");
        Fruit memory fruit = fruits[_id];
        return fruit;
    }

    // Hàm lấy lịch sử cập nhật trạng thái của sản phẩm
    function getUpdateHistory(
        uint256 _id
    )
        public
        view
        returns (
            Status[] memory statuses,
            uint256[] memory timestamps,
            address[] memory executors
        )
    {
        require(_id > 0 && _id <= fruitCount, "Ma san pham khong hop le");
        UpdateHistory[] memory history = fruits[_id].history;
        uint256 length = history.length;
        statuses = new Status[](length);
        timestamps = new uint256[](length);
        executors = new address[](length);
        for (uint256 i = 0; i < length; i++) {
            statuses[i] = history[i].status;
            timestamps[i] = history[i].timestamp;
            executors[i] = history[i].executor;
        }
    }

    // Hàm lấy danh sách sản phẩm của chủ nông trại
    function getFruitsByOwner(
        address _owner
    ) public view returns (uint256[] memory) {
        return ownerToFruits[_owner];
    }
    
    // Hàm lấy danh sách sản phẩm của kho phân loại
    function getFruitsByWarehouse(
        address _warehouse
    ) public view returns (uint256[] memory) {
        return warehouseToFruits[_warehouse];
    }

    // Hàm lấy người giao hàng được gán cho sản phẩm
    function getDeliveryAssignment(uint256 _id) public view returns (address) {
        return deliveryAssignments[_id];
    }
}
