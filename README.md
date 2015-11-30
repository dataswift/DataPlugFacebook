![Hub of All things](http://hubofallthings.com/wp-content/uploads/banner21.png)

# HAT Sync Tools

### How to use it

1. Install npm modules, make sure MongoDB is running and start node server from project root directory.

  ```bash
  npm install
  mongod
  node bin/www
  ```

2. Visit homepage passing in HAT access token as query parameter.

  ```
  http://localhost:3000?hat\_token=$HAT\_ACCESS_TOKEN
  ```

3. Click "Authorize with Facebook" to grant access rights and generate user access token.

4. Initialize Data Source Model for a particular none by visiting:

  ```
  http://localhost:3000/facebook/$NODE\_NAME/init?hat\_token=$HAT\_ACCESS_TOKEN
  ```

5. Data synchronisation is initialised by visiting update endpoints for a particular node with HAT access token as query parameter.

  ```
  http://localhost:3000/facebook/$NODE\_NAME/update?hat\_token=$HAT\_ACCESS_TOKEN
  ```


Currently supported node names:

* profile
* posts
* events

### To Do

1. FB time filter to effectively handle updates after initial synchronisation
2. Scheduler allowing updates to run in a background
3. Improve error handling
4. Support Graph Access Token renewal
6. Unit tests

## License

This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit [http://creativecommons.org/licenses/by-nc-nd/4.0/](http://creativecommons.org/licenses/by-nc-nd/4.0/) or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.