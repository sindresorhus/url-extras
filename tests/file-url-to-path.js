import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath, pathToFileURL} from '../index.js';

const isWindows = process.platform === 'win32';

test('Unix paths', () => {
	assert.strictEqual(fileURLToPath('file:///Users/user/file.txt'), '/Users/user/file.txt');
	assert.strictEqual(fileURLToPath('file:///home/user/file.txt'), '/home/user/file.txt');
	assert.strictEqual(fileURLToPath('file:///path/to/file'), '/path/to/file');
});

test('drive letter paths (platform-aware)', () => {
	if (isWindows) {
		assert.strictEqual(fileURLToPath('file:///C:/Users/user/file.txt'), 'C:\\Users\\user\\file.txt');
		assert.strictEqual(fileURLToPath('file:///D:/path/to/file'), 'D:\\path\\to\\file');
		assert.strictEqual(fileURLToPath('file:///c:/windows/system32'), 'c:\\windows\\system32');
	} else {
		// On Unix, drive letter patterns in URLs remain as-is in the path
		assert.strictEqual(fileURLToPath('file:///C:/Users/user/file.txt'), '/C:/Users/user/file.txt');
		assert.strictEqual(fileURLToPath('file:///D:/path/to/file'), '/D:/path/to/file');
		assert.strictEqual(fileURLToPath('file:///c:/windows/system32'), '/c:/windows/system32');
	}
});

test('UNC paths (platform-aware)', () => {
	if (isWindows) {
		// On Windows: UNC paths use backslashes
		assert.strictEqual(fileURLToPath('file://server/share/file.txt'), '\\\\server\\share\\file.txt');
		assert.strictEqual(fileURLToPath('file://hostname/path/to/file'), '\\\\hostname\\path\\to\\file');
	} else {
		// On Unix: hostnames (except localhost) throw an error
		assert.throws(() => fileURLToPath('file://server/share/file.txt'), TypeError);
		assert.throws(() => fileURLToPath('file://hostname/path/to/file'), TypeError);
	}
});

test('URL-encoded characters', () => {
	assert.strictEqual(fileURLToPath('file:///path/with%20spaces'), '/path/with spaces');
	assert.strictEqual(fileURLToPath('file:///path/%E4%BD%A0%E5%A5%BD'), '/path/你好');

	if (isWindows) {
		assert.strictEqual(fileURLToPath('file:///C:/Program%20Files/App'), 'C:\\Program Files\\App');
	} else {
		assert.strictEqual(fileURLToPath('file:///C:/Program%20Files/App'), '/C:/Program Files/App');
	}
});

test('accepts URL object', () => {
	const url = new URL('file:///Users/user/file.txt');
	assert.strictEqual(fileURLToPath(url), '/Users/user/file.txt');
});

test('throws on non-file URL', () => {
	assert.throws(
		() => fileURLToPath('https://example.com'),
		{
			name: 'TypeError',
			message: 'The URL must be a file URL',
		},
	);

	assert.throws(
		() => fileURLToPath('http://localhost/path'),
		{
			name: 'TypeError',
			message: 'The URL must be a file URL',
		},
	);
});

test('root path edge cases', () => {
	assert.strictEqual(fileURLToPath('file:///'), '/');
	assert.strictEqual(fileURLToPath('file:///path'), '/path');
});

test('special characters', () => {
	// Encoded forward slashes throw (Node.js behavior)
	assert.throws(
		() => fileURLToPath('file:///path/%2F'),
		{
			name: 'TypeError',
			message: /encoded/,
		},
	);

	// Other special characters are allowed
	assert.strictEqual(fileURLToPath('file:///path/%23'), '/path/#');
	assert.strictEqual(fileURLToPath('file:///path/%3F'), '/path/?');
});

test('Unicode characters', () => {
	assert.strictEqual(fileURLToPath('file:///path/%E2%9C%93'), '/path/✓');
	assert.strictEqual(fileURLToPath('file:///path/%F0%9F%91%8D'), '/path/👍');
	assert.strictEqual(fileURLToPath('file:///%E6%97%A5%E6%9C%AC%E8%AA%9E'), '/日本語');
});

test('empty hostname (localhost)', () => {
	assert.strictEqual(fileURLToPath('file://localhost/path'), '/path');
});

test('multiple slashes', () => {
	assert.strictEqual(fileURLToPath('file:///path//to///file'), '/path//to///file');
});

test('dot segments', () => {
	assert.strictEqual(fileURLToPath('file:///path/./to/file'), '/path/to/file');
	assert.strictEqual(fileURLToPath('file:///path/../to/file'), '/to/file');
});

test('drive edge cases (platform-aware)', () => {
	if (isWindows) {
		assert.strictEqual(fileURLToPath('file:///A:/'), 'A:\\');
		assert.strictEqual(fileURLToPath('file:///Z:/file'), 'Z:\\file');
		assert.strictEqual(fileURLToPath('file:///c:/test'), 'c:\\test');
		assert.strictEqual(fileURLToPath('file:///C:/test'), 'C:\\test');
	} else {
		assert.strictEqual(fileURLToPath('file:///A:/'), '/A:/');
		assert.strictEqual(fileURLToPath('file:///Z:/file'), '/Z:/file');
		assert.strictEqual(fileURLToPath('file:///c:/test'), '/c:/test');
		assert.strictEqual(fileURLToPath('file:///C:/test'), '/C:/test');
	}
});

test('trailing slashes', () => {
	assert.strictEqual(fileURLToPath('file:///path/to/dir/'), '/path/to/dir/');

	if (isWindows) {
		assert.strictEqual(fileURLToPath('file:///C:/path/to/dir/'), 'C:\\path\\to\\dir\\');
	} else {
		assert.strictEqual(fileURLToPath('file:///C:/path/to/dir/'), '/C:/path/to/dir/');
	}
});

test('round-trip Unix paths', () => {
	const paths = [
		'/Users/user/file.txt',
		'/home/user/file.txt',
		'/path/to/file',
		'/path/with spaces',
	];

	for (const path of paths) {
		const url = pathToFileURL(path).href;
		assert.strictEqual(fileURLToPath(url), path);
	}
});

test('round-trip Windows drive letter paths', () => {
	const paths = [
		['C:\\Users\\user\\file.txt', 'file:///C:/Users/user/file.txt'], // Case preserved
		['D:\\path\\to\\file', 'file:///D:/path/to/file'], // Case preserved
	];

	for (const [path, expectedUrl] of paths) {
		const url = pathToFileURL(path, {windows: true}).href;
		assert.strictEqual(url, expectedUrl);

		// With explicit windows: true, the round-trip should work
		const result = fileURLToPath(url, {windows: true});
		assert.strictEqual(result.toLowerCase(), path.toLowerCase());
	}
});

test('round-trip UNC paths (platform-aware)', () => {
	const paths = [
		['\\\\server\\share\\file.txt', 'file://server/share/file.txt'],
		['\\\\hostname\\path\\to\\file', 'file://hostname/path/to/file'],
	];

	for (const [path, expectedUrl] of paths) {
		const url = pathToFileURL(path, {windows: true}).href;
		assert.strictEqual(url, expectedUrl);

		// With explicit windows: true, UNC paths work
		assert.strictEqual(fileURLToPath(url, {windows: true}), path);
	}
});

test('round-trip Windows drive root', () => {
	// Drive root produces double slash: C:\ → file:///C://
	const rootUrl = pathToFileURL('C:\\', {windows: true});
	assert.strictEqual(rootUrl.href, 'file:///C://');

	// Round-trip adds trailing backslash (Node.js behavior)
	const backToPath = fileURLToPath(rootUrl, {windows: true});
	assert.strictEqual(backToPath, 'C:\\\\');

	// Test with different drive letters
	for (const drive of ['A', 'D', 'Z']) {
		const url = pathToFileURL(`${drive}:\\`, {windows: true});
		assert.strictEqual(url.href, `file:///${drive}://`);
		// Round-trip produces path with trailing backslash
		assert.strictEqual(fileURLToPath(url, {windows: true}), `${drive}:\\\\`);
	}
});

test('error messages', () => {
	assert.throws(
		() => fileURLToPath('https://example.com'),
		{
			name: 'TypeError',
			message: /file URL/,
		},
	);
});

test('case-insensitive scheme', () => {
	assert.strictEqual(fileURLToPath('FILE:///test'), '/test');
	assert.strictEqual(fileURLToPath('File:///test'), '/test');
	assert.strictEqual(fileURLToPath('file:///test'), '/test');
});

test('rejects non-file schemes', () => {
	assert.throws(() => fileURLToPath('http://example.com'), TypeError);
	assert.throws(() => fileURLToPath('https://example.com'), TypeError);
	assert.throws(() => fileURLToPath('ftp://server/file'), TypeError);
});

test('ignores search and hash', () => {
	assert.strictEqual(fileURLToPath('file:///a/b%20c?x#y'), '/a/b c');
	assert.strictEqual(fileURLToPath('file:///path?query=value'), '/path');
	assert.strictEqual(fileURLToPath('file:///path#fragment'), '/path');
});

test('percent sequence edge cases', () => {
	assert.strictEqual(fileURLToPath('file:///a/%25/b'), '/a/%/b');
	assert.strictEqual(fileURLToPath('file:///a/%252F/b'), '/a/%2F/b');
});

test('localhost handling', () => {
	assert.strictEqual(fileURLToPath('file://localhost/path'), '/path');

	if (isWindows) {
		assert.strictEqual(fileURLToPath('file://localhost/C:/test'), 'C:\\test');
	} else {
		assert.strictEqual(fileURLToPath('file://localhost/C:/test'), '/C:/test');
	}
});

test('accepts both URL object and string', () => {
	const urlString = 'file:///test';
	const urlObject = new URL(urlString);
	assert.strictEqual(fileURLToPath(urlString), '/test');
	assert.strictEqual(fileURLToPath(urlObject), '/test');
});

test('throws on non-string, non-URL inputs', () => {
	assert.throws(
		() => fileURLToPath(123),
		{
			name: 'TypeError',
			message: 'Expected `string` or `URL`, got `number`',
		},
	);

	assert.throws(
		() => fileURLToPath(null),
		{
			name: 'TypeError',
			message: 'Expected `string` or `URL`, got `object`',
		},
	);

	assert.throws(
		() => fileURLToPath({}),
		{
			name: 'TypeError',
			message: 'Expected `string` or `URL`, got `object`',
		},
	);

	assert.throws(
		() => fileURLToPath(undefined),
		{
			name: 'TypeError',
			message: 'Expected `string` or `URL`, got `undefined`',
		},
	);
});

test('drive root paths (platform-aware)', () => {
	if (isWindows) {
		assert.strictEqual(fileURLToPath('file:///C:/'), 'C:\\');
		assert.strictEqual(fileURLToPath('file:///c:/'), 'c:\\');
		assert.strictEqual(fileURLToPath('file:///D:/'), 'D:\\');
	} else {
		assert.strictEqual(fileURLToPath('file:///C:/'), '/C:/');
		assert.strictEqual(fileURLToPath('file:///c:/'), '/c:/');
		assert.strictEqual(fileURLToPath('file:///D:/'), '/D:/');
	}
});

test('encoded slash rejection', () => {
	assert.throws(
		() => fileURLToPath('file:///a%2Fb'),
		{
			name: 'TypeError',
			message: /must not include encoded \/ characters/i,
		},
	);

	assert.throws(
		() => fileURLToPath('file:///a%2fb'),
		{
			name: 'TypeError',
			message: /must not include encoded \/ characters/i,
		},
	);
});

test('UNC round-trip with spaces', () => {
	if (isWindows) {
		assert.strictEqual(pathToFileURL('\\\\server\\share\\a b.txt', {windows: true}).href, 'file://server/share/a%20b.txt');
		assert.strictEqual(fileURLToPath('file://server/share/a%20b.txt', {windows: true}), '\\\\server\\share\\a b.txt');
	} else {
		// On Unix, UNC URLs throw
		assert.throws(() => fileURLToPath('file://server/share/a%20b.txt'), TypeError);
	}
});

test('bad percent encodings throw URIError', () => {
	// Invalid UTF-8 sequences throw URIError (matching Node.js behavior)
	assert.throws(
		() => fileURLToPath('file:///a/%E0%A4'),
		{
			name: 'URIError',
		},
	);

	assert.throws(
		() => fileURLToPath('file:///test/%C0'),
		{
			name: 'URIError',
		},
	);
});

test('multiple encoded slashes rejected', () => {
	assert.throws(
		() => fileURLToPath('file:///a/%2F/%2f'),
		{
			name: 'TypeError',
			message: /encoded.*characters/i,
		},
	);

	assert.throws(
		() => fileURLToPath('file:///a/%2Fb%2fc'),
		{
			name: 'TypeError',
			message: /encoded.*characters/i,
		},
	);
});
