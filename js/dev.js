const near = new nearApi.Near({
  keyStore: new nearApi.keyStores.BrowserLocalStorageKeyStore(),
  networkId: 'testnet',
  nodeUrl: 'https://rpc.testnet.near.org',
  walletUrl: 'https://wallet.testnet.near.org'
});

const wallet = new nearApi.WalletConnection(near, 'my-app');

document.getElementById('sign-out-button').addEventListener('click', () => {
  wallet.signOut()
  window.location.replace(window.location.origin + window.location.pathname)
  alert("signed out, please go to the home page now");
});
