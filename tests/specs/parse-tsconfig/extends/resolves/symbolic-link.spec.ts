import fs from 'fs/promises';
import { testSuite, expect } from 'manten';
import { createFixture } from 'fs-fixture';
import { createTsconfigJson, getTscTsconfig } from '../../../../utils.js';
import { parseTsconfig } from '#get-tsconfig';

const validate = async (path: string) => {
	const expectedTsconfig = await getTscTsconfig(path);
	delete expectedTsconfig.files;

	const tsconfig = parseTsconfig(path);
	expect(tsconfig).toStrictEqual(expectedTsconfig);
}

export default testSuite(({ describe }) => {
	describe('symbolic link', ({ test }) => {
		test('extends symlink to file', async () => {
			await using fixture = await createFixture({
				'symlink-source.json': createTsconfigJson({
					compilerOptions: {
						jsx: 'react',
						allowJs: true,
					},
				}),
				'tsconfig.json': createTsconfigJson({
					extends: './symlink.json',
					compilerOptions: {
						strict: true,
					},
				}),
				'file.ts': '',
			});

			await fs.symlink(fixture.getPath('symlink.json'), fixture.getPath('symlink-source.json'));

			await validate(fixture.getPath('tsconfig.json'));
		});

		test('extends file from symlink to directory', async () => {
			await using fixture = await createFixture({
				'symlink-source': {
					'tsconfig.json': createTsconfigJson({
						compilerOptions: {
							jsx: 'react',
							allowJs: true,
						},
					}),
				},
				'tsconfig.json': createTsconfigJson({
					extends: './symlink/tsconfig.json',
					compilerOptions: {
						strict: true,
					},
				}),
				'file.ts': '',
			});

			await fs.symlink(fixture.getPath('symlink'), fixture.getPath('symlink-source'));

			await validate(fixture.getPath('tsconfig.json'));
		});

		test('extends from symlink to file in origin directory', async () => {
			await using fixture = await createFixture({
				'symlink-source': {
					'main.json': createTsconfigJson({
						extends: './base.json',
						compilerOptions: {
							strict: true,
						},
					}),
				},
				'project': {
					'base.json': createTsconfigJson({
						compilerOptions: {
							jsx: 'react',
							allowJs: true,
						},
					}),
					'file.ts': '',
				},
			});

			await fs.symlink(fixture.getPath('project/tsconfig.json'), fixture.getPath('symlink-source/main.json'));

			await validate(fixture.getPath('tsconfig.json'));
		});
	});
});
