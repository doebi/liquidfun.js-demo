const fs = require("fs");

const readOrUndefined = (path, shouldWarn = false) => {
	const filePath = __dirname + '/secrets/' + path;
	if (!fs.existsSync(filePath)) {
		if (shouldWarn) console.warn(`"${filePath}" is missing!`)

		return undefined
	};

	return fs.readFileSync(filePath, 'utf8');
}

module.exports = {
	cert: readOrUndefined('server.crt', true),
	key: readOrUndefined('server.key', true),
	passphrase: readOrUndefined('passphrase.txt'),
};
