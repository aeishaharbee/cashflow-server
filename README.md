# A server for CashFlow

This is a MongoDB connected server.

## Getting started

To set up this server project locally, follow these steps:
1. Create an account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and follow the steps.

2. Deploy your cluster

3. Connect to your cluster by choosing the "Drivers" option (first option)

4. Copy the connection string provided for later use.  

5. Creat a new folder. Inside the folder, create two new folders called 'client' and 'server'.

6. Inside the server file, clone the repository:
   ```
   git clone https://github.com/aeishaharbee/cashflow-server.git
   ```

7. Install the following dependencies:
   ```
   npm install
   ```

8. Create a .env file and add the following environment variables:
   ```
   SECRET_KEY=your_secret_key
   MONGODB_URI=your_connection_string_from_MongoDB_Atlas
   ```

9. Run the development servers:
   ```npm start```

10. If you see below lines, you've successfully connected to the server.
   ```
   Server is running on PORT: 5000
   Database is connected
   ```
