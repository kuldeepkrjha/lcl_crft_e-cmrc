// Install required packages: npm install express pg bcrypt body-parser

const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const pg = require('pg');
const { Client } = pg;
const Web3 = require('web3');
const contractABI = require('./UserDataStorageABI.json'); // Replace with contract ABI

const web3 = new Web3('https://mainnet.infura.io/v3/_INFURA_API_KEY'); // Replace with Infura API key
const contractAddress = '0xContractAddress'; // Replace with contract address

const userDataContract = new web3.eth.Contract(contractABI, contractAddress);


const app = express();
const port = 3000;

app.use(bodyParser.json());

const db = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'dbname', // Replace with  actual database name
  password: 'dbpassword', // Replace with  actual database password
  port: 5432,
});

db.connect();

// Middleware to check user roles
const checkRole = (requiredRole) => (req, res, next) => {
  if (req.user && req.user.role === requiredRole) {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden' });
  }
};

// Registration and Login for Sellers
app.post('/api/register/seller', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.query('INSERT INTO sellers (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *', [username, email, passwordHash]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/login/seller', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await db.query('SELECT * FROM sellers WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, result.rows[0].password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({ message: 'Login successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Registration and Login for Buyers
app.post('/api/register/buyer', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.query('INSERT INTO buyers (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *', [username, email, passwordHash]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/login/buyer', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await db.query('SELECT * FROM buyers WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, result.rows[0].password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({ message: 'Login successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Registration and Login for Admins
app.post('/api/register/admin', async (req, res) => {
  try {
    // Admin registration logic, similar to buyer and seller registration
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/login/admin', async (req, res) => {
  try {
    // Admin login logic, similar to buyer and seller login
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Registration and Login for Maintainers
app.post('/api/register/maintainer', async (req, res) => {
  try {
    // Maintainer registration logic, similar to buyer and seller registration
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/login/maintainer', async (req, res) => {
  try {
    // Maintainer login logic, similar to buyer and seller login
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Product Listing
app.get('/api/products', async (req, res) => {
  try {
    const products = await db.query('SELECT * FROM products');
    res.json(products.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Buying Products
app.post('/api/buy', checkRole('buyer'), async (req, res) => {
  try {
    const { buyerId, productId, quantity } = req.body;

    // Ensure the product is available in sufficient quantity
    const product = await db.query('SELECT stock_quantity, price FROM products WHERE id = $1', [productId]);

    if (!product.rows.length || product.rows[0].stock_quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock or invalid product' });
    }

    const totalPrice = product.rows[0].price * quantity;

    // Deduct the purchased quantity from stock
    await db.query('UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2', [quantity, productId]);

    // Insert into orders table
    await db.query('INSERT INTO orders (buyer_id, product_id, quantity, total_price) VALUES ($1, $2, $3, $4)', [buyerId, productId, quantity, totalPrice]);

    res.json({ message: 'Purchase successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Product Recommendation Endpoint
app.get('/api/recommendations/:buyerId', async (req, res) => {
  try {
    const buyerId = req.params.buyerId;

    // Fetch historical data of products viewed and selected by the buyer
    const buyerHistory = await db.query('SELECT product_id, rating FROM buyer_history WHERE buyer_id = $1', [buyerId]);

    // Use the recommendation model to generate product recommendations
    const recommendations = model.predict(buyerId, buyerHistory.map(item => [item.product_id]));

    // Return the recommended products
    res.json(recommendations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Function to store user data reference on blockchain
async function storeUserDataReferenceOnBlockchain(entity, entityId, backupReference) {
  const accounts = await web3.eth.getAccounts();
  await userDataContract.methods.storeDataReference(entity, entityId, backupReference).send({ from: accounts[0] });
}

// Function to retrieve user data reference from blockchain
async function getUserDataReferenceFromBlockchain(entity, entityId) {
  const reference = await userDataContract.methods.getDataReference(entity, entityId).call();
  return reference;
}

// Function to backup and store references for different entities
async function backupAndStoreReferences() {
  const adminBackupReference = await backupAndStoreAdminData();
  const maintainerBackupReference = await backupAndStoreMaintainerData();
  const buyerBackupReference = await backupAndStoreBuyerData();
  const sellerBackupReference = await backupAndStoreSellerData();
  const productBackupReference = await backupAndStoreProductData();

  // Store references on the blockchain
  await storeUserDataReferenceOnBlockchain('admin', 'adminBackupId', adminBackupReference);
  await storeUserDataReferenceOnBlockchain('maintainer', 'maintainerBackupId', maintainerBackupReference);
  await storeUserDataReferenceOnBlockchain('buyer', 'buyerBackupId', buyerBackupReference);
  await storeUserDataReferenceOnBlockchain('seller', 'sellerBackupId', sellerBackupReference);
  await storeUserDataReferenceOnBlockchain('product', 'productBackupId', productBackupReference);
}


// ... (additional routes as needed)

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
