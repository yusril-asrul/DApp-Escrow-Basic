// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract LogoDesignEscrow is ReentrancyGuard  {
    using Address for address payable;

    address public client;
    address public designer;
    uint public status;
    // 0 = created, 1 = funded, 2 = delivery, 3 = realesed, 4 = refunded

    modifier onlyClient() {
        require(msg.sender == client, "Only client allowed");
        _;
    }

    modifier onlyDesigner() {
        require(msg.sender == designer, "Only designer allowed");
        _;
    }

    modifier inStatus(uint expected) {
        require(status == expected, "Invalid status");
        _;
    }

    event Funded(address indexed client, uint256 amount);
    event Delivered(address indexed designer);
    event Released(address indexed designer, uint256 amount);
    event Refunded(address indexed client, uint256 amount);

    constructor(address _client, address _designer) {
        require(_client != address(0),"Invalid client address");
        require(_designer != address(0),"Invalid designer address");
        require(_client != _designer,"Client and designer cannot be the same");
        client = _client;
        designer = _designer;
    }

    // Klien mengirim dana ke escrow
    function fundEscrow() external payable onlyClient inStatus(0) {
        require(msg.value > 0, "ETH required");
        status = 1;
        emit Funded(msg.sender, msg.value);
    }

     // Desainer menyatakan logo sudah dikirim
    function markAsDelivered() external onlyDesigner inStatus(1) {
        status = 2;
        emit Delivered(msg.sender);
    }

    // Klien menyetujui hasil dan melepas dana ke desainer
    function releasePayment() external onlyClient inStatus(2) nonReentrant {
        uint256 amount = address(this).balance;
        status = 3;
        payable(designer).sendValue(amount);
        emit Released(designer, amount);
    }

    // Klien membatalkan dan mengambil kembali dana
    function refundClient() external onlyClient inStatus(2) nonReentrant {
        uint256 amount = address(this).balance;
        status = 4;
        payable(client).sendValue(amount);
        emit Refunded(client, amount);
    }

}