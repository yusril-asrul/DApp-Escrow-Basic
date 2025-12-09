const contractAddress = "0xB0963b91D4B382dBAF0573B9E3E60f16855ff2B5";
const ABI = [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_client",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_designer",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "FailedCall",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "balance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "needed",
				"type": "uint256"
			}
		],
		"name": "InsufficientBalance",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "designer",
				"type": "address"
			}
		],
		"name": "Delivered",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "client",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "Funded",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "client",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "Refunded",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "designer",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "Released",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "client",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "designer",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "fundEscrow",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "markAsDelivered",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "refundClient",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "releasePayment",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "status",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

function loading(status) {
    let elm = document.querySelector('.loading');
    if (status) {
        elm.classList.remove('d-none')
    } else {
        elm.classList.add('d-none')
    }
}

let provider,signer,contract;

async function connectWallet() {
    if (!window.ethereum) {
        alert("MetaMask tidak ditemukan!");return;
    }
    provider = new ethers.BrowserProvider(window.ethereum);
    loading(true)
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    contract = new ethers.Contract(contractAddress, ABI, signer);

    let client = await contract.client()
    let designer = await contract.designer()
    await loadStatus();
    await loadBalance();

    document.getElementById("display-akun").innerText = signer.address
    document.getElementById("display-client").innerText = client
    document.getElementById("display-designer").innerText = designer

    document.getElementById('view-1').classList.add('d-none')
    document.getElementById('view-2').classList.remove('d-none')

    loading(false)
}

async function loadStatus() {
    let _status = await contract.status()

    let s;
    switch(_status){
        case 0n:
            s = "Created";break;
        case 1n:
            s = "Funded";break;
        case 2n:
            s = "Delivered";break;
        case 3n:
            s = "Released";break;
        case 4n:
            s = "Refunded";break;
    }

    document.getElementById("display-status").innerText = s
}

async function loadBalance() {
    let saldoWei = await provider.getBalance(contractAddress);
    let saldoETH = ethers.formatEther(saldoWei);
    document.getElementById("display-saldo").innerText = saldoETH+' ETH'
}

function errorHandling(err) {
    let message =
        err?.reason ||
        err?.revert?.args?.[0] ||
        err?.info?.error?.message ||
        err?.message ||
        'Transaksi gagal';

    alert(message);
}

document.getElementById('btn-fund').onclick = async () => {
    let amount = document.getElementById('amount').value;
    if (amount == '') { alert('Isi jumlah eth'); return }

    try {
        const tx = await contract.fundEscrow({
            value: ethers.parseEther(amount)
        });
        await tx.wait();
        await loadStatus();
        await loadBalance();
    } catch(err){
        errorHandling(err)
    }
}

document.getElementById('btn-delivered').onclick = async () => {
    try {
        const tx = await contract.markAsDelivered();
        await tx.wait();
        await loadStatus();
    } catch(err){
        errorHandling(err)
    }
}

document.getElementById('btn-release').onclick = async () => {
    try {
        const tx = await contract.releasePayment();
        await tx.wait();
        await loadStatus();
        await loadBalance();
    } catch(err){
        errorHandling(err)
    }
}

document.getElementById('btn-refund').onclick = async () => {
    try {
        const tx = await contract.refundClient();
        await tx.wait();
        await loadStatus();
        await loadBalance();
    } catch(err){
        errorHandling(err)
    }
}