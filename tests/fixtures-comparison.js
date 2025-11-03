import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath as nodeFileURLToPath, pathToFileURL as nodePathToFileURL} from 'node:url';
import {fileURLToPath, pathToFileURL} from '../index.js';

const isWindows = process.platform === 'win32';

// Comprehensive fixture list
const pathToURLFixtures = {
	unix: [
		'/',
		'/Users/user/file.txt',
		'/home/user/file.txt',
		'/path/to/file',
		'/path/with spaces/file.txt',
		'/a/b/c',
		'/a//b',
		'/...',
		'/path/to/dir/',
		'/日本語/file.txt',
		'/🙂/🚀',
		'/a#b/c?d',
		'/path/%/file',
		'/Jöhn/file.txt',
		'/path/with\ttab',
		'/path/with\nnewline',
		'/a%2Fb',
		'/.hidden',
		'/path/./file',
		'/path/../file',
		'/a/b/',
		'/foo#1',
		'/foo?bar',
		'/path/with%20spaces',
		// Additional comprehensive cases
		'/path/with@at',
		'/path/with&ampersand',
		'/path/with=equals',
		'/path/with+plus',
		'/path/with~tilde',
		'/path/with[brackets]',
		'/path/with(parens)',
		'/path/with\'quote',
		'/path/with"doublequote',
		'/path:with:colons',
		'/path\\with\\backslashes',
		'/a///b////c',
		'/🎉/🎊/🎈',
		'/Ω/Δ/Σ',
		'/مرحبا/世界',
		'/path;with;semicolons',
		'/path,with,commas',
		'/path|with|pipes',
		'/@user/package',
		'/path/./',
		'/path/../',
	],
	windows: [
		'C:\\',
		'D:\\',
		'C:\\Users\\user\\file.txt',
		'C:\\Program Files\\App',
		'D:\\path\\to\\file',
		'C:/Users/user/file.txt',
		'C:\\🙂\\🚀',
		'C:\\path\\with spaces',
		'C:\\a#b\\c?d',
		'c:\\test',
		'Z:\\file',
		// Additional comprehensive cases
		'A:\\',
		'B:\\test',
		'E:\\data',
		'X:\\path\\to\\file',
		'Y:\\',
		'C:/path/forward/slashes',
		'D:/mixed\\slashes/here',
		'C:\\path$with$dollars',
		'C:\\Users\\Admin',
		'c:\\lowercase\\drive',
		'Z:\\UPPERCASE\\PATH',
		'C:\\path\twith\ttabs',
		'C:\\path#hash',
		'C:\\path%percent',
		'C:\\path@at',
		'C:\\path&amp',
		'C:\\path+plus',
		'C:\\path~tilde',
		'C:\\path=equals',
		'C:\\deep\\nested\\very\\long\\path\\structure\\file.txt',
	],
	unc: [
		'\\\\server\\share\\file.txt',
		'\\\\hostname\\path\\to\\file',
		'\\\\192.168.1.1\\share',
		'\\\\server\\share\\a b.txt',
		'\\\\server\\share',
		'\\\\server\\share\\',
		// Additional comprehensive cases
		'\\\\server-name\\share',
		'\\\\server_name\\share',
		'\\\\my-server\\my-share\\file',
		'\\\\127.0.0.1\\share',
		'\\\\10.0.0.1\\data',
		'\\\\server\\share$',
		'\\\\server\\share\\deep\\path\\file',
		'\\\\SERVER\\SHARE\\FILE',
		'\\\\server123\\share456',
	],
};

const urlToPathFixtures = {
	generic: [
		'file:///',
		'file:///Users/user/file.txt',
		'file:///home/user/file.txt',
		'file:///path/to/file',
		'file:///path/with%20spaces',
		'file:///path/%E4%BD%A0%E5%A5%BD',
		'file:///path/%E2%9C%93',
		'file:///path/%F0%9F%91%8D',
		'file:///%E6%97%A5%E6%9C%AC%E8%AA%9E',
		'file:///path//to///file',
		'file:///path/./to/file',
		'file:///path/../to/file',
		'file:///path/to/dir/',
		'file:///path/%23',
		'file:///path/%3F',
		'file:///a/%25/b',
		'file:///a/%252F/b',
		'file:///a/b%20c?x#y',
		'file:///path?query=value',
		'file:///path#fragment',
		'file://localhost/path',
		// Additional comprehensive cases
		'file:///path/%40at',
		'file:///path/%26ampersand',
		'file:///path/%3Dequals',
		'file:///path/%2Bplus',
		'file:///path/%7Etilde',
		'file:///path/%5Bbracket',
		'file:///path/%28paren',
		'file:///path/%27quote',
		'file:///path/%3Acolon',
		'file:///path/%7Cpipe',
		'file:///path/%2Ccomma',
		'file:///path/%3Bsemicolon',
		'file:///%F0%9F%8E%89/%F0%9F%8E%8A',
		'file:///%CE%A9/%CE%94',
		'file:///%D9%85%D8%B1%D8%AD%D8%A8%D8%A7',
		'file:///a%20b%20c/d%20e%20f',
		'file:///path/with%09tab',
		'file:///path/with%0Anewline',
		'file:///UPPERCASE',
		'file:///MixedCase',
		'file:///a//b//c',
		'file:///path/.hidden',
		'file:///.hidden/file',
		'file:///path/to/...',
		'file:///a%252Fb',
	],
	driveLetters: [
		'file:///C:/',
		'file:///c:/',
		'file:///D:/',
		'file:///C:/Users/user/file.txt',
		'file:///c:/windows/system32',
		'file:///A:/',
		'file:///Z:/file',
		'file:///C:/test',
		'file:///C:/Program%20Files/App',
		'file:///C:/path/to/dir/',
		'file://localhost/C:/test',
		// Additional comprehensive cases
		'file:///B:/',
		'file:///E:/data',
		'file:///X:/path',
		'file:///Y:/',
		'file:///C:/path%23hash',
		'file:///C:/path%3Fquestion',
		'file:///C:/path%26ampersand',
		'file:///C:/path%40at',
		'file:///D:/UPPERCASE',
		'file:///c:/lowercase',
		'file:///C:/deep/nested/path',
		'file:///C:/path%2Bplus',
		'file:///C:/path%7Etilde',
		'file:///C:/path%3Dequals',
	],
	unc: [
		'file://server/share/file.txt',
		'file://hostname/path/to/file',
		'file://192.168.1.1/share',
		'file://server/share/a%20b.txt',
		'file://server/share',
		'file://server/share/',
		// Additional comprehensive cases
		'file://server-name/share',
		'file://server_name/share',
		'file://my-server/my-share/file',
		'file://127.0.0.1/share',
		'file://10.0.0.1/data',
		'file://SERVER/SHARE',
		'file://server123/share456',
		'file://server/share$/file',
		'file://server/share/deep/path',
	],
	caseVariations: [
		'FILE:///test',
		'File:///test',
		'file:///test',
	],
};

const shouldThrowFixtures = {
	pathToFileURL: [
		// Note: Node.js resolves relative paths and empty strings using process.cwd(),
		// but that requires process.cwd() which is not browser-compatible.
		// We throw on relative paths and empty strings, maintaining browser compatibility.
		// All of the following are commented out as they represent known differences:
		// 'relative/path',
		// './relative/path',
		// '../relative/path',
		// '',
		// 'C:foo',  // Windows relative path - Node resolves it, we reject
		// 'C:foo\\bar',
		// 'D:relative\\path',
	],
	fileURLToPath: [
		// Non-file schemes
		'https://example.com',
		'http://localhost/path',
		'ftp://server/file',
		'data:text/plain,hello',
		'mailto:user@example.com',
		// Encoded slashes (forbidden)
		'file:///a%2Fb',
		'file:///a%2fb',
		'file:///%2F',
		'file:///path%2F%2F',
		'file:///a/b%2Fc',
		// Invalid percent encoding (should throw TypeError)
		'file:///test%',
		'file:///test%2',
		'file:///test%G0',
		'file:///test%0G',
		// Incomplete UTF-8 sequences
		'file:///test%C0',
		'file:///test%E0%A4',
		'file:///test%F0%9F',
		// Invalid hostnames on Unix (should throw on Unix platforms)
		// These are tested separately based on platform
	],
	fileURLToPathUnixOnly: [
		// These should only throw on Unix, not Windows
		'file://remote-server/share',
		'file://example.com/path',
		'file://192.168.1.1/data',
		'file://hostname/file',
	],
};

test('pathToFileURL - Unix paths match Node.js (POSIX mode)', () => {
	for (const fixture of pathToURLFixtures.unix) {
		const ours = pathToFileURL(fixture).href;
		const theirs = nodePathToFileURL(fixture, {windows: false}).href;
		assert.strictEqual(
			ours,
			theirs,
			`Mismatch for ${fixture}:\n  Ours:   ${ours}\n  Theirs: ${theirs}`,
		);
	}
});

test('pathToFileURL - Windows paths match Node.js (Windows mode)', () => {
	for (const fixture of pathToURLFixtures.windows) {
		const ours = pathToFileURL(fixture, {windows: true}).href;
		const theirs = nodePathToFileURL(fixture, {windows: true}).href;
		assert.strictEqual(
			ours,
			theirs,
			`Mismatch for ${fixture}:\n  Ours:   ${ours}\n  Theirs: ${theirs}`,
		);
	}
});

test('pathToFileURL - UNC paths match Node.js (Windows mode)', () => {
	for (const fixture of pathToURLFixtures.unc) {
		const ours = pathToFileURL(fixture, {windows: true}).href;
		const theirs = nodePathToFileURL(fixture, {windows: true}).href;
		assert.strictEqual(
			ours,
			theirs,
			`Mismatch for ${fixture}:\n  Ours:   ${ours}\n  Theirs: ${theirs}`,
		);
	}
});

test('fileURLToPath - generic URLs match Node.js (current platform)', () => {
	for (const fixture of urlToPathFixtures.generic) {
		const ours = fileURLToPath(fixture);
		const theirs = nodeFileURLToPath(fixture, {windows: isWindows});
		assert.strictEqual(
			ours,
			theirs,
			`Mismatch for ${fixture}:\n  Ours:   ${ours}\n  Theirs: ${theirs}`,
		);
	}
});

test('fileURLToPath - drive letters match Node.js (POSIX mode)', () => {
	for (const fixture of urlToPathFixtures.driveLetters) {
		const ours = fileURLToPath(fixture);
		const theirs = nodeFileURLToPath(fixture, {windows: isWindows});
		assert.strictEqual(
			ours,
			theirs,
			`Mismatch for ${fixture}:\n  Ours:   ${ours}\n  Theirs: ${theirs}`,
		);
	}
});

test('fileURLToPath - UNC URLs match Node.js (current platform)', () => {
	for (const fixture of urlToPathFixtures.unc) {
		if (isWindows) {
			// On Windows, UNC URLs should work
			const ours = fileURLToPath(fixture);
			const theirs = nodeFileURLToPath(fixture, {windows: isWindows});
			assert.strictEqual(
				ours,
				theirs,
				`Mismatch for ${fixture}:\n  Ours:   ${ours}\n  Theirs: ${theirs}`,
			);
		} else {
			// On Unix, UNC URLs should throw (hostnames not allowed except localhost)
			assert.throws(() => fileURLToPath(fixture), TypeError);
			assert.throws(() => nodeFileURLToPath(fixture, {windows: false}), TypeError);
		}
	}
});

test('fileURLToPath - case variations match Node.js', () => {
	for (const fixture of urlToPathFixtures.caseVariations) {
		const ours = fileURLToPath(fixture);
		const theirs = nodeFileURLToPath(fixture, {windows: isWindows});
		assert.strictEqual(
			ours,
			theirs,
			`Mismatch for ${fixture}:\n  Ours:   ${ours}\n  Theirs: ${theirs}`,
		);
	}
});

test('pathToFileURL - errors match Node.js', () => {
	for (const fixture of shouldThrowFixtures.pathToFileURL) {
		let ourError;
		let theirError;

		try {
			pathToFileURL(fixture);
		} catch (error) {
			ourError = error;
		}

		try {
			nodePathToFileURL(fixture, {windows: isWindows});
		} catch (error) {
			theirError = error;
		}

		assert.ok(
			ourError && theirError,
			`Both should throw for ${fixture}`,
		);

		assert.strictEqual(
			ourError.constructor.name,
			theirError.constructor.name,
			`Error type mismatch for ${fixture}`,
		);
	}
});

test('fileURLToPath - errors match Node.js', () => {
	for (const fixture of shouldThrowFixtures.fileURLToPath) {
		let ourError;
		let theirError;

		try {
			fileURLToPath(fixture);
		} catch (error) {
			ourError = error;
		}

		try {
			nodeFileURLToPath(fixture, {windows: isWindows});
		} catch (error) {
			theirError = error;
		}

		assert.ok(
			ourError && theirError,
			`Both should throw for ${fixture}`,
		);

		assert.strictEqual(
			ourError.constructor.name,
			theirError.constructor.name,
			`Error type mismatch for ${fixture}`,
		);
	}
});

test('round-trip consistency - Unix paths', () => {
	for (const fixture of pathToURLFixtures.unix) {
		// Skip fixtures that aren't meant to round-trip
		if (fixture.includes('//') || fixture.includes('/./') || fixture.includes('/../')) {
			continue;
		}

		const ourURL = pathToFileURL(fixture);
		const theirURL = nodePathToFileURL(fixture, {windows: false});

		assert.strictEqual(ourURL.href, theirURL.href, `URL mismatch for ${fixture}`);

		const ourPath = fileURLToPath(ourURL);
		const theirPath = nodeFileURLToPath(theirURL, {windows: false});

		assert.strictEqual(ourPath, theirPath, `Path mismatch after round-trip for ${fixture}`);
		assert.strictEqual(ourPath, fixture, `Round-trip failed for ${fixture}`);
	}
});

test('URL object properties match', () => {
	const fixtures = [
		'/Users/user/file.txt',
		'/path/with spaces/file.txt',
		'/🙂/file.txt',
	];

	for (const fixture of fixtures) {
		const ours = pathToFileURL(fixture);
		const theirs = nodePathToFileURL(fixture, {windows: false});

		assert.strictEqual(ours.protocol, theirs.protocol, `protocol mismatch for ${fixture}`);
		assert.strictEqual(ours.hostname, theirs.hostname, `hostname mismatch for ${fixture}`);
		assert.strictEqual(ours.pathname, theirs.pathname, `pathname mismatch for ${fixture}`);
		assert.strictEqual(ours.search, theirs.search, `search mismatch for ${fixture}`);
		assert.strictEqual(ours.hash, theirs.hash, `hash mismatch for ${fixture}`);
		assert.strictEqual(ours.href, theirs.href, `href mismatch for ${fixture}`);
	}
});

test('pathToFileURL - returns URL instance', () => {
	const result = pathToFileURL('/test');
	assert.ok(result instanceof URL);
	assert.strictEqual(result.constructor.name, 'URL');
});

test('stress test - many fixtures in sequence', () => {
	const allUnixPaths = [
		...pathToURLFixtures.unix,
		'/a',
		'/ab',
		'/abc',
		'/abcd',
		'/x/y/z',
		'/1/2/3/4/5/6/7/8/9/10',
	];

	for (const fixture of allUnixPaths) {
		const ours = pathToFileURL(fixture).href;
		const theirs = nodePathToFileURL(fixture, {windows: false}).href;
		assert.strictEqual(ours, theirs);
	}
});

test('fileURLToPath with URL objects', () => {
	const fixtures = [
		'file:///test',
		'file:///Users/user/file.txt',
		'file:///path/with%20spaces',
	];

	for (const fixture of fixtures) {
		const urlObject = new URL(fixture);
		const ours = fileURLToPath(urlObject);
		const theirs = nodeFileURLToPath(urlObject, {windows: isWindows});
		assert.strictEqual(ours, theirs, `Mismatch for URL object ${fixture}`);
	}
});

// Tests for explicit options.windows parameter
test('fileURLToPath with explicit windows: true', () => {
	// Drive letter URLs should return Windows paths
	assert.strictEqual(
		fileURLToPath('file:///C:/test', {windows: true}),
		nodeFileURLToPath('file:///C:/test', {windows: true}),
	);

	assert.strictEqual(
		fileURLToPath('file:///D:/path/to/file', {windows: true}),
		nodeFileURLToPath('file:///D:/path/to/file', {windows: true}),
	);

	// UNC paths should work
	assert.strictEqual(
		fileURLToPath('file://server/share/file.txt', {windows: true}),
		nodeFileURLToPath('file://server/share/file.txt', {windows: true}),
	);
});

test('fileURLToPath with explicit windows: false', () => {
	// Drive letter patterns remain as-is in Unix paths
	assert.strictEqual(
		fileURLToPath('file:///C:/test', {windows: false}),
		nodeFileURLToPath('file:///C:/test', {windows: false}),
	);

	assert.strictEqual(
		fileURLToPath('file:///D:/path/to/file', {windows: false}),
		nodeFileURLToPath('file:///D:/path/to/file', {windows: false}),
	);

	// UNC URLs should throw on Unix
	assert.throws(
		() => fileURLToPath('file://server/share/file.txt', {windows: false}),
		TypeError,
	);
	assert.throws(
		() => nodeFileURLToPath('file://server/share/file.txt', {windows: false}),
		TypeError,
	);

	// Regular Unix paths work
	assert.strictEqual(
		fileURLToPath('file:///path/to/file', {windows: false}),
		nodeFileURLToPath('file:///path/to/file', {windows: false}),
	);
});

test('pathToFileURL with explicit windows: true', () => {
	// Windows drive letter paths
	assert.strictEqual(
		pathToFileURL('C:\\test', {windows: true}).href,
		nodePathToFileURL('C:\\test', {windows: true}).href,
	);

	assert.strictEqual(
		pathToFileURL('D:\\path\\to\\file', {windows: true}).href,
		nodePathToFileURL('D:\\path\\to\\file', {windows: true}).href,
	);

	// Windows UNC paths
	assert.strictEqual(
		pathToFileURL('\\\\server\\share\\file.txt', {windows: true}).href,
		nodePathToFileURL('\\\\server\\share\\file.txt', {windows: true}).href,
	);

	// Unix absolute paths (not treated as Windows paths)
	assert.strictEqual(
		pathToFileURL('/path/to/file', {windows: true}).href,
		nodePathToFileURL('/path/to/file', {windows: true}).href,
	);
});

test('pathToFileURL with explicit windows: false', () => {
	// Unix paths work normally
	assert.strictEqual(
		pathToFileURL('/path/to/file', {windows: false}).href,
		nodePathToFileURL('/path/to/file', {windows: false}).href,
	);

	assert.strictEqual(
		pathToFileURL('/Users/user/file.txt', {windows: false}).href,
		nodePathToFileURL('/Users/user/file.txt', {windows: false}).href,
	);

	// Windows patterns should not be recognized as absolute paths
	assert.throws(
		() => pathToFileURL('C:\\test', {windows: false}),
		TypeError,
	);

	assert.throws(
		() => pathToFileURL('\\\\server\\share', {windows: false}),
		TypeError,
	);
});

test('round-trip with explicit options', () => {
	// Windows mode round-trip
	const winPath = 'C:\\Users\\user\\file.txt';
	const winURL = pathToFileURL(winPath, {windows: true});
	const winNodeURL = nodePathToFileURL(winPath, {windows: true});
	assert.strictEqual(winURL.href, winNodeURL.href);
	assert.strictEqual(
		fileURLToPath(winURL, {windows: true}),
		nodeFileURLToPath(winNodeURL, {windows: true}),
	);

	// Unix mode round-trip
	const unixPath = '/Users/user/file.txt';
	const unixURL = pathToFileURL(unixPath, {windows: false});
	const unixNodeURL = nodePathToFileURL(unixPath, {windows: false});
	assert.strictEqual(unixURL.href, unixNodeURL.href);
	assert.strictEqual(
		fileURLToPath(unixURL, {windows: false}),
		nodeFileURLToPath(unixNodeURL, {windows: false}),
	);
});

// Comprehensive error tests
test('fileURLToPath - non-file schemes throw TypeError', () => {
	const nonFileSchemes = [
		'https://example.com',
		'http://localhost/path',
		'ftp://server/file',
		'data:text/plain,hello',
		'mailto:user@example.com',
	];

	for (const fixture of nonFileSchemes) {
		let ourError;
		let theirError;

		try {
			fileURLToPath(fixture);
		} catch (error) {
			ourError = error;
		}

		try {
			nodeFileURLToPath(fixture, {windows: isWindows});
		} catch (error) {
			theirError = error;
		}

		assert.ok(ourError && theirError, `Both should throw for ${fixture}`);
		assert.strictEqual(ourError.constructor.name, theirError.constructor.name);
	}
});

test('fileURLToPath - encoded slashes throw TypeError', () => {
	const encodedSlashCases = [
		'file:///a%2Fb',
		'file:///a%2fb',
		'file:///%2F',
		'file:///path%2F%2F',
		'file:///a/b%2Fc',
	];

	for (const fixture of encodedSlashCases) {
		let ourError;
		let theirError;

		try {
			fileURLToPath(fixture);
		} catch (error) {
			ourError = error;
		}

		try {
			nodeFileURLToPath(fixture, {windows: isWindows});
		} catch (error) {
			theirError = error;
		}

		assert.ok(ourError && theirError, `Both should throw for ${fixture}`);
		assert.strictEqual(ourError.constructor.name, 'TypeError');
		assert.strictEqual(theirError.constructor.name, 'TypeError');
	}
});

test('fileURLToPath - invalid hostnames throw on Unix', () => {
	if (!isWindows) {
		const invalidHostCases = [
			'file://remote-server/share',
			'file://example.com/path',
			'file://192.168.1.1/data',
			'file://hostname/file',
		];

		for (const fixture of invalidHostCases) {
			assert.throws(
				() => fileURLToPath(fixture),
				TypeError,
				`Should throw for ${fixture}`,
			);
			assert.throws(
				() => nodeFileURLToPath(fixture, {windows: false}),
				TypeError,
				`Node should throw for ${fixture}`,
			);
		}
	}
});

test('pathToFileURL - comprehensive special character handling', () => {
	// Test that all special characters are handled consistently with Node.js
	const specialCharPaths = [
		'/path/with@at',
		'/path/with&ampersand',
		'/path/with=equals',
		'/path/with+plus',
		'/path/with~tilde',
		'/path/with[brackets]',
		'/path/with(parens)',
		'/path:with:colons',
		'/path;with;semicolons',
		'/path,with,commas',
	];

	for (const fixture of specialCharPaths) {
		const ours = pathToFileURL(fixture, {windows: false}).href;
		const theirs = nodePathToFileURL(fixture, {windows: false}).href;
		assert.strictEqual(ours, theirs, `Mismatch for ${fixture}`);
	}
});

test('Windows drive roots produce double slash', () => {
	const driveRoots = ['C:\\', 'D:\\', 'Z:\\'];

	for (const root of driveRoots) {
		const ours = pathToFileURL(root, {windows: true}).href;
		const theirs = nodePathToFileURL(root, {windows: true}).href;
		assert.strictEqual(ours, theirs, `Mismatch for ${root}`);
		assert.ok(ours.endsWith('://'), `${root} should produce double slash`);
	}
});

test('UNC without share name throws', () => {
	const invalidUNC = [
		'\\\\server',
		'\\\\server\\',
	];

	for (const fixture of invalidUNC) {
		assert.throws(
			() => pathToFileURL(fixture, {windows: true}),
			{
				name: 'TypeError',
				message: /share name/i,
			},
			`Should throw for ${fixture}`,
		);
	}
});

test('Duplicate slashes are collapsed', () => {
	const duplicateSlashPaths = [
		'/a//b',
		'/a///b',
		'/a////b',
		'/path//to///file',
	];

	for (const fixture of duplicateSlashPaths) {
		const ours = pathToFileURL(fixture, {windows: false}).href;
		const theirs = nodePathToFileURL(fixture, {windows: false}).href;
		assert.strictEqual(ours, theirs, `Mismatch for ${fixture}`);
		// Verify slashes are actually collapsed
		assert.ok(!ours.includes('///', 8), `${fixture} should have collapsed slashes`);
	}
});

test('Unicode handling comprehensive', () => {
	const unicodePaths = [
		'/🎉/🎊/🎈',
		'/Ω/Δ/Σ',
		'/مرحبا/世界',
		'/日本語/file.txt',
		'/Jöhn/file.txt',
	];

	for (const fixture of unicodePaths) {
		const ours = pathToFileURL(fixture, {windows: false}).href;
		const theirs = nodePathToFileURL(fixture, {windows: false}).href;
		assert.strictEqual(ours, theirs, `Mismatch for ${fixture}`);

		// Test round-trip
		const oursBack = fileURLToPath(ours, {windows: false});
		const theirsBack = nodeFileURLToPath(theirs, {windows: false});
		assert.strictEqual(oursBack, theirsBack, `Round-trip mismatch for ${fixture}`);
	}
});
