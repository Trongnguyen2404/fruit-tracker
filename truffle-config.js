module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",
    },
  },
  contracts_directory: './contracts/',
  contracts_build_directory: './src/',
  compilers: {
    solc: {
      version: "0.8.0",
      settings: {
        optimizer: {
          enabled: true, // Sử dụng đúng từ khóa
          runs: 10000,     // Điều chỉnh theo nhu cầu
        },
      },
    },
  },
};
