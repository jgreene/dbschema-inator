import { getDBSchema } from './index';

import { runTests } from 'dbschema-inator/src/tests'

const config = {
    driver: 'msnodesqlv8',
    server: 'localhost',
    database: 'dbschema-inator',
    options: {
        trustedConnection: true
    }
};

test('mssql dbschema tests', async () => {
    const schema = await getDBSchema(config);

    expect(schema).not.toBeNull()

    runTests('dbo', schema!);
})

