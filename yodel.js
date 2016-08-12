(() => {

  function enforce(v, rule) {

    return v.okay ? '' : 
      `${v.key} did not pass the validation "${rule}: ${v.expected}". Actual value was ${v.value}.\n\n`;

  }

  const enforcers = {

    type: v => {

      v.expected = v.expected.toLowerCase();
      
      v.okay = v.expected === 'array'
            ? Array.isArray(v.value)
            : typeof v.value === v.expected;

      return enforce(v, 'type');

    },

    required: v => {

      v.okay = v.expected ? v.value : !v.value;

      return enforce(v, 'required');

    },

    regex: v => {

      v.okay = v.value.toString().match(v.expected);

      return enforce(v, 'regex');

    },

    date: v => {

      const validDate = Date.parse(v.value) >= 0;

      v.okay = v.expected ? validDate : !validDate;

      return enforce(v, 'date');

    },

    custom: v => {

      v.okay = v.expected(v.value);

      return enforce(v, 'custom');

    },

    minLength: v => {

      v.okay = v.value.length >= v.expected;

      return enforce(v, 'minLength');

    },

    length: v => {

      v.okay = v.value.length === v.expected;

      return enforce(v, 'length');

    },

    maxLength: v => {

      v.okay = v.value.length <= v.expected;

      return enforce(v, 'maxLength');

    },

    min: v => {

      v.okay = v.value >= v.expected;

      return enforce(v, 'min');

    },

    max: v => {

      v.okay = v.value <= v.expected;

      return enforce(v, 'max');

    },

    equal: v => {

      v.okay = v.value === v.expected;

      return enforce(v, 'equal');

    }

  };

  function findErrors(data, rules) {

    let error = '';

    if (Array.isArray(rules)) {

      error += enforcers.type({
        expected: 'array',
        key: 'data',
        value: data
      });

      if (!error) {

        data.forEach(datum => {
          error += findErrors(datum, rules[0]);
        });

      }

    } else if (typeof rules === 'object') {

      Object.keys(rules).forEach(key => {

        const rule = rules[key],
          value = data[key];

        if (Array.isArray(rule) || typeof value === 'object') {
          
          error += findErrors(value, rule);

        } else if (typeof value !== 'undefined' || rule.required) {

          Object.keys(rule).forEach(ruleName => {

            error += enforcers[ruleName]({
              expected: rule[ruleName],
              key: key,
              value: value
            });

          });

        }

      });

    }

    return error;

  }

  function process(config) {

    return data => {

      const error = findErrors(data, config.validation);

      return new Promise((resolve, reject) => {

        if (error) {
          
          reject(error);

        } else if (typeof config.transform === 'function') {

          config.transform(data);

        }

        resolve(data);

      });

    };

  }

  function serialize(url, data) {

    if (data) {

      const queryString = Object.keys(data).map(key => {

        return `${key}=${data[key]}`;

      }).join('&');

      url += url.indexOf('?') === -1 ? '?' : '&';

      url += queryString;

    }

    return url;

  }

  function http(method, config, params, body) {

    config.request        = config.request || {};
    config.request.method = method;
    config.request.body   = body;

    return fetch(serialize(config.url, params), config.request).then(res => {

      return res.json().then(process(config));

    });

  }

  window.yodel = config => {

    return {

      get: params => {

        return http('GET', config, params);

      },

      delete: params => {

        return http('DELETE', config, params);

      },

      post: (body, params) => {

        return http('POST', config, params, body);

      },

      put: (body, params) => {

        return http('PUT', config, params, body);

      }

    };

  };

})()
