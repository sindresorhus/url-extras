import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL, fileURLToPath} from '../index.js';

test('Unix absolute paths', () => {
	assert.strictEqual(pathToFileURL('/Users/user/file.txt').href, 'file:///Users/user/file.txt');
	assert.strictEqual(pathToFileURL('/home/user/file.txt').href, 'file:///home/user/file.txt');
	assert.strictEqual(pathToFileURL('/path/to/file').href, 'file:///path/to/file');
});

test('Windows drive letter paths', () => {
	assert.strictEqual(pathToFileURL('C:\\Users\\user\\file.txt', {windows: true}).href, 'file:///C:/Users/user/file.txt');
	assert.strictEqual(pathToFileURL('D:\\path\\to\\file', {windows: true}).href, 'file:///D:/path/to/file');
	assert.strictEqual(pathToFileURL('c:\\windows\\system32', {windows: true}).href, 'file:///c:/windows/system32');
});

test('Windows UNC paths', () => {
	assert.strictEqual(pathToFileURL('\\\\server\\share\\file.txt', {windows: true}).href, 'file://server/share/file.txt');
	assert.strictEqual(pathToFileURL('\\\\hostname\\path\\to\\file', {windows: true}).href, 'file://hostname/path/to/file');
});

test('mixed slashes on Windows', () => {
	assert.strictEqual(pathToFileURL('C:/Users/user/file.txt', {windows: true}).href, 'file:///C:/Users/user/file.txt');
	assert.strictEqual(pathToFileURL('C:\\Users\\user/file.txt', {windows: true}).href, 'file:///C:/Users/user/file.txt');
});

test('throws on relative paths', () => {
	assert.throws(
		() => pathToFileURL('relative/path'),
		{
			name: 'TypeError',
			message: 'The path must be absolute',
		},
	);

	assert.throws(
		() => pathToFileURL('./relative/path'),
		{
			name: 'TypeError',
			message: 'The path must be absolute',
		},
	);

	assert.throws(
		() => pathToFileURL('../relative/path'),
		{
			name: 'TypeError',
			message: 'The path must be absolute',
		},
	);
});

test('throws on non-string', () => {
	assert.throws(
		() => pathToFileURL(123),
		{
			name: 'TypeError',
			message: 'Expected `string`, got `number`',
		},
	);

	assert.throws(
		() => pathToFileURL(null),
		{
			name: 'TypeError',
			message: 'Expected `string`, got `object`',
		},
	);

	assert.throws(
		() => pathToFileURL(undefined),
		{
			name: 'TypeError',
			message: 'Expected `string`, got `undefined`',
		},
	);
});

test('root path edge cases', () => {
	assert.strictEqual(pathToFileURL('/').href, 'file:///');
	assert.strictEqual(pathToFileURL('/path').href, 'file:///path');
});

test('special characters preservation', () => {
	const testPath = '/path/with spaces';
	const url = pathToFileURL(testPath);
	assert.ok(url.href.includes('file://'));
	assert.strictEqual(fileURLToPath(url), testPath);
});

test('Unicode paths', () => {
	const paths = [
		'/path/日本語',
		'/path/✓/file',
		'/path/👍/file',
		'/пу́ть/файл',
	];

	for (const path of paths) {
		const url = pathToFileURL(path);
		assert.ok(url.href.startsWith('file://'));
		assert.strictEqual(fileURLToPath(url), path);
	}
});

test('paths with dots', () => {
	// URL constructor normalizes . and .. segments (Node.js behavior)
	assert.strictEqual(pathToFileURL('/path/./to/file').href, 'file:///path/to/file');
	assert.strictEqual(pathToFileURL('/path/../to/file').href, 'file:///to/file');
	assert.strictEqual(pathToFileURL('/...').href, 'file:///...');
	assert.strictEqual(pathToFileURL('/.').href, 'file:///');
});

test('Windows paths with forward slashes', () => {
	assert.strictEqual(pathToFileURL('C:/path/to/file', {windows: true}).href, 'file:///C:/path/to/file');
	assert.strictEqual(pathToFileURL('C:/Windows/System32', {windows: true}).href, 'file:///C:/Windows/System32');
});

test('Windows UNC edge cases', () => {
	assert.strictEqual(pathToFileURL('\\\\server\\share', {windows: true}).href, 'file://server/share');
	assert.strictEqual(pathToFileURL('\\\\server\\share\\', {windows: true}).href, 'file://server/share/');
	assert.strictEqual(pathToFileURL('\\\\192.168.1.1\\share', {windows: true}).href, 'file://192.168.1.1/share');
});

test('trailing slashes', () => {
	assert.strictEqual(pathToFileURL('/path/to/dir/').href, 'file:///path/to/dir/');
	assert.strictEqual(pathToFileURL('/path/to/file').href, 'file:///path/to/file');
});

test('error messages', () => {
	assert.throws(
		() => pathToFileURL('relative/path'),
		{
			name: 'TypeError',
			message: /absolute/,
		},
	);

	assert.throws(
		() => pathToFileURL(123),
		{
			name: 'TypeError',
			message: /string/,
		},
	);
});

test('empty string throws', () => {
	assert.throws(
		() => pathToFileURL(''),
		{
			name: 'TypeError',
			message: 'The path must be absolute',
		},
	);
});

test('Windows drive letter case preservation', () => {
	assert.strictEqual(pathToFileURL('C:\\test', {windows: true}).href, 'file:///C:/test');
	assert.strictEqual(pathToFileURL('c:\\test', {windows: true}).href, 'file:///c:/test');
	assert.strictEqual(pathToFileURL('Z:\\file', {windows: true}).href, 'file:///Z:/file');
});

test('percent encoding edge cases', () => {
	assert.strictEqual(pathToFileURL('/a/%/b').href, 'file:///a/%25/b');
	assert.strictEqual(pathToFileURL('/a/%2F/b').href, 'file:///a/%252F/b');
});

test('hash and question marks', () => {
	assert.strictEqual(pathToFileURL('/foo#1').href, 'file:///foo%231');
	assert.strictEqual(pathToFileURL('/foo?bar').href, 'file:///foo%3Fbar');
	assert.strictEqual(pathToFileURL('/a#b/c?d').href, 'file:///a%23b/c%3Fd');
});

test('non-BMP Unicode round-trip', () => {
	const paths = ['/🙂/🚀', '/😀/test'];
	for (const path of paths) {
		const url = pathToFileURL(path);
		assert.strictEqual(fileURLToPath(url), path);
	}
});

test('Windows non-BMP Unicode round-trip', () => {
	const paths = ['C:\\🙂\\🚀', 'C:\\😀\\test'];
	for (const path of paths) {
		const url = pathToFileURL(path, {windows: true});
		const result = fileURLToPath(url, {windows: true});
		assert.strictEqual(result.toLowerCase(), path.toLowerCase());
	}
});

test('space encoding', () => {
	assert.strictEqual(pathToFileURL('/a/b c').href, 'file:///a/b%20c');
	assert.strictEqual(pathToFileURL('/path with spaces/file').href, 'file:///path%20with%20spaces/file');
});

test('Windows special characters', () => {
	assert.strictEqual(pathToFileURL('C:\\a#b\\c?d', {windows: true}).href, 'file:///C:/a%23b/c%3Fd');
});

test('returns URL object', () => {
	const url = pathToFileURL('/test');
	assert.ok(url instanceof URL);
	assert.strictEqual(url.protocol, 'file:');
	assert.strictEqual(url.pathname, '/test');
});

test('duplicate slash collapse', () => {
	assert.strictEqual(pathToFileURL('/a//b').href, 'file:///a/b');
	assert.strictEqual(pathToFileURL('/a///b').href, 'file:///a/b');
});

test('Windows drive root paths', () => {
	assert.strictEqual(pathToFileURL('C:\\', {windows: true}).href, 'file:///C://');
	assert.strictEqual(pathToFileURL('D:\\', {windows: true}).href, 'file:///D://');
	assert.strictEqual(pathToFileURL('Z:\\', {windows: true}).href, 'file:///Z://');
});

test('reject Windows relative drive paths', () => {
	assert.throws(
		() => pathToFileURL('C:foo'),
		{
			name: 'TypeError',
			message: 'The path must be absolute',
		},
	);

	assert.throws(
		() => pathToFileURL('D:relative\\path'),
		{
			name: 'TypeError',
			message: 'The path must be absolute',
		},
	);

	assert.throws(
		() => pathToFileURL('C:foo\\bar'),
		{
			name: 'TypeError',
			message: /absolute/i,
		},
	);
});

test('Unix triple-slash formatting', () => {
	assert.strictEqual(pathToFileURL('/').href, 'file:///');
	assert.strictEqual(pathToFileURL('/Users/u').href, 'file:///Users/u');
	assert.strictEqual(pathToFileURL('/a').href, 'file:///a');
	assert.strictEqual(pathToFileURL('/a/b').href, 'file:///a/b');
});

test('UNC without share throws', () => {
	assert.throws(
		() => pathToFileURL('\\\\server', {windows: true}),
		{
			name: 'TypeError',
			message: 'UNC path must include a share name',
		},
	);

	assert.throws(
		() => pathToFileURL('\\\\server\\', {windows: true}),
		{
			name: 'TypeError',
			message: 'UNC path must include a share name',
		},
	);
});
