# HAT Sync Tools

### How to use it

1. Start MongoDB and node server from project root directory

  ```bash
  mongod
  node bin/www
  ```

2. Visit homepage passing in hat access token as query parameter

  ```
  http://localhost:3000?hat_token=12345
  ```

3. Click "Sync with Facebook" to grant access rights and generate user access token

4. Data is pulled from Facebook by visiting update endpoint hat access token as query parameter

  ```
  http://localhost:3000/facebook/update?hat_token=12345
  ```