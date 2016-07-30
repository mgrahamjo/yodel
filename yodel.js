(() => {

	function enforce(v) {

		return v.okay ? '' : `${v.key} did not pass the validation "${v.rule}: ${v.expected}". Actual value was ${v.value}.\n\n`;

	}

	const enforcers = {

		type: v => {

			v.rule = 'type';

			v.expected = v.expected.toLowerCase();
			
			v.okay = v.expected === 'array'
						? Array.isArray(v.value)
						: typeof v.value === v.expected;

			return enforce(v);

		},

		required: v => {

			v.rule = 'required';

			v.okay = v.expected ? v.value : !v.value;

			return enforce(v);

		},

		regex: v => {

			v.rule = 'regex';

			v.okay = v.value.toString().match(v.expected);

			return enforce(v);

		},

		date: v => {

			let validDate = Date.parse(v.value) >= 0;

			v.rule = 'date';

			v.okay = v.expected ? validDate : !validDate;

			return enforce(v);

		},

		custom: v => {

			v.rule = 'custom';

			v.okay = v.expected(v.value);

			return enforce(v);

		}
	}

	function validate(data, rules) {

		let error = '';

		if (Array.isArray(rules)) {

			error += enforcers.type({
				expected: 'array',
				key: 'data',
				value: data
			});

			if (!error) {

				data.forEach(datum => {
					error += validate(datum, rules[0]);
				});

			}

		} else if (typeof rules === 'object') {

			Object.keys(rules).forEach(key => {

				let rule = rules[key],
					value = data[key];

				if ((!Array.isArray(value)) && typeof value === 'object') {
					
					error += validate(value, rule);

				} else {

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

			let error = validate(data, config.validation);

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

			let queryString = Object.keys(data).map(key => {

				return `${key}=${data[key]}`;

			}).join('&');

			url += url.indexOf('?') === -1 ? '?' : '&';

			url += queryString;

		}

		return url;

	}

	function http(method, config, params, body) {

		config.request 		  = config.request || {};
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