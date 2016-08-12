# Yodel

Yodel wraps JavaScript's native `fetch` API (the new replacement for XMLHTTPRequest) with added model validation. 

`yodel` accepts the following configuration:

- `url`: The AJAX endpoint. Query parameters can be included here and/or at request time.
- `request`: Optional overrides for the [fetch configuration defaults](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#Supplying_request_options).
- `transform`: An optional method which can perform arbitrary transformations on validated data.
- `validation`: An object that mirrors the data you expect, with validation rules in place of values.

Supported validation types:

- type [string]: 'string', 'number', 'boolean', 'array'
- required [boolean]: true, false (false enforces that the field does not exist)
- regex [regular expression]: Regular expression literal
- date [boolean]: true, false (enforces that the field can or cannot be parsed by JavaScript's native Date object)
- custom [function]: a function that is passed the field and returns true or false
- minLength [number]: enforces that the value has a length property greater than or equal to this number
- maxLength [number]: enforces that the value has a length property less than or equal to this number
- length [number]: enforces that the value has a length property that equals this number
- min [number]: enforces that the value is greater than or equal to this value (does not enforce type)
- max [number]: enforces that the value is less than or equal to this value (does not enforce type)
- equal [any]: enforces that the value is this value (enforces type)

`yodel` returns an object with the following methods:

- `get([object] params)`: Performs an HTTP GET request. Supplied params are converted to query string parameters. Returns a promise that resolves with the JSON-parsed response.
- `delete([object] params)`: Same API as `get`, but performs an HTTP DELETE.
- `post([FormData] body, [object] params)`: Performs an HTTP POST request. See the [fetch post documentation](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#Body). Supplied params are converted to query string parameters. Returns a promise that resolves with the JSON-parsed response.
- `put([FormData] body, [object] params)`: Same API as `post`, but performs an HTTP PUT.

## Example

```javascript
const users = yodel({
  url: 'http://jsonplaceholder.typicode.com/users',
  request: {
    mode: 'cors',
    cache: 'default'
  },
  transform: data => {
    data.transformed = true;
  },
  validation: [
    {
      id: {
        type: 'number',
        required: true,
        min: 1,
        max: 10
      },
      name: {
        type: 'string',
        required: true,
        minLength: 1,
        maxLength: 255
      },
      address: {
        street: {
          type: 'string',
          required: true,
          custom: data => {
            return true;
          }
        },
        zipcode: {
          regex: /\d+/
        }
      }
    }
  ]
});
 
users.get().then(data => {
  console.log(data);
}).catch(error => {
  console.error(error);
});
```

## Browser Support

See the [fetch documentation](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#The_state_of_browser_support) for current browser support and polyfills. Additionally, Yodel uses ES2015, and may require transpilation for browsers other than Chrome and Firefox.
