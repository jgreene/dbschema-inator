import { getDBSchema } from './index';

import { runTests } from 'dbschema-inator/src/tests'

const config = {
    user: 'postgres',
    host: 'localhost',
    database: 'dbschema-inator',
    password: 'postgres',
    port: 5433,
};

test('postgresql dbschema tests', async () => {
    const schema = await getDBSchema(config);

    expect(schema).not.toBeNull()

    runTests('public', schema!);
})
