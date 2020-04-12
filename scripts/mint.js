
const { ethers, getNamedAccounts} = require('@nomiclabs/buidler');

const args = process.argv;
console.log(args);

const contractName = 'EIP721ExampleWithWrongBytesMetadata';
const userName = 'tester';

async function main() {
    const namedAccounts = await getNamedAccounts();
    let account = namedAccounts[userName];
    const contract = await ethers.getContract(contractName, account);
    const receipt = await contract.mint(account).then(tx => tx.wait());
    console.log(receipt.gasUsed);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });